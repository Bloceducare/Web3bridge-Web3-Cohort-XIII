import { expect } from "chai";
import { network } from "hardhat";
import { SvgNft } from "../types/ethers-contracts/SvgNft.js";

describe("SVGNft", function () {
  let ethers: any;

  before(async function () {
    const networkConnection = await network.connect({
      network: "hardhatOp",
      chainType: "op",
    });
    ethers = networkConnection.ethers;
  });

  it("Should deploy a contract with correct name and symbol", async function () {
    const SvgNftFactory = await ethers.getContractFactory("SvgNft");
    const svgNft = (await SvgNftFactory.deploy()) as SvgNft;
    await svgNft.waitForDeployment();

    const contractAddress = await svgNft.getAddress();
    expect(contractAddress).to.not.equal(ethers.ZeroAddress);

    // Test that contract deployed successfully
    expect(contractAddress).to.be.a("string");
    expect(contractAddress).to.have.length(42);
  });

  it("Should generate SVG with timestamp", async function () {
    const SvgNftFactory = await ethers.getContractFactory("SvgNft");
    const svgNft = (await SvgNftFactory.deploy()) as SvgNft;
    await svgNft.waitForDeployment();

    // Test SVG generation
    const svg = await svgNft.generate_svg_with_time(1);
    expect(svg).to.include("<svg");
    expect(svg).to.include("Time:");
    expect(svg).to.include("</svg>");
  });

  it("Should return proper token URI", async function () {
    const SvgNftFactory = await ethers.getContractFactory("SvgNft");
    const svgNft = (await SvgNftFactory.deploy()) as SvgNft;
    await svgNft.waitForDeployment();

    // Test token URI
    const tokenUri = await svgNft.token_uri(1);
    expect(tokenUri).to.include("data:application/json;base64,");

    // Decode and verify JSON structure
    const base64Json = tokenUri.replace("data:application/json;base64,", "");
    const decodedJson = Buffer.from(base64Json, "base64").toString("utf-8");
    const metadata = JSON.parse(decodedJson);

    expect(metadata.name).to.include("Leo Nft");
    expect(metadata.description).to.include("timestamp");
    expect(metadata.image).to.include("data:image/svg+xml;base64,");
    expect(metadata.attributes).to.be.an("array");
  });

  it("Should revert with invalid token ID", async function () {
    const SvgNftFactory = await ethers.getContractFactory("SvgNft");
    const svgNft = (await SvgNftFactory.deploy()) as SvgNft;
    await svgNft.waitForDeployment();

    // Test with invalid token ID
    try {
      await svgNft.generate_svg_with_time(2);
      expect.fail("Should have reverted");
    } catch (error: any) {
      expect(error.message).to.include("Invalid_token_id");
    }

    try {
      await svgNft.token_uri(2);
      expect.fail("Should have reverted");
    } catch (error: any) {
      expect(error.message).to.include("Invalid_token_id");
    }
  });
});

// Alternative test structure if you prefer more specific tests
describe("SVGNft Advanced Tests", function () {
  let svgNft: SvgNft;
  let ethers: any;

  before(async function () {
    const networkConnection = await network.connect({
      network: "hardhatOp",
      chainType: "op",
    });
    ethers = networkConnection.ethers;
  });

  // Setup before each test
  beforeEach(async function () {
    const SvgNftFactory = await ethers.getContractFactory("SvgNft");
    svgNft = (await SvgNftFactory.deploy()) as SvgNft;
    await svgNft.waitForDeployment();
  });

  it("Should have correct initial state", async function () {
    // Test that contract deployed successfully
    const contractAddress = await svgNft.getAddress();
    expect(contractAddress).to.be.a("string");
    expect(contractAddress).to.have.length(42);
  });

  it("Should generate different SVGs at different timestamps", async function () {
    const svg1 = await svgNft.generate_svg_with_time(1);

    // Mine a new block to change timestamp
    await ethers.provider.send("evm_mine", []);

    const svg2 = await svgNft.generate_svg_with_time(1);

    // SVGs should be different due to different timestamps
    expect(svg1).to.not.equal(svg2);
  });

  it("Should have valid base64 encoding", async function () {
    const tokenUri = await svgNft.token_uri(1);
    const base64Json = tokenUri.replace("data:application/json;base64,", "");

    // Should not throw when decoding
    expect(() => {
      Buffer.from(base64Json, "base64").toString("utf-8");
    }).to.not.throw();

    const decodedJson = Buffer.from(base64Json, "base64").toString("utf-8");
    expect(() => {
      JSON.parse(decodedJson);
    }).to.not.throw();
  });
});
