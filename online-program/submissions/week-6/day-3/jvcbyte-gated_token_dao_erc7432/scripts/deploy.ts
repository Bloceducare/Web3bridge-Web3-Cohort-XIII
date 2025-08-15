import { ethers, upgrades } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("Deploying contracts with the account:", deployer);

  // Deploy ERC7432 contract
  console.log("Deploying ERC7432...");
  const ERC7432 = await ethers.getContractFactory("ERC7432");
  const erc7432 = await ERC7432.deploy(deployer);
  await erc7432.deployed();
  console.log("ERC7432 deployed to:", erc7432.address);

  // Deploy DAOToken (ERC721)
  console.log("Deploying DAOToken...");
  const DAOToken = await ethers.getContractFactory("DAOToken");
  const daoToken = await DAOToken.deploy(
    "DAOToken",
    "DTK",
    "https://api.dao-token.com/token/",
    deployer
  );
  await daoToken.deployed();
  console.log("DAOToken deployed to:", daoToken.address);

  // Deploy DAORoles contract
  console.log("Deploying DAORoles...");
  const DAORoles = await ethers.getContractFactory("DAORoles");
  const daoRoles = await upgrades.deployProxy(
    DAORoles,
    [erc7432.address, daoToken.address, deployer],
    { initializer: 'initialize' }
  );
  await daoRoles.deployed();
  console.log("DAORoles deployed to:", daoRoles.address);

  // Grant roles to the DAORoles contract
  console.log("Setting up roles...");
  const MINTER_ROLE = await daoToken.MINTER_ROLE();
  const BURNER_ROLE = await daoToken.BURNER_ROLE();
  
  // Grant minter and burner roles to the deployer (for testing)
  await daoToken.grantRole(MINTER_ROLE, deployer);
  await daoToken.grantRole(BURNER_ROLE, deployer);
  
  console.log("Setup complete!");
  console.log("\nDeployment Summary:");
  console.log("==================");
  console.log(`ERC7432: ${erc7432.address}`);
  console.log(`DAOToken: ${daoToken.address}`);
  console.log(`DAORoles: ${daoRoles.address}`);
  console.log("\nAdmin:", deployer);
};

export default func;
func.tags = ["all"];
