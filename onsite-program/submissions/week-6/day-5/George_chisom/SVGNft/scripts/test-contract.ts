import { network } from "hardhat";

const { ethers } = await network.connect({
  network: "hardhatOp",
  chainType: "op",
});

async function main() {
  console.log("🚀 Starting SVG NFT Contract Tests...\n");

  try {
    // Deploy the contract
    console.log("📦 Deploying SvgNft contract...");
    const SvgNftFactory = await ethers.getContractFactory("SvgNft");
    const svgNft = await SvgNftFactory.deploy();
    await svgNft.waitForDeployment();

    const contractAddress = await svgNft.getAddress();
    console.log("✅ Contract deployed at:", contractAddress);
    console.log(
      "✅ Contract address is valid:",
      contractAddress !== ethers.ZeroAddress
    );

    // Test 1: Generate SVG with timestamp
    console.log("\n🎨 Test 1: Generate SVG with timestamp");
    try {
      const svg = await svgNft.generate_svg_with_time(1);
      console.log("✅ SVG generated successfully");
      console.log("✅ SVG contains <svg tag:", svg.includes("<svg"));
      console.log("✅ SVG contains Time:", svg.includes("Time:"));
      console.log("✅ SVG contains </svg> tag:", svg.includes("</svg>"));
      console.log("📏 SVG length:", svg.length, "characters");
    } catch (error: any) {
      console.log("❌ SVG generation failed:", error.message);
    }

    // Test 2: Generate token URI
    console.log("\n🔗 Test 2: Generate token URI");
    try {
      const tokenUri = await svgNft.token_uri(1);
      console.log("✅ Token URI generated successfully");
      console.log(
        "✅ Token URI has correct prefix:",
        tokenUri.includes("data:application/json;base64,")
      );

      // Decode and verify JSON structure
      const base64Json = tokenUri.replace("data:application/json;base64,", "");
      const decodedJson = Buffer.from(base64Json, "base64").toString("utf-8");
      const metadata = JSON.parse(decodedJson);

      console.log("✅ JSON metadata decoded successfully");
      console.log(
        "✅ Name contains 'Leo Nft':",
        metadata.name.includes("Leo Nft")
      );
      console.log(
        "✅ Description contains 'timestamp':",
        metadata.description.includes("timestamp")
      );
      console.log(
        "✅ Image has SVG data URI:",
        metadata.image.includes("data:image/svg+xml;base64,")
      );
      console.log(
        "✅ Attributes is an array:",
        Array.isArray(metadata.attributes)
      );

      console.log("\n📋 Metadata:");
      console.log("   Name:", metadata.name);
      console.log("   Description:", metadata.description);
      console.log("   Attributes:", metadata.attributes);
    } catch (error: any) {
      console.log("❌ Token URI generation failed:", error.message);
    }

    // Test 3: Test invalid token ID
    console.log("\n🚫 Test 3: Test invalid token ID");
    try {
      await svgNft.generate_svg_with_time(2);
      console.log("❌ Should have reverted for invalid token ID");
    } catch (error: any) {
      console.log("✅ Correctly reverted for invalid token ID");
      console.log("   Error message:", error.message);
      const hasCustomError =
        error.message.includes("0xb4bcfccc") ||
        error.message.includes("Invalid_token_id");
      console.log("   Contains custom error signature:", hasCustomError);
    }

    try {
      await svgNft.token_uri(2);
      console.log("❌ Should have reverted for invalid token URI");
    } catch (error: any) {
      console.log("✅ Correctly reverted for invalid token URI");
      console.log("   Error message:", error.message);
      const hasCustomError =
        error.message.includes("0xb4bcfccc") ||
        error.message.includes("Invalid_token_id");
      console.log("   Contains custom error signature:", hasCustomError);
    }

    // Test 4: Test different timestamps
    console.log("\n⏰ Test 4: Test different timestamps");
    try {
      const svg1 = await svgNft.generate_svg_with_time(1);

      // Mine a new block to change timestamp
      await ethers.provider.send("evm_mine", []);

      const svg2 = await svgNft.generate_svg_with_time(1);

      console.log("✅ Generated SVGs at different timestamps");
      console.log("✅ SVGs are different:", svg1 !== svg2);
    } catch (error: any) {
      console.log("❌ Timestamp test failed:", error.message);
    }

    // Test 5: Test base64 encoding validity
    console.log("\n🔐 Test 5: Test base64 encoding validity");
    try {
      const tokenUri = await svgNft.token_uri(1);
      const base64Json = tokenUri.replace("data:application/json;base64,", "");

      // Should not throw when decoding
      const decodedJson = Buffer.from(base64Json, "base64").toString("utf-8");
      const metadata = JSON.parse(decodedJson);

      console.log("✅ Base64 decoding successful");
      console.log("✅ JSON parsing successful");

      // Test SVG base64 encoding
      const svgBase64 = metadata.image.replace(
        "data:image/svg+xml;base64,",
        ""
      );
      const decodedSvg = Buffer.from(svgBase64, "base64").toString("utf-8");

      console.log("✅ SVG base64 decoding successful");
      console.log("✅ Decoded SVG contains <svg:", decodedSvg.includes("<svg"));
    } catch (error: any) {
      console.log("❌ Base64 encoding test failed:", error.message);
    }

    console.log("\n🎉 All tests completed!");
  } catch (error: any) {
    console.error("💥 Test execution failed:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
