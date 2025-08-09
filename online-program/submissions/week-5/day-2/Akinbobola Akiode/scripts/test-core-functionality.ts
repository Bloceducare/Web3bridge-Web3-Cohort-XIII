import { ethers } from "hardhat";

async function main() {
  console.log("🧪 Testing Core Functionality (Gas Optimized)...");

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer: ${deployer.address}`);

  const baseURI = "ipfs://QmfE733vdAm7V3WQVQrE24yddUJvBYs4FAtLuaK5AsvZyz/";
  
  console.log("\n🚀 Deploying EventContract...");
  const EventContract = await ethers.getContractFactory("EventContract");
  const eventContract = await EventContract.deploy(baseURI, {
    gasLimit: 3000000,
    gasPrice: ethers.parseUnits("1", "gwei")
  });
  await eventContract.waitForDeployment();
  
  const contractAddress = await eventContract.getAddress();
  console.log(`✅ Contract deployed: ${contractAddress}`);

  // Reuse the same signer for all roles
  const eventContractWithOrganizer = eventContract.connect(deployer);
  const eventContractWithBuyer1 = eventContract.connect(deployer);
  const eventContractWithBuyer2 = eventContract.connect(deployer);

  console.log("\n🎪 Creating events...");

  const currentTime = Math.floor(Date.now() / 1000);
  const futureTime = currentTime + 86400 * 30;

  const tx1 = await eventContractWithOrganizer.createEvent(
    "Test Paid Event",
    "A test paid event",
    futureTime,
    futureTime + 86400,
    ethers.parseEther("0.001"),
    "ipfs://test-banner",
    1,
    10,
    {
      gasLimit: 500000,
      gasPrice: ethers.parseUnits("1", "gwei")
    }
  );
  await tx1.wait();
  console.log("✅ Paid event created");

  const tx2 = await eventContractWithOrganizer.createEvent(
    "Test Free Event",
    "A test free event",
    futureTime + 86400,
    futureTime + 86400 * 2,
    ethers.parseEther("0"),
    "ipfs://test-banner",
    0,
    5,
    {
      gasLimit: 500000,
      gasPrice: ethers.parseUnits("1", "gwei")
    }
  );
  await tx2.wait();
  console.log("✅ Free event created");

  console.log("\n🎫 Buying tickets...");

  const buyTicket1 = await eventContractWithBuyer1.buyTicket(1, {
    value: ethers.parseEther("0.001"),
    gasLimit: 300000,
    gasPrice: ethers.parseUnits("1", "gwei")
  });
  await buyTicket1.wait();
  console.log("✅ Paid ticket bought");

  const buyTicket2 = await eventContractWithBuyer2.buyTicket(2, {
    gasLimit: 300000,
    gasPrice: ethers.parseUnits("1", "gwei")
  });
  await buyTicket2.wait();
  console.log("✅ Free ticket bought");

  console.log("\n🔄 Testing ticket transfer...");
  const transferTx = await eventContractWithBuyer1.transferFrom(deployer.address, "0x0000000000000000000000000000000000000001", 1, {
    gasLimit: 300000,
    gasPrice: ethers.parseUnits("1", "gwei")
  });
  await transferTx.wait();
  console.log("✅ Ticket transferred successfully");

  console.log("\n💰 Testing proceeds withdrawal...");
  const balanceBefore = await ethers.provider.getBalance(deployer.address);
  const withdrawTx = await eventContractWithOrganizer.withdrawProceeds(1, {
    gasLimit: 300000,
    gasPrice: ethers.parseUnits("1", "gwei")
  });
  await withdrawTx.wait();
  const balanceAfter = await ethers.provider.getBalance(deployer.address);
  console.log(`✅ Proceeds withdrawn: ${ethers.formatEther(balanceAfter - balanceBefore)} ETH`);

  console.log("\n📊 Checking final state...");
  const event1 = await eventContract.events(1);
  const event2 = await eventContract.events(2);
  const ticket1 = await eventContract.tickets(1);
  const ticket2 = await eventContract.tickets(2);

  console.log(`Event 1: ${event1.title} - Tickets sold: ${event1.ticketsSold}/${event1.totalTickets} - Type: ${event1.eventType === 1 ? "Paid" : "Free"}`);
  console.log(`Event 2: ${event2.title} - Tickets sold: ${event2.ticketsSold}/${event2.totalTickets} - Type: ${event2.eventType === 1 ? "Paid" : "Free"}`);
  console.log(`Ticket 1 owner: ${ticket1.owner}`);
  console.log(`Ticket 2 owner: ${ticket2.owner}`);

  console.log("\n🎯 Core functionality test completed successfully!");
  console.log(`Contract address: ${contractAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 