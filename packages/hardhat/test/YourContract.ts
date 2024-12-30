import { expect } from "chai";
import { ethers } from "hardhat";
import { RentalDeposit } from "../typechain-types";

describe("RentalDeposit", function () {
  let rentalDeposit: RentalDeposit;
  let landlord: any;
  let tenant: any;

  before(async () => {
    const [owner, user] = await ethers.getSigners();
    landlord = owner;
    tenant = user;

    const RentalDepositFactory = await ethers.getContractFactory("RentalDeposit");
    rentalDeposit = (await RentalDepositFactory.deploy()) as RentalDeposit;
    await rentalDeposit.waitForDeployment();
  });

  it("Should allow creating a lease", async function () {
    const depositAmount = BigInt(1e18); 
    const startDate = Math.floor(Date.now() / 1000);
    const endDate = startDate + 3600;

    await rentalDeposit
      .connect(tenant)
      .createLease(landlord.address, depositAmount, startDate, endDate, { value: depositAmount });

    const lease = await rentalDeposit.getLeaseDetails(0);

    expect(lease.landlord).to.equal(landlord.address);
    expect(lease.tenant).to.equal(tenant.address);
    expect(lease.depositAmount.toString()).to.equal(depositAmount.toString());
    expect(lease.startDate).to.equal(startDate);
    expect(lease.endDate).to.equal(endDate);
    expect(lease.isActive).to.be.true;
    expect(lease.landlordApproved).to.be.false;
  });

  it("Should allow landlord to approve deposit return", async function () {
    const leaseId = 0;

    await rentalDeposit.connect(landlord).approveDepositReturn(leaseId);

    const lease = await rentalDeposit.getLeaseDetails(leaseId);
    expect(lease.landlordApproved).to.be.true;
  });

  it("Should allow landlord to withdraw deposit after lease ends", async function () {
    const leaseId = 0;

    await ethers.provider.send("evm_increaseTime", [3601]);
    await ethers.provider.send("evm_mine", []);

    const landlordBalanceBefore = await ethers.provider.getBalance(landlord.address);
    await rentalDeposit.connect(landlord).withdrawDeposit(leaseId);
    const landlordBalanceAfter = await ethers.provider.getBalance(landlord.address);

    expect(landlordBalanceAfter).to.be.gt(landlordBalanceBefore);

    const lease = await rentalDeposit.getLeaseDetails(leaseId);
    expect(lease.isActive).to.be.false;
  });

  it("Should allow tenant to return deposit after landlord approval", async function () {
    const depositAmount = BigInt(1e18); 
    const startDate = Math.floor(Date.now() / 1000);
    const endDate = startDate + 3600;

    await rentalDeposit
      .connect(tenant)
      .createLease(landlord.address, depositAmount, startDate, endDate, { value: depositAmount });

    const leaseId = 1;

    await ethers.provider.send("evm_increaseTime", [3601]);
    await ethers.provider.send("evm_mine", []);

    await rentalDeposit.connect(landlord).approveDepositReturn(leaseId);

    const tenantBalanceBefore = await ethers.provider.getBalance(tenant.address);
    await rentalDeposit.connect(tenant).returnDeposit(leaseId);
    const tenantBalanceAfter = await ethers.provider.getBalance(tenant.address);

    expect(tenantBalanceAfter).to.be.gt(tenantBalanceBefore);

    const lease = await rentalDeposit.getLeaseDetails(leaseId);
    expect(lease.isActive).to.be.false;
  });

  it("Should revert if tenant tries to return deposit without landlord approval", async function () {
    const depositAmount = BigInt(1e18); 
    const startDate = Math.floor(Date.now() / 1000);
    const endDate = startDate + 3600;

    await rentalDeposit
      .connect(tenant)
      .createLease(landlord.address, depositAmount, startDate, endDate, { value: depositAmount });

    const leaseId = 2;

    await ethers.provider.send("evm_increaseTime", [3601]);
    await ethers.provider.send("evm_mine", []);

    await expect(rentalDeposit.connect(tenant).returnDeposit(leaseId)).to.be.revertedWith("Landlord has not approved the deposit return");
  });

  it("Should revert if non-landlord tries to withdraw deposit", async function () {
    const leaseId = 0;

    await expect(rentalDeposit.connect(tenant).withdrawDeposit(leaseId)).to.be.revertedWith("Only the landlord can perform this action");
  });

  it("Should revert if non-tenant tries to return deposit", async function () {
    const leaseId = 1;

    await expect(rentalDeposit.connect(landlord).returnDeposit(leaseId)).to.be.revertedWith("Only the tenant can perform this action");
  });
});
