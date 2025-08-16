import { ethers } from "hardhat";
import * as fs from 'fs';
import * as path from 'path';

async function testContract() {
  console.log("🧪 Starting comprehensive contract testing...");

  const signers = await ethers.getSigners();
  console.log(`Found ${signers.length} signers`);
  
  // Use the available signers, reusing if needed
  const deployer = signers[0];
  const organizer = signers.length > 1 ? signers[1] : signers[0];
  const buyer1 = signers.length > 2 ? signers[2] : signers[0];
  const buyer2 = signers.length > 3 ? signers[3] : signers[0];
  const buyer3 = signers.length > 4 ? signers[4] : signers[0];

  console.log("👥 Test accounts:");
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Organizer: ${organizer.address}`);
  console.log(`Buyer 1: ${buyer1.address}`);
  console.log(`Buyer 2: ${buyer2.address}`);
  console.log(`Buyer 3: ${buyer3.address}`);

  const baseURI = "ipfs://QmTestURI/";
  
  console.log("\n🚀 Deploying test contract...");
  const EventContract = await ethers.getContractFactory("EventContract");
  const eventContract = await EventContract.deploy(baseURI);
  await eventContract.waitForDeployment();
  
  const contractAddress = await eventContract.getAddress();
  console.log(`✅ Test contract deployed: ${contractAddress}`);

  const testResults = {
    contractAddress,
    tests: [] as any[],
    timestamp: new Date().toISOString()
  };

  async function runTest(testName: string, testFunction: () => Promise<void>) {
    try {
      console.log(`\n🧪 Running test: ${testName}`);
      await testFunction();
      console.log(`✅ ${testName} - PASSED`);
      testResults.tests.push({ name: testName, status: "PASSED" });
    } catch (error: any) {
      console.log(`❌ ${testName} - FAILED`);
      console.log(`Error: ${error.message}`);
      testResults.tests.push({ name: testName, status: "FAILED", error: error.message });
    }
  }

  await runTest("Event Creation", async () => {
    const currentTime = Math.floor(Date.now() / 1000);
    const futureTime = currentTime + 86400;

    const tx = await eventContract.connect(organizer).createEvent(
      "Test Conference",
      "A test conference for testing",
      futureTime,
      futureTime + 86400,
      ethers.parseEther("0.1"),
      "ipfs://test-banner",
      1,
      50
    );
    await tx.wait();

    const event = await eventContract.events(1);
    if (event.title !== "Test Conference") {
      throw new Error("Event creation failed");
    }
  });

  await runTest("Ticket Purchase", async () => {
    const tx = await eventContract.connect(buyer1).buyTicket(1, {
      value: ethers.parseEther("0.1")
    });
    await tx.wait();

    const ticket = await eventContract.tickets(1);
    if (ticket.owner !== buyer1.address) {
      throw new Error("Ticket purchase failed");
    }
  });

  await runTest("Ticket Transfer", async () => {
    await eventContract.connect(buyer1).transferFrom(buyer1.address, buyer2.address, 1);
    
    const newOwner = await eventContract.ownerOf(1);
    if (newOwner !== buyer2.address) {
      throw new Error("Ticket transfer failed");
    }
  });

  await runTest("Free Event Creation", async () => {
    const currentTime = Math.floor(Date.now() / 1000);
    const futureTime = currentTime + 86400;

    const tx = await eventContract.connect(organizer).createEvent(
      "Free Workshop",
      "A free workshop",
      futureTime,
      futureTime + 86400,
      ethers.parseEther("0"),
      "ipfs://free-banner",
      0,
      25
    );
    await tx.wait();

    const event = await eventContract.events(2);
    if (event.title !== "Free Workshop") {
      throw new Error("Free event creation failed");
    }
  });

  await runTest("Free Ticket Purchase", async () => {
    const tx = await eventContract.connect(buyer3).buyTicket(2);
    await tx.wait();

    const ticket = await eventContract.tickets(2);
    if (ticket.owner !== buyer3.address) {
      throw new Error("Free ticket purchase failed");
    }
  });

  await runTest("Proceeds Withdrawal", async () => {
    const balanceBefore = await ethers.provider.getBalance(organizer.address);
    
    const tx = await eventContract.connect(organizer).withdrawProceeds(1);
    await tx.wait();
    
    const balanceAfter = await ethers.provider.getBalance(organizer.address);
    if (balanceAfter <= balanceBefore) {
      throw new Error("Proceeds withdrawal failed");
    }
  });

  await runTest("Event Status Update", async () => {
    await eventContract.connect(organizer).updateEventStatus(1, 1);
    
    const event = await eventContract.events(1);
    if (event.status !== 1) {
      throw new Error("Event status update failed");
    }
  });

  await runTest("Multiple Ticket Purchases", async () => {
    for (let i = 0; i < 3; i++) {
      const tx = await eventContract.connect(buyer1).buyTicket(1, {
        value: ethers.parseEther("0.1")
      });
      await tx.wait();
    }

    const event = await eventContract.events(1);
    if (event.ticketsSold < 4) {
      throw new Error("Multiple ticket purchases failed");
    }
  });

  console.log("\n📊 Test Results Summary:");
  const passedTests = testResults.tests.filter(t => t.status === "PASSED").length;
  const failedTests = testResults.tests.filter(t => t.status === "FAILED").length;
  
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`📈 Success Rate: ${((passedTests / testResults.tests.length) * 100).toFixed(1)}%`);

  fs.writeFileSync(
    path.join(__dirname, '..', 'test-results.json'),
    JSON.stringify(testResults, null, 2)
  );
  console.log("\n📄 Test results saved to test-results.json");

  if (failedTests > 0) {
    console.log("\n⚠️  Some tests failed. Check test-results.json for details.");
    process.exit(1);
  } else {
    console.log("\n🎉 All tests passed successfully!");
  }
}

testContract().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 