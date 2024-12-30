// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract RentalDeposit {
    struct Lease {
        address landlord;
        address tenant;
        uint256 depositAmount;
        uint256 startDate;
        uint256 endDate;
        bool isActive;
        bool landlordApproved;
        bool depositWithdrawn;
    }

    Lease[] public leases;

    event LeaseCreated(
        uint256 leaseId,
        address indexed landlord,
        address indexed tenant,
        uint256 depositAmount,
        uint256 startDate,
        uint256 endDate
    );
    event DepositWithdrawn(uint256 leaseId, address indexed landlord);
    event DepositReturned(uint256 leaseId, address indexed tenant);
    event LandlordApproved(uint256 leaseId);

    modifier onlyLandlord(uint256 _leaseId) {
        require(msg.sender == leases[_leaseId].landlord, "Only the landlord can perform this action");
        _;
    }

    modifier onlyTenant(uint256 _leaseId) {
        require(msg.sender == leases[_leaseId].tenant, "Only the tenant can perform this action");
        _;
    }

    modifier leaseExists(uint256 _leaseId) {
        require(_leaseId < leases.length, "Lease does not exist");
        _;
    }

    function createLease(
        address _landlord,
        uint256 _depositAmount,
        uint256 _startDate,
        uint256 _endDate
    ) public payable {
        require(msg.value == _depositAmount, "Sent value does not match deposit amount");
        require(_startDate < _endDate, "Start date must be before end date");

        Lease memory newLease = Lease({
            landlord: _landlord,
            tenant: msg.sender,
            depositAmount: _depositAmount,
            startDate: _startDate,
            endDate: _endDate,
            isActive: true,
            landlordApproved: false,
            depositWithdrawn: false
        });

        leases.push(newLease);
        uint256 leaseId = leases.length - 1;

        emit LeaseCreated(leaseId, _landlord, msg.sender, _depositAmount, _startDate, _endDate);
    }

    function approveDepositReturn(uint256 _leaseId) public leaseExists(_leaseId) onlyLandlord(_leaseId) {
        Lease storage lease = leases[_leaseId];
        require(lease.isActive, "Lease is not active");

        lease.landlordApproved = true;
        emit LandlordApproved(_leaseId);
    }

    function withdrawDeposit(uint256 _leaseId) public leaseExists(_leaseId) onlyLandlord(_leaseId) {
        Lease storage lease = leases[_leaseId];
        require(block.timestamp > lease.endDate, "Lease period has not ended yet");
        require(lease.isActive, "Lease is not active");
        require(!lease.depositWithdrawn, "Deposit has already been withdrawn");

        lease.isActive = false;
        lease.depositWithdrawn = true;
        payable(lease.landlord).transfer(lease.depositAmount);

        emit DepositWithdrawn(_leaseId, lease.landlord);
    }

    function returnDeposit(uint256 _leaseId) public leaseExists(_leaseId) onlyTenant(_leaseId) {
        Lease storage lease = leases[_leaseId];
        require(block.timestamp > lease.endDate, "Lease period has not ended yet");
        require(lease.isActive, "Lease is not active");
        require(lease.landlordApproved, "Landlord has not approved the deposit return");
        require(!lease.depositWithdrawn, "Deposit has already been withdrawn");

        lease.isActive = false;
        lease.depositWithdrawn = true;
        payable(lease.tenant).transfer(lease.depositAmount);

        emit DepositReturned(_leaseId, lease.tenant);
    }

    function getLeaseDetails(uint256 _leaseId)
        public
        view
        leaseExists(_leaseId)
        returns (
            address landlord,
            address tenant,
            uint256 depositAmount,
            uint256 startDate,
            uint256 endDate,
            bool isActive,
            bool landlordApproved,
            bool depositWithdrawn
        )
    {
        Lease storage lease = leases[_leaseId];
        return (
            lease.landlord,
            lease.tenant,
            lease.depositAmount,
            lease.startDate,
            lease.endDate,
            lease.isActive,
            lease.landlordApproved,
            lease.depositWithdrawn
        );
    }

    function getLeaseCount() public view returns (uint256) {
        return leases.length;
    }

    receive() external payable {}

    fallback() external payable {}
}
