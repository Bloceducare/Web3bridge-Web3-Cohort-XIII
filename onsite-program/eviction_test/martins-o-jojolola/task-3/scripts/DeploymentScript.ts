import { ethers, run, network } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with:", deployer.address);

    const STAKE = ethers.parseEther("10");

    // Use an existing ERC20 (Sepolia USDT/DAI/etc.)
    const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS!;
    if (!TOKEN_ADDRESS) throw new Error("TOKEN_ADDRESS not set in .env");

    // Deploy factory
    const Factory = await ethers.getContractFactory("LudoFactory");
    const factory = await Factory.deploy();
    await factory.waitForDeployment();
    console.log("LudoFactory deployed:", await factory.getAddress());

    // Create new game
    const tx = await factory.createGame(TOKEN_ADDRESS, STAKE);
    const receipt = await tx.wait();
    const event = receipt!.logs.find(
        (log: any) => log.fragment && log.fragment.name === "GameCreated"
    );
    const gameAddr = event!.args!.game;
    console.log("New LudoGame deployed:", gameAddr);

    // Optional verify
    if (network.name !== "hardhat" && process.env.ETHERSCAN_API_KEY) {
        await run("verify:verify", {
            address: await factory.getAddress(),
            constructorArguments: [],
        });
        await run("verify:verify", {
            address: gameAddr,
            constructorArguments: [TOKEN_ADDRESS, STAKE],
        });
    }
}

main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
});
