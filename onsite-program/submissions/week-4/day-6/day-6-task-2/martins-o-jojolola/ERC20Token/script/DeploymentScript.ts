const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting Factory Deployment...\n");

  // ===== GET DEPLOYER INFO =====
  const [deployer] = await ethers.getSigners();
  const deployerBalance = await ethers.provider.getBalance(deployer.address);

  console.log("📋 Deployment Details:");
  console.log("- Deployer:", deployer.address);
  console.log("- Balance:", ethers.formatEther(deployerBalance), "ETH");
  console.log("- Network:", (await ethers.provider.getNetwork()).name);
  console.log();

  // ===== DEPLOY FACTORY =====
  console.log("⚙️  Deploying Factory...");

  const FactoryFactory = await ethers.getContractFactory("MartinsTokenFactory");
  const factory = await FactoryFactory.deploy();
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();

  console.log("✅ Factory deployed at:", factoryAddress);
  console.log();

  // ===== CHECK INITIAL STATE =====
  console.log("🔍 Checking initial state...");

  const initialCount = await factory.getTokenCount();
  const initialCounter = await factory.tokenCounter();
  const initialTokens = await factory.getTokens();

  console.log("- Token count:", initialCount.toString());
  console.log("- Counter:", initialCounter.toString());
  console.log("- Tokens array:", initialTokens);
  console.log();

  // ===== TEST TOKEN CREATION =====
  console.log("🧪 Testing token creation...");

  const TEST_TOKEN = {
    name: "Test Token",
    symbol: "TEST",
    decimals: 18,
    totalSupply: ethers.parseEther("100000")
  };

  console.log("Creating token with params:");
  console.log("- Name:", TEST_TOKEN.name);
  console.log("- Symbol:", TEST_TOKEN.symbol);
  console.log("- Decimals:", TEST_TOKEN.decimals);
  console.log("- Supply:", ethers.formatEther(TEST_TOKEN.totalSupply));

  try {
    // Create token
    const createTx = await factory.createMartinsToken(
      TEST_TOKEN.name,
      TEST_TOKEN.symbol,
      TEST_TOKEN.decimals,
      TEST_TOKEN.totalSupply
    );

    console.log("\n📝 Transaction sent:", createTx.hash);

    const receipt = await createTx.wait();
    console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
    console.log("⛽ Gas used:", receipt.gasUsed.toString());

    // Check events
    console.log("\n📡 Events emitted:");
    for (const log of receipt.logs) {
      try {
        const parsedLog = factory.interface.parseLog(log);
        console.log(`- ${parsedLog.name}:`);

        if (parsedLog.name === "TokenCreated") {
          console.log(`  Token: ${parsedLog.args.tokenAddress}`);
          console.log(`  Creator: ${parsedLog.args.creator}`);
          console.log(`  Name: ${parsedLog.args.name}`);
          console.log(`  Symbol: ${parsedLog.args.symbol}`);
        }
      } catch (e) {
        // Skip non-factory events
      }
    }

    // Check state after creation
    console.log("\n📊 State after creation:");

    const afterCount = await factory.getTokenCount();
    const afterCounter = await factory.tokenCounter();
    const afterTokens = await factory.getTokens();

    console.log("- Token count:", afterCount.toString());
    console.log("- Counter:", afterCounter.toString());
    console.log("- Tokens array length:", afterTokens.length);
    console.log("- Tokens array:", afterTokens);

    // Verify we have exactly 1 token
    if (Number(afterCount) !== 1) {
      throw new Error(`Expected 1 token, got ${afterCount}`);
    }

    if (afterTokens.length !== 1) {
      throw new Error(`Expected array length 1, got ${afterTokens.length}`);
    }

    const newTokenAddress = afterTokens[0];
    console.log("- New token address:", newTokenAddress);

    // Verify the created token
    console.log("\n🔍 Verifying created token...");
    const TokenFactory = await ethers.getContractFactory("MartinsToken");
    const newToken = TokenFactory.attach(newTokenAddress);

    const tokenName = await newToken.name();
    const tokenSymbol = await newToken.symbol();
    const tokenDecimals = await newToken.decimals();
    const tokenSupply = await newToken.totalSupply();
    const tokenOwner = await newToken.owner();

    console.log("- Name:", tokenName);
    console.log("- Symbol:", tokenSymbol);
    console.log("- Decimals:", tokenDecimals);
    console.log("- Supply:", ethers.formatEther(tokenSupply));
    console.log("- Owner:", tokenOwner);

    // Validate token properties
    const validations = [
      { check: tokenName === TEST_TOKEN.name, name: "Name match" },
      { check: tokenSymbol === TEST_TOKEN.symbol, name: "Symbol match" },
      { check: Number(tokenDecimals) === TEST_TOKEN.decimals, name: "Decimals match" },
      { check: tokenSupply === TEST_TOKEN.totalSupply, name: "Supply match" },
      { check: tokenOwner === deployer.address, name: "Owner match" }
    ];

    console.log("\n✅ Validation results:");
    let allValid = true;
    for (const validation of validations) {
      const status = validation.check ? "✅" : "❌";
      console.log(`${status} ${validation.name}`);
      if (!validation.check) allValid = false;
    }

    if (!allValid) {
      throw new Error("Token validation failed");
    }

    console.log("\n🎉 SUCCESS! Everything is working perfectly!");

  } catch (error) {
    console.error("\n❌ Token creation failed!");
    console.error("Error:", error.message);

    // Debug info
    try {
      const debugCount = await factory.getTokenCount();
      const debugTokens = await factory.getTokens();
      console.log("\n🔧 Debug info:");
      console.log("- Current count:", debugCount.toString());
      console.log("- Current tokens:", debugTokens);
    } catch (debugError) {
      console.log("- Debug read failed:", debugError.message);
    }

    throw error;
  }

  // ===== FINAL SUMMARY =====
  console.log("\n" + "=".repeat(60));
  console.log("                    🎊 DEPLOYMENT COMPLETE 🎊");
  console.log("=".repeat(60));
  console.log(`🏭 Factory Address: ${factoryAddress}`);
  console.log(`🌐 Network: ${(await ethers.provider.getNetwork()).name}`);
  console.log(`👤 Deployer: ${deployer.address}`);
  console.log("🧪 Test Token: ✅ Created and verified");
  console.log("=".repeat(60));
  console.log();
  console.log("🔧 How to use your factory:");
  console.log(`const factory = await ethers.getContractAt("MartinsTokenFactory", "${factoryAddress}");`);
  console.log(`const tx = await factory.createMartinsToken("MyToken", "MTK", 18, ethers.parseEther("1000000"));`);
  console.log();

  // Save deployment info
  try {
    const fs = require('fs');
    const deploymentInfo = {
      factoryAddress: factoryAddress,
      network: (await ethers.provider.getNetwork()).name,
      chainId: Number((await ethers.provider.getNetwork()).chainId),
      deployer: deployer.address,
      deploymentTime: new Date().toISOString(),
      testTokenCreated: true
    };

    const deploymentDir = './deployments';
    if (!fs.existsSync(deploymentDir)) {
      fs.mkdirSync(deploymentDir, { recursive: true });
    }

    fs.writeFileSync(
      `${deploymentDir}/factory_deployment.json`,
      JSON.stringify(deploymentInfo, null, 2)
    );
    console.log("💾 Deployment info saved to: ./deployments/factory_deployment.json");
  } catch (saveError) {
    console.log("⚠️  Could not save deployment info:", saveError.message);
  }

  return {
    factory: factory,
    address: factoryAddress
  };
}

main()
  .then(() => {
    console.log("\n🎉 Deployment script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Deployment script failed!");
    console.error("Error:", error.message);
    console.error("\nTroubleshooting:");
    console.error("1. Make sure MartinsToken.sol and MartinsTokenFactory.sol are compiled");
    console.error("2. Run: npx hardhat clean && npx hardhat compile");
    console.error("3. Check your import paths in the factory contract");
    process.exit(1);
  });

module.exports = main;