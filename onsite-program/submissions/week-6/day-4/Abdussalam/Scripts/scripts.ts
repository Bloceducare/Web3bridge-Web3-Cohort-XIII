// scripts/deploy_all.ts
import { ethers, run } from "hardhat";
import { parseEther } from "ethers"; //  parseEther now comes from ethers v6

async function main() {
    // ========== 1. Fill in your VRF settings ==========
    const VRF_COORDINATOR = "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625";
    const KEY_HASH =
        "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae";
// const SUBSCRIPTION_ID = ethers.toBigInt(68227459223378027920811061008006789759030118789767801257539086404648090869887); 
        //68227459223378027920811061008006789759030118789767801257539086404648090869887; // Replace with your VRF sub ID

    // ========== 2. Deploy RewardToken (ERC20) ==========
    console.log("Deploying RewardToken (ERC20)...");
    const RewardToken = await ethers.getContractFactory("RewardToken");
    const rewardToken = await RewardToken.deploy();
    await rewardToken.waitForDeployment();
    console.log(`RewardToken deployed to: ${await rewardToken.getAddress()}`);

    // ========== 3. Deploy RewardNFT (ERC721) ==========
    console.log("Deploying RewardNFT (ERC721)...");
    const RewardNFT = await ethers.getContractFactory("RewardNFT");
    const rewardNFT = await RewardNFT.deploy();
    await rewardNFT.waitForDeployment();
    console.log(`RewardNFT deployed to: ${await rewardNFT.getAddress()}`);
    

    // ========== 4. Deploy RewardMulti (ERC1155) ==========
    console.log("Deploying RewardMulti (ERC1155)...");
    const RewardMulti = await ethers.getContractFactory("RewardMulti");
    const rewardMulti = await RewardMulti.deploy();
    await rewardMulti.waitForDeployment();
    console.log(`RewardMulti deployed to: ${await rewardMulti.getAddress()}`);

    // ========== 5. Deploy Lootbox ==========
    console.log("Deploying Lootbox...");
    const Lootbox = await ethers.getContractFactory("Lootbox");
    const lootbox = await Lootbox.deploy(
        VRF_COORDINATOR,
        KEY_HASH,
        // SUBSCRIPTION_ID,
        await rewardToken.getAddress(),
        await rewardNFT.getAddress(),
        await rewardMulti.getAddress()
    );
    await lootbox.waitForDeployment();
    console.log(`Lootbox deployed to: ${await lootbox.getAddress()}`);

    // ========== 6. Optional: Set lootbox entry fee ==========
    const tx = await lootbox.setLootboxPrice(parseEther("0.05")); // ✅ no ethers.utils
    await tx.wait();
    console.log("Lootbox price set to 0.05 ETH");

    // ========== 7. Verify contracts (Etherscan) ==========
    async function verify(address: string, constructorArgs: any[]) {
        console.log(`Verifying ${address}...`);
        try {
            await run("verify:verify", {
                address,
                constructorArguments: constructorArgs,
            });
        } catch (e: any) {
            if (e.message.toLowerCase().includes("already verified")) {
                console.log(`${address} is already verified`);
            } else {
                console.error(e);
            }
        }
    }

    await verify(await rewardToken.getAddress(), []);
    await verify(await rewardNFT.getAddress(), []);
    await verify(await rewardMulti.getAddress(), []);
    await verify(await lootbox.getAddress(), [
        VRF_COORDINATOR,
        KEY_HASH,
        await rewardToken.getAddress(),
        await rewardNFT.getAddress(),
        await rewardMulti.getAddress(),
    ]);

    console.log("All contracts deployed & verified successfully!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
