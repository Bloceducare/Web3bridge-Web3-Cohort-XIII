import { ethers, network, run } from "hardhat";
import fs from "fs";

async function main() {
    console.log("🚀 Starting MultiSigFactory deployment + verification...\n");

    // ===== GET DEPLOYER INFO =====
    const [deployer] = await ethers.getSigners();
    console.log("📋 Deployer:", deployer.address);
    console.log("💰 Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
    console.log("🌐 Network:", network.name);

    // ===== DEPLOY FACTORY =====
    console.log("\n⚙️ Deploying MultiSigFactory...");
    const FactoryFactory = await ethers.getContractFactory("MultiSigFactory");
    const factory = await FactoryFactory.deploy();
    await factory.waitForDeployment();

    const factoryAddress = await factory.getAddress();
    console.log("✅ MultiSigFactory deployed at:", factoryAddress);

    // ===== TEST MULTISIG CREATION =====
    console.log("\n🧪 Creating test MultiSig wallet...");
    const owners: string[] = [
        deployer.address,
        ethers.Wallet.createRandom().address,
        ethers.Wallet.createRandom().address
    ];
    const confirmationsRequired = 2;

    const createTx = await factory.createSignature(owners, confirmationsRequired);
    await createTx.wait();

    const creatorWallets = await factory.getSigByCreator(deployer.address);
    const multisigAddress = creatorWallets[0];
    if (!multisigAddress) {
        throw new Error("❌ No MultiSig wallet address returned after creation!");
    }
    console.log("✅ MultiSig wallet created at:", multisigAddress);

    // ===== SAVE DEPLOYMENT INFO =====
    const deploymentInfo = {
        factoryAddress,
        multisigAddress,
        network: network.name,
        chainId: Number((await ethers.provider.getNetwork()).chainId),
        deployer: deployer.address,
        owners,
        confirmationsRequired,
        deploymentTime: new Date().toISOString()
    };

    if (!fs.existsSync("./deployments")) {
        fs.mkdirSync("./deployments", { recursive: true });
    }
    fs.writeFileSync(
        "./deployments/multisig_factory_deployment.json",
        JSON.stringify(deploymentInfo, null, 2)
    );
    console.log("💾 Deployment info saved to deployments/multisig_factory_deployment.json");

    // ===== VERIFY FACTORY =====
    console.log("\n🔍 Verifying MultiSigFactory...");
    await run("verify:verify", {
        address: factoryAddress,
        constructorArguments: []
    });
    console.log("✅ Factory verified!");

    // ===== VERIFY MULTISIG WALLET =====
    console.log("\n🔍 Verifying MultiSig wallet...");
    await run("verify:verify", {
        address: multisigAddress,
        constructorArguments: [owners, confirmationsRequired]
    });
    console.log("✅ MultiSig wallet verified!");

    console.log("\n🎉 Deployment + verification completed successfully!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n💥 Deployment or verification failed!");
        console.error(error);
        process.exit(1);
    });
