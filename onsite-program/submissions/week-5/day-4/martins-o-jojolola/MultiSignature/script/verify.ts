import { run } from "hardhat";
import fs from "fs";

async function main() {
    // Load deployment info
    const deploymentPath = "./deployments/multisig_factory_deployment.json";
    if (!fs.existsSync(deploymentPath)) {
        throw new Error(`Deployment file not found at ${deploymentPath}`);
    }

    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf-8"));
    console.log("📂 Loaded deployment info:", deploymentInfo);

    console.log(`\n🔍 Verifying MultiSigFactory at ${deploymentInfo.factoryAddress}...`);
    await run("verify:verify", {
        address: deploymentInfo.factoryAddress,
        constructorArguments: [],
    });
    console.log("✅ Factory verified!");

    console.log(`\n🔍 Verifying MultiSig wallet at ${deploymentInfo.multisigAddress}...`);
    await run("verify:verify", {
        address: deploymentInfo.multisigAddress,
        constructorArguments: [
            deploymentInfo.owners,
            deploymentInfo.confirmationsRequired
        ],
    });
    console.log("✅ MultiSig wallet verified!");
}

main().catch((error) => {
    console.error("❌ Verification failed:", error);
    process.exit(1);
});
