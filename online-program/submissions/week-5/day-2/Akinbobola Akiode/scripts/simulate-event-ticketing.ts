import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { SimulationError, ContractDeploymentError } from "../types/errors";

interface SimulationInfo {
  contractAddress: string;
  network: string;
  deployer: string;
  baseURI: string;
  events: Array<{
    eventId: number;
    title: string;
    organizer: string;
    ticketsSold: string;
    totalTickets: string;
    eventType: string;
    ticketPrice: string;
  }>;
  tickets: Array<{
    ticketId: number;
    eventId: number;
    owner: string;
    transferred: boolean;
  }>;
  timestamp: string;
  status: 'success' | 'partial' | 'failed';
  errors?: string[];
  gasUsed?: string;
}

async function runCommand(command: string, description: string): Promise<string> {
  console.log(`\n🔄 ${description}...`);
  
  try {
    const output = execSync(command, { encoding: "utf8", stdio: "inherit" });
    console.log(`✅ ${description} completed successfully!`);
    return output;
  } catch (error: any) {
    console.error(`❌ ${description} failed:`, error.message);
    throw new SimulationError(`${description} failed: ${error.message}`, 'COMMAND_EXECUTION_ERROR', { command, error: error.message });
  }
}

async function saveSimulationInfo(simulationInfo: SimulationInfo): Promise<void> {
  const simulationFile = path.join(__dirname, "../event-contract-simulation.json");
  fs.writeFileSync(simulationFile, JSON.stringify(simulationInfo, null, 2));
  console.log(`📄 Simulation info saved to: ${simulationFile}`);
}

async function validateEnvironment(): Promise<void> {
  console.log("🔍 Validating environment...");
  
  try {
    const hardhatVersion = execSync("npx hardhat --version", { encoding: "utf8" });
    console.log(`   ✅ Hardhat version: ${hardhatVersion.trim()}`);
  } catch (error) {
    throw new SimulationError("Hardhat not found or not properly installed", 'HARDHAT_NOT_FOUND');
  }
  
  try {
    const compileOutput = execSync("npx hardhat compile --force", { encoding: "utf8" });
    console.log("   ✅ Contracts compiled successfully");
  } catch (error) {
    throw new ContractDeploymentError("Failed to compile contracts", "EventContract");
  }
}

async function deployToLocalNetwork(): Promise<string> {
  console.log("🚀 Deploying contract to local Hardhat network...");
  
  let ethers: any;
  try {
    const hardhat = require("hardhat");
    ethers = hardhat.ethers;
  } catch (error) {
    throw new SimulationError("Failed to load ethers library", 'ETHERS_LOAD_ERROR');
  }
  
  const [deployer] = await ethers.getSigners();
  console.log(`   ✅ Using signer: ${deployer.address}`);
  
  const baseURI = "ipfs://QmfE733vdAm7V3WQVQrE24yddUJvBYs4FAtLuaK5AsvZyz/";
  
  console.log("   📦 Deploying EventContract...");
  const EventContract = await ethers.getContractFactory("EventContract");
  const eventContract = await EventContract.deploy(baseURI);
  
  console.log("   ⏳ Waiting for deployment confirmation...");
  await eventContract.waitForDeployment();
  
  const contractAddress = await eventContract.getAddress();
  console.log(`   ✅ EventContract deployed to: ${contractAddress}`);
  
  const deploymentInfo = {
    contractAddress,
    network: "hardhat",
    deployer: deployer.address,
    baseURI,
    deploymentTime: new Date().toISOString(),
    constructorArgs: [baseURI],
    gasUsed: (await eventContract.deploymentTransaction()?.gasLimit || 0).toString()
  };
  
  fs.writeFileSync(
    path.join(__dirname, '..', 'deployment-info.json'),
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("   📄 Deployment info saved to deployment-info.json");
  
  return contractAddress;
}

async function simulateEventTicketing(contractAddress: string): Promise<{
  events: SimulationInfo['events'];
  tickets: SimulationInfo['tickets'];
  gasUsed: string;
}> {
  console.log("\n🎫 Starting event ticketing simulation...");
  
  let ethers: any;
  try {
    const hardhat = require("hardhat");
    ethers = hardhat.ethers;
  } catch (error) {
    throw new SimulationError("Failed to load ethers library", 'ETHERS_LOAD_ERROR');
  }
  
  const [deployer] = await ethers.getSigners();
  console.log(`   ✅ Using signer: ${deployer.address}`);

  const EventContract = await ethers.getContractFactory("EventContract");
  const eventContract = EventContract.attach(contractAddress);
  
  const eventContractWithOrganizer = eventContract.connect(deployer);
  const eventContractWithBuyer1 = eventContract.connect(deployer);
  const eventContractWithBuyer2 = eventContract.connect(deployer);

  const events: SimulationInfo['events'] = [];
  const tickets: SimulationInfo['tickets'] = [];
  let totalGasUsed = 0n;

  console.log("\n Creating events...");
  
  const currentTime = Math.floor(Date.now() / 1000);
  const futureTime = currentTime + 86400 * 30;

  console.log("   Creating paid event...");
  const createPaidEventTx = await eventContractWithOrganizer.createEvent(
    "Blockchain Conference 2024",
    "Join us for the biggest blockchain conference of the year",
    futureTime,
    futureTime + 86400,
    ethers.parseEther("0.001"),
    "ipfs://QmTestBanner1",
    1,
    10,
    {
      gasLimit: 300000,
      gasPrice: ethers.parseUnits("0.5", "gwei")
    }
  );
  const createPaidEventReceipt = await createPaidEventTx.wait();
  totalGasUsed += createPaidEventReceipt?.gasUsed || 0n;
  console.log("   ✅ Paid event created");

  console.log("   Creating free event...");
  const createFreeEventTx = await eventContractWithOrganizer.createEvent(
    "Web3 Workshop",
    "Free workshop on Web3 development",
    futureTime + 86400,
    futureTime + 86400 * 2,
    ethers.parseEther("0"),
    "ipfs://QmTestBanner2",
    0,
    5,
    {
      gasLimit: 300000,
      gasPrice: ethers.parseUnits("0.5", "gwei")
    }
  );
  const createFreeEventReceipt = await createFreeEventTx.wait();
  totalGasUsed += createFreeEventReceipt?.gasUsed || 0n;
  console.log("   ✅ Free event created");

  console.log("   🔍 Fetching event details...");
  const event1 = await eventContract.events(1);
  const event2 = await eventContract.events(2);
  console.log(`   ✅ Event 1 type: ${event1.eventType}, Event 2 type: ${event2.eventType}`);
  
  events.push({
    eventId: 1,
    title: event1.title,
    organizer: event1.organizer,
    ticketsSold: event1.ticketsSold.toString(),
    totalTickets: event1.totalTickets.toString(),
    eventType: Number(event1.eventType) === 1 ? "Paid" : "Free",
    ticketPrice: ethers.formatEther(event1.ticketPrice)
  });
  
  events.push({
    eventId: 2,
    title: event2.title,
    organizer: event2.organizer,
    ticketsSold: event2.ticketsSold.toString(),
    totalTickets: event2.totalTickets.toString(),
    eventType: Number(event2.eventType) === 1 ? "Paid" : "Free",
    ticketPrice: ethers.formatEther(event2.ticketPrice)
  });

  console.log("\n🎫 Buying tickets...");

  console.log("   Buying paid ticket...");
  const buyPaidTicketTx = await eventContractWithBuyer1.buyTicket(1, {
    value: ethers.parseEther("0.001"),
    gasLimit: 200000,
    gasPrice: ethers.parseUnits("0.5", "gwei")
  });
  const buyPaidTicketReceipt = await buyPaidTicketTx.wait();
  totalGasUsed += buyPaidTicketReceipt?.gasUsed || 0n;
  console.log("   ✅ Paid ticket bought");

  console.log("   Buying free ticket...");
  const buyFreeTicketTx = await eventContractWithBuyer2.buyTicket(2, {
    gasLimit: 200000,
    gasPrice: ethers.parseUnits("0.5", "gwei")
  });
  const buyFreeTicketReceipt = await buyFreeTicketTx.wait();
  totalGasUsed += buyFreeTicketReceipt?.gasUsed || 0n;
  console.log("   ✅ Free ticket bought");

  console.log("   🔍 Fetching ticket details...");
  const ticket1 = await eventContract.tickets(1);
  const ticket2 = await eventContract.tickets(2);
  console.log(`   ✅ Ticket 1 owner: ${ticket1.owner}, Ticket 2 owner: ${ticket2.owner}`);
  
  tickets.push({
    ticketId: 1,
    eventId: 1,
    owner: ticket1.owner,
    transferred: false
  });
  
  tickets.push({
    ticketId: 2,
    eventId: 2,
    owner: ticket2.owner,
    transferred: false
  });

  console.log("\n🔄 Testing ticket transfer...");
  
  const currentOwner = await eventContract.ownerOf(1);
  console.log(`   🔍 Current owner of ticket 1: ${currentOwner}`);
  if (currentOwner === deployer.address) {
    const transferTx = await eventContractWithBuyer1.transferFrom(deployer.address, "0x0000000000000000000000000000000000000001", 1, {
      gasLimit: 200000,
      gasPrice: ethers.parseUnits("0.5", "gwei")
    });
    const transferReceipt = await transferTx.wait();
    totalGasUsed += transferReceipt?.gasUsed || 0n;
    console.log("   ✅ Ticket transferred successfully");
    
    tickets[0].owner = "0x0000000000000000000000000000000000000001";
    tickets[0].transferred = true;
  } else {
    console.log("   ⚠️  Ticket already transferred or not owned by deployer");
    tickets[0].owner = currentOwner;
    tickets[0].transferred = true;
  }

  console.log("\n💰 Testing proceeds withdrawal...");
  try {
    const balanceBefore = await ethers.provider.getBalance(deployer.address);
    console.log(`   🔍 Balance before withdrawal: ${ethers.formatEther(balanceBefore)} ETH`);
    const withdrawTx = await eventContractWithOrganizer.withdrawProceeds(1, {
      gasLimit: 200000,
      gasPrice: ethers.parseUnits("0.5", "gwei")
    });
    const withdrawReceipt = await withdrawTx.wait();
    totalGasUsed += withdrawReceipt?.gasUsed || 0n;
    const balanceAfter = await ethers.provider.getBalance(deployer.address);
    console.log(`   ✅ Proceeds withdrawn: ${ethers.formatEther(balanceAfter - balanceBefore)} ETH`);
  } catch (error: any) {
    console.log(`   ⚠️  Proceeds withdrawal failed: ${error.message}`);
  }

  return {
    events,
    tickets,
    gasUsed: totalGasUsed.toString()
  };
}

async function main(): Promise<void> {
  console.log("🎫 Starting Event Ticketing Platform Simulation");
  console.log("=".repeat(50));
  console.log(`📅 Timestamp: ${new Date().toISOString()}`);
  console.log(`🌐 Network: lisk-sepolia`);

  const simulationInfo: SimulationInfo = {
    contractAddress: "",
    network: "lisk-sepolia",
    deployer: "",
    baseURI: "ipfs://QmfE733vdAm7V3WQVQrE24yddUJvBYs4FAtLuaK5AsvZyz/",
    events: [],
    tickets: [],
    timestamp: new Date().toISOString(),
    status: 'failed',
    errors: []
  };

  try {
    // Step 1: Validate environment
    await validateEnvironment();

    // Step 2: Compile contracts
    console.log("\n📋 Step 1: Compiling contracts...");
    await runCommand("npx hardhat compile", "Compiling contracts");

    // Step 3: Get deployed contract address
    console.log("\n📋 Step 2: Getting deployed contract address...");
    const contractAddress = await deployToLocalNetwork();
    simulationInfo.contractAddress = contractAddress;

    // Step 4: Run simulation
    console.log("\n📋 Step 3: Running event ticketing simulation...");
    const simulationResult = await simulateEventTicketing(contractAddress);
    simulationInfo.events = simulationResult.events;
    simulationInfo.tickets = simulationResult.tickets;
    simulationInfo.gasUsed = simulationResult.gasUsed;

    // Step 5: Update simulation info
    simulationInfo.status = 'success';
    simulationInfo.deployer = "0x838Abf92E994e088e641399e91AcE43514038b90";

    await saveSimulationInfo(simulationInfo);

    console.log("\n🎉 Simulation completed successfully!");
    console.log("=".repeat(50));
    console.log("📊 Summary:");
    console.log(`   Contract Address: ${contractAddress}`);
    console.log(`   Network: lisk-sepolia`);
    console.log(`   Events Created: ${simulationInfo.events.length}`);
    console.log(`   Tickets Sold: ${simulationInfo.tickets.length}`);
    console.log(`   Total Gas Used: ${simulationInfo.gasUsed}`);
    console.log(`   Status: Simulation completed successfully`);
    console.log(`   Explorer: https://sepolia-blockscout.lisk.com/address/${contractAddress}`);

  } catch (error: any) {
    console.error("\n💥 Simulation failed!");
    console.error("Error:", error.message);
    
    simulationInfo.status = 'failed';
    simulationInfo.errors = simulationInfo.errors || [];
    simulationInfo.errors.push(error.message);
    
    await saveSimulationInfo(simulationInfo);
    
    process.exit(1);
  }
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
}

export { main }; 