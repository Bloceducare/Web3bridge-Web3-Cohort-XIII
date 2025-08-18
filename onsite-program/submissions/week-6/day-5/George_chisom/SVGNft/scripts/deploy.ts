import { network } from "hardhat";
import fs from "fs";
import path from "path";

const { ethers } = await network.connect({
  network: "hardhatOp",
  chainType: "op",
});

async function main() {
  console.log(" Starting SvgNft deployment and testing...\n");

  // Get signers
  const [deployer, user1, user2] = await ethers.getSigners();
  console.log(" Deployer address:", deployer.address);
  console.log(
    " Deployer balance:",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
    "ETH\n"
  );

  // Deploy contract with unique salt for different addresses each time
  const SvgNftFactory = await ethers.getContractFactory("SvgNft");
  const timestamp = Date.now();
  const salt = ethers.keccak256(ethers.toUtf8Bytes(`SvgNft_${timestamp}`));

  console.log(" Deploying SvgNft contract...");
  const svgNft = await SvgNftFactory.deploy();
  await svgNft.waitForDeployment();

  const contractAddress = await svgNft.getAddress();
  console.log(" SvgNft deployed at:", contractAddress);
  console.log(" Deployment timestamp:", timestamp, "\n");

  // Debug: Inspect contract interface
  console.log("🔍 Contract Interface Inspection:");
  const contractInterface = svgNft.interface;
  const allFunctions = contractInterface.fragments
    .filter((fragment) => fragment.type === "function")
    .map(
      (fragment) =>
        `${fragment.name}(${fragment.inputs
          .map((input) => input.type)
          .join(", ")})`
    );

  console.log("   📋 All available functions:");
  allFunctions.forEach((func) => console.log(`      - ${func}`));
  console.log("");

  // Save deployment info using process.cwd() instead of __dirname
  const deploymentInfo = {
    address: contractAddress,
    timestamp: timestamp,
    network: "hardhatOp",
    deployer: deployer.address,
    availableFunctions: allFunctions,
  };

  const deploymentsPath = path.join(process.cwd(), "deployments");
  if (!fs.existsSync(deploymentsPath)) {
    fs.mkdirSync(deploymentsPath, { recursive: true });
  }

  fs.writeFileSync(
    path.join(deploymentsPath, `svgnft_${timestamp}.json`),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("📋 Testing contract functions...\n");

  // Test 1: Check initial token ID
  console.log("🔍 Test 1: Checking initial token ID");
  let tokenId;
  try {
    // token_id is a public variable, not a function, so no parentheses needed
    tokenId = await svgNft.token_id();
    console.log("   Token ID:", tokenId.toString());
  } catch (error) {
    console.log("   Error reading token_id:", error.message);
    console.log("    Using default token ID: 1");
    tokenId = 1n;
  }

  // Test 2: Generate SVG with timestamp
  console.log("\n Test 2: Generating SVG with timestamp");
  try {
    console.log("   Using token ID:", tokenId.toString());
    const svg = await svgNft.generate_svg_with_time(tokenId);
    console.log("   SVG length:", svg.length, "characters");
    console.log(
      "   SVG preview (first 100 chars):",
      svg.substring(0, 100) + "..."
    );

    // Save SVG to file for inspection
    fs.writeFileSync(
      path.join(deploymentsPath, `generated_svg_${timestamp}.svg`),
      svg
    );
    console.log("    SVG saved to deployments folder");
  } catch (error) {
    console.log("    Error generating SVG:");

    // Check if the function exists with different name
    const contractInterface = svgNft.interface;
    const functions = contractInterface.fragments
      .filter((fragment) => fragment.type === "function")
      .map((fragment) => fragment.name);

    if (functions.includes("generateSvgWithTime")) {
      console.log("   🔍 Trying generateSvgWithTime instead...");
      try {
        const svg = await svgNft.generate_svg_with_time(tokenId);
        console.log("   Alternative function worked!");
        console.log("   SVG length:", svg.length, "characters");
      } catch (altError) {
        console.log(
          "    Alternative function also failed:",
          altError.message
        );
      }
    }
  }

  // Test 3: Get token URI
  console.log("\n Test 3: Getting token URI");
  try {
    console.log("   Using token ID:", tokenId.toString());
    const tokenUri = (await svgNft.token_uri)
      ? await svgNft.token_uri(tokenId)
      : await svgNft.token_uri(tokenId);
    console.log("   Token URI length:", tokenUri.length, "characters");
    console.log("   Token URI preview:", tokenUri.substring(0, 80) + "...");

    // Decode and parse the JSON metadata
    const base64Json = tokenUri.replace("data:application/json;base64,", "");
    const decodedJson = Buffer.from(base64Json, "base64").toString("utf-8");
    const metadata = JSON.parse(decodedJson);

    console.log("    Decoded metadata:");
    console.log("      Name:", metadata.name);
    console.log("      Description:", metadata.description);
    console.log("      Attributes:", metadata.attributes);

    // Save metadata to file
    fs.writeFileSync(
      path.join(deploymentsPath, `metadata_${timestamp}.json`),
      JSON.stringify(metadata, null, 2)
    );
    console.log("    Metadata saved to deployments folder");
  } catch (error) {
    console.log("    Error getting token URI:", error.message);

    // Try alternative function names
    const contractInterface = svgNft.interface;
    const functions = contractInterface.fragments
      .filter((fragment) => fragment.type === "function")
      .map((fragment) => fragment.name);

    console.log("   🔍 Available functions:", functions.join(", "));

    if (functions.includes("tokenURI")) {
      console.log("   🔍 Trying tokenURI instead of token_uri...");
      try {
        const tokenUri = await svgNft.token_uri(tokenId);
        console.log("    tokenURI function worked!");
      } catch (altError) {
        console.log("    tokenURI also failed:", altError.message);
      }
    }
  }

  // Test 4: Test with invalid token ID
  console.log("\n Test 4: Testing with invalid token ID (should fail)");
  try {
    await svgNft.generate_svg_with_time(999);
    console.log("     Unexpected: Should have reverted!");
  } catch (error) {
    console.log("    Correctly reverted with invalid token ID");
    console.log("   Error message:", error.message);
  }

  // Test 5: Test minting functionality
  console.log("\n Test 5: Testing minting functionality");
  try {
    console.log("   Checking initial balance...");
    const initialBalance = await svgNft.balanceOf(user1.address, tokenId);
    console.log("   User1 initial balance:", initialBalance.toString());

    console.log("   Attempting to mint 5 tokens to user1...");
    const mintTx = await svgNft.mint(user1.address, tokenId, 5, "0x");
    await mintTx.wait();
    console.log("    Minting transaction completed");

    const newBalance = await svgNft.balanceOf(user1.address, tokenId);
    console.log("   User1 new balance:", newBalance.toString());
    console.log("   Tokens minted:", (newBalance - initialBalance).toString());

    // Test full supply
    const fullSupply = await svgNft.full_supply();
    console.log("   Full supply:", fullSupply.toString());

    // Check contract balance
    const contractBalance = await svgNft.balanceOf(
      await svgNft.getAddress(),
      tokenId
    );
    console.log("   Contract balance:", contractBalance.toString());
  } catch (error) {
    console.log("    Minting failed:", error.message);

    // Check if it's an ownership issue
    const owner = await svgNft.owner();
    const [deployer] = await ethers.getSigners();
    console.log("   Contract owner:", owner);
    console.log("   Deployer address:", deployer.address);
    console.log(
      "   Is deployer owner?",
      owner.toLowerCase() === deployer.address.toLowerCase()
    );
  }

  // Test 6: Test ownership functions (if Ownable)
  console.log("\n Test 6: Testing ownership");
  try {
    const owner = await svgNft.owner();
    console.log("   Contract owner:", owner);
    console.log("   Is deployer the owner?", owner === deployer.address);
  } catch (error) {
    console.log("   ℹ  Contract doesn't have owner function");
  }

  // Test 7: Gas estimation
  console.log("\n Test 7: Gas estimation");
  try {
    const gasEstimate = await svgNft.generate_svg_with_time.estimateGas(
      tokenId
    );
    console.log(
      "   Gas estimate for generate_svg_with_time:",
      gasEstimate.toString()
    );

    const gasEstimate2 = await svgNft.token_uri.estimateGas(tokenId);
    console.log("   Gas estimate for token_uri:", gasEstimate2.toString());
  } catch (error) {
    console.log("    Gas estimation failed:", error.message);
  }

  console.log("\n All tests completed!");
  console.log(" Check the deployments folder for saved files:");
  console.log("   - Deployment info");
  console.log("   - Generated SVG");
  console.log("   - Decoded metadata");

  return {
    contractAddress,
    timestamp,
    deployer: deployer.address,
    // functions
  };
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
