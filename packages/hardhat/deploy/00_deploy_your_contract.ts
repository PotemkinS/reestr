import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployRentalDeposit: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy("RentalDeposit", {
    from: deployer,
    log: true,
    autoMine: true,
  });
};

export default deployRentalDeposit;
deployRentalDeposit.tags = ["RentalDeposit"];
