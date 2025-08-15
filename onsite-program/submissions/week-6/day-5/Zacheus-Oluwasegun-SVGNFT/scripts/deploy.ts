import { network } from "hardhat";

const { ethers } = await network.connect({
    network: "lisk-sepolia",
    chainType: "op"
})

async function main() {
  const SvgNfT = await ethers.getContractFactory("SVGNFT");

  const name = "Timestamp NFT";
  const symbol = "TSNFT";

  const svgNfT = await SvgNfT.deploy(name, symbol);
  await svgNfT.waitForDeployment();

  const contractAddress = await svgNfT.getAddress();
  console.log(`SvgNfT deployed to: ${contractAddress}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });