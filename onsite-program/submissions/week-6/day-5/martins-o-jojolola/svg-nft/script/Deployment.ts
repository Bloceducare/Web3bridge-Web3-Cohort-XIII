import { ethers, run, network } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
    console.log("=== Deploying DynamicTimeSVG to", network.name, "===");

    const [deployer] = await ethers.getSigners();
    console.log("Deployer address:", deployer.address);
    console.log(
        "Deployer balance:",
        ethers.formatEther(await deployer.provider.getBalance(deployer.address)),
        "ETH"
    );

    const Factory = await ethers.getContractFactory("DynamicTimeSVG");
    console.log("Deploying contract...");
    const contract = await Factory.deploy();
    await contract.waitForDeployment();
    const address = await contract.getAddress();
    console.log("Deployed at:", address);
    console.log(`Etherscan (Sepolia): https://sepolia.etherscan.io/address/${address}`);

    if (network.name === "sepolia" && process.env.ETHERSCAN_KEY) {
        console.log("Waiting for 6 confirmations before verify...");
        await contract.deploymentTransaction()?.wait(6);
        console.log("Verifying...");
        try {
            await run("verify:verify", {
                address,
                constructorArguments: [],
            });
            console.log("Verification complete");
        } catch (err: any) {
            if (err.message.includes("Already Verified")) {
                console.log("Already verified");
            } else {
                throw err;
            }
        }
    }

    console.log("Minting first NFT with payment...");
    const price = await contract.price();
    const mintTx = await contract.mint({ value: price });
    const mintRc = await mintTx.wait();
    console.log("Mint tx hash:", mintRc?.hash);

    const tokenId = 1;
    console.log("Token ID:", tokenId);

    const uri = await contract.tokenURI(tokenId);
    console.log("tokenURI:", uri);
    console.log("tokenURI prefix:", uri.slice(0, 80), "...");

    const jsonBase64 = uri.replace("data:application/json;base64,", "");
    const json = JSON.parse(Buffer.from(jsonBase64, "base64").toString("utf8"));
    console.log("Decoded JSON:", json);
}

main().catch((e) => {
    console.error(e);
    process.exitCode = 1;
});
