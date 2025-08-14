import { ethers } from "hardhat";
import { network } from "hardhat";

type VRFConfig = {
  vrfCoordinator: string;
  gasLane: string;
  subscriptionId: number;
  callbackGasLimit: number;
};

const VRF_CONFIG: Record<number, VRFConfig> = {
  // Sepolia
  11155111: {
    vrfCoordinator: "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625",
    gasLane:
      "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
    subscriptionId: 0, // TODO: set your real subId
    callbackGasLimit: 500_000,
  },
  // Polygon Mumbai (legacy)
  80001: {
    vrfCoordinator: "0x7a1BaC17Ccc5b313516C5E16fb24f7659aA5ebed",
    gasLane:
      "0x4b09e658ed251bcafeebbc69400383d49f344ace09b9576fe248bb02c003fe9f",
    subscriptionId: 0, // TODO: set your real subId
    callbackGasLimit: 500_000,
  },
  // Hardhat local
  31337: {
    vrfCoordinator: "0x0000000000000000000000000000000000000000", // placeholder, replaced after mock deploy
    gasLane:
      "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
    subscriptionId: 0, // will be created via mock
    callbackGasLimit: 500_000,
  },
};

async function deployVRFMock(): Promise<{ coordinatorAddr: string; subId: number }> {
  console.log("➤ Deploying VRFCoordinatorV2Mock…");
  // Standard values used in many examples:
  const BASE_FEE = ethers.utils.parseEther("0.25"); // LINK
  const GAS_PRICE_LINK = 1e9; // 0.000000001 LINK per gas

  const VRFMockFactory = await ethers.getContractFactory("VRFCoordinatorV2Mock");
  const vrfMock = await VRFMockFactory.deploy(BASE_FEE, GAS_PRICE_LINK);
  await vrfMock.deployed();
  console.log("   VRFCoordinatorV2Mock at:", vrfMock.address);

  const tx = await vrfMock.createSubscription();
  const receipt = await tx.wait();

  // Extract subId from the emitted event
  const created = receipt.events?.find((e) => e.event === "SubscriptionCreated");
  const subId = created?.args?.subId?.toNumber?.() ?? 1;

  console.log("   Created mock VRF subscription:", subId);
  return { coordinatorAddr: vrfMock.address, subId };
}

async function deployMockTokensIfPresent() {
  try {
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const erc20 = await MockERC20.deploy(
      "Test Token",
      "TEST",
      ethers.utils.parseEther("1000000")
    );
    await erc20.deployed();
    console.log("   MockERC20 at:", erc20.address);
  } catch {
    console.log("   Skipping MockERC20 (contract not found).");
  }

  try {
    const MockERC721 = await ethers.getContractFactory("MockERC721");
    const erc721 = await MockERC721.deploy("Test NFT", "TNFT");
    await erc721.deployed();
    console.log("   MockERC721 at:", erc721.address);
  } catch {
    console.log("   Skipping MockERC721 (contract not found).");
  }

  try {
    const MockERC1155 = await ethers.getContractFactory("MockERC1155");
    const erc1155 = await MockERC1155.deploy("https://test.com/{id}.json");
    await erc1155.deployed();
    console.log("   MockERC1155 at:", erc1155.address);
  } catch {
    console.log("   Skipping MockERC1155 (contract not found).");
  }
}

async function main() {
  const [deployer] = await ethers.getSigners();
  const chainId = Number(network.config.chainId);
  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH");
  console.log("Network:", network.name, "ChainId:", chainId);

  let vrfConfig = VRF_CONFIG[chainId];
  if (!vrfConfig) {
    throw new Error(`No VRF config for chainId ${chainId}`);
  }

  // Local: deploy mock + create subscription
  let createdSubId: number | null = null;
  if (chainId === 31337) {
    const { coordinatorAddr, subId } = await deployVRFMock();
    vrfConfig = {
      ...vrfConfig,
      vrfCoordinator: coordinatorAddr,
      subscriptionId: subId,
    };
    await deployMockTokensIfPresent();
  }

  console.log("Using VRF Config:", vrfConfig);

  console.log("➤ Deploying LootBox…");
  const LootBoxFactory = await ethers.getContractFactory("LootBox");
  const lootBox = await LootBoxFactory.deploy(
    vrfConfig.subscriptionId,
    vrfConfig.vrfCoordinator,
    vrfConfig.gasLane,
    vrfConfig.callbackGasLimit
  );
  await lootBox.deployed();

  console.log("   LootBox at:", lootBox.address);
  console.log("   Deploy tx:", lootBox.deployTransaction.hash);

  // Local: add LootBox as VRF consumer
  if (chainId === 31337) {
    const vrf = await ethers.getContractAt("VRFCoordinatorV2Mock", vrfConfig.vrfCoordinator);
    await (await vrf.addConsumer(vrfConfig.subscriptionId, lootBox.address)).wait();
    console.log("   Added LootBox as VRF consumer for subId", vrfConfig.subscriptionId);
    createdSubId = vrfConfig.subscriptionId;
  }

  // Basic sanity reads (adjust according to your contract)
  try {
    const price = await (lootBox as any).boxPrice();
    console.log("Box Price:", ethers.utils.formatEther(price), "ETH");
  } catch {
    console.log("   (boxPrice() not found or not public; skipping)");
  }

  try {
    const total = await (lootBox as any).totalRewardTypes();
    console.log("Total Reward Types:", total.toString());
  } catch {
    console.log("   (totalRewardTypes() not found or not public; skipping)");
  }

  const deploymentInfo = {
    network: network.name,
    chainId,
    lootBox: lootBox.address,
    vrfCoordinator: vrfConfig.vrfCoordinator,
    subscriptionId: vrfConfig.subscriptionId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
  };
  console.log("\n=== Deployment Complete ===");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  if (chainId !== 31337) {
    console.log("\n⚠️  NEXT STEPS (live testnets):");
    console.log("1) Create a VRF v2 subscription at https://vrf.chain.link/");
    console.log("2) Fund it with LINK.");
    console.log("3) Add your LootBox as a consumer:", lootBox.address);
    console.log("4) Set the real subscriptionId in your config/env and redeploy if needed.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
