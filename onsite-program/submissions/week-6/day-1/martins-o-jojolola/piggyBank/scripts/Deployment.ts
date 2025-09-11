import { ethers } from "hardhat";
import { Contract, ContractFactory } from "ethers";
import { PiggyBankFactory, PiggyBank } from "../typechain-types";

interface DeploymentConfig {
    // Network configuration
    network: string;
    confirmations: number;

    // Gas settings (optional)
    gasPrice?: string;
    gasLimit?: string;
}

interface DeploymentResult {
    factory: PiggyBankFactory;
    factoryAddress: string;
    deploymentTx: string;
    gasUsed: string;
    deploymentCost: string;
}

class PiggyBankDeployer {
    private config: DeploymentConfig;

    constructor(config: DeploymentConfig) {
        this.config = config;
    }

    async deploy(): Promise<DeploymentResult> {
        console.log("🚀 Starting PiggyBank deployment on Lisk Sepolia...");
        console.log(`Network: ${this.config.network}`);

        // Get the deployer account
        const [deployer] = await ethers.getSigners();
        console.log(`📝 Deploying from account: ${deployer.address}`);

        // Check deployer balance
        const balance = await deployer.provider.getBalance(deployer.address);
        console.log(`💰 Deployer balance: ${ethers.formatEther(balance)} ETH`);

        if (balance < ethers.parseEther("0.001")) {
            throw new Error("❌ Insufficient balance for deployment. Need at least 0.001 ETH for Lisk Sepolia");
        }

        // Get contract factory
        const PiggyBankFactory: ContractFactory = await ethers.getContractFactory("PiggyBankFactory");

        // Estimate gas for deployment
        console.log("⛽ Estimating gas for deployment...");
        let estimatedGas;
        try {
            estimatedGas = await PiggyBankFactory.getDeployTransaction().then(tx =>
                deployer.provider.estimateGas(tx)
            );
            console.log(`📊 Estimated gas: ${estimatedGas.toString()}`);
        } catch (error) {
            console.log("⚠️  Could not estimate gas, using default limits");
            estimatedGas = BigInt("4000000"); // 4M gas default
        }

        // Prepare deployment options with buffer
        const deployOptions: any = {};

        if (this.config.gasPrice) {
            deployOptions.gasPrice = ethers.parseUnits(this.config.gasPrice, "gwei");
            console.log(`💰 Using gas price: ${this.config.gasPrice} gwei`);
        }

        if (this.config.gasLimit) {
            deployOptions.gasLimit = this.config.gasLimit;
            console.log(`⛽ Using gas limit: ${this.config.gasLimit}`);
        } else {
            // Use estimated gas + 20% buffer
            const gasWithBuffer = (estimatedGas * 120n) / 100n;
            deployOptions.gasLimit = gasWithBuffer.toString();
            console.log(`⛽ Using estimated gas with buffer: ${gasWithBuffer.toString()}`);
        }

        console.log("🔨 Deploying PiggyBankFactory...");

        // Deploy the factory with retry logic
        let factory: PiggyBankFactory;
        let deploymentAttempt = 0;
        const maxAttempts = 3;

        while (deploymentAttempt < maxAttempts) {
            try {
                deploymentAttempt++;
                console.log(`📤 Deployment attempt ${deploymentAttempt}/${maxAttempts}`);

                factory = await PiggyBankFactory.deploy(deployOptions) as PiggyBankFactory;

                console.log(`⏳ Transaction sent: ${factory.deploymentTransaction()?.hash}`);
                console.log(`⏳ Waiting for ${this.config.confirmations} confirmations...`);

                // Wait for deployment
                await factory.waitForDeployment();
                break; // Success, exit retry loop

            } catch (error: any) {
                console.error(`❌ Attempt ${deploymentAttempt} failed:`, error.message);

                if (deploymentAttempt === maxAttempts) {
                    // If this was the last attempt, provide detailed error info
                    if (error.receipt && error.receipt.status === 0) {
                        throw new Error(
                            `Contract deployment failed after ${maxAttempts} attempts. ` +
                            `Gas used: ${error.receipt.gasUsed}, Gas limit: ${deployOptions.gasLimit}. ` +
                            `Try increasing the gas limit or check for contract compilation errors.`
                        );
                    }
                    throw error;
                }

                // Increase gas limit for next attempt
                const currentLimit = BigInt(deployOptions.gasLimit);
                deployOptions.gasLimit = ((currentLimit * 130n) / 100n).toString();
                console.log(`🔄 Retrying with increased gas limit: ${deployOptions.gasLimit}`);

                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        // Get deployment details
        const factoryAddress = await factory.getAddress();
        const deploymentTx = factory.deploymentTransaction()?.hash || "";

        // Get transaction receipt for gas details
        const receipt = await factory.deploymentTransaction()?.wait();
        const gasUsed = receipt?.gasUsed.toString() || "0";
        const gasPrice = receipt?.gasPrice || 0n;
        const deploymentCost = ethers.formatEther(BigInt(gasUsed) * gasPrice);

        console.log("✅ Deployment successful!");
        console.log(`📍 Factory Address: ${factoryAddress}`);
        console.log(`🔗 Transaction: ${deploymentTx}`);
        console.log(`⛽ Gas Used: ${gasUsed}`);
        console.log(`💸 Deployment Cost: ${deploymentCost} ETH`);

        // Verify deployment
        await this.verifyDeployment(factory);

        return {
            factory,
            factoryAddress,
            deploymentTx,
            gasUsed,
            deploymentCost
        };
    }

    private async verifyDeployment(factory: PiggyBankFactory): Promise<void> {
        console.log("🔍 Verifying deployment...");

        try {
            // Test basic functionality
            const admin = await factory.admin();
            const totalBanks = await factory.totalPiggyBanks();

            console.log(`✅ Factory admin: ${admin}`);
            console.log(`✅ Total piggy banks: ${totalBanks}`);

            // Verify contract code
            const [deployer] = await ethers.getSigners();
            const code = await deployer.provider.getCode(await factory.getAddress());

            if (code === "0x") {
                throw new Error("Contract code not found");
            }

            console.log("✅ Contract verification passed!");

        } catch (error) {
            console.error("❌ Verification failed:", error);
            throw error;
        }
    }

    async createTestPiggyBank(factory: PiggyBankFactory, owner: string): Promise<string> {
        console.log(`🏦 Creating test PiggyBank for owner: ${owner}`);

        const tx = await factory.createPiggyBank(owner);
        const receipt = await tx.wait();

        // Find the PiggyBankCreated event
        const event = receipt?.logs.find(log => {
            try {
                const parsed = factory.interface.parseLog({
                    topics: log.topics as string[],
                    data: log.data
                });
                return parsed?.name === "PiggyBankCreated";
            } catch {
                return false;
            }
        });

        if (!event) {
            throw new Error("PiggyBankCreated event not found");
        }

        const parsedEvent = factory.interface.parseLog({
            topics: event.topics as string[],
            data: event.data
        });

        const piggyBankAddress = parsedEvent?.args[0] as string;

        console.log(`✅ PiggyBank created at: ${piggyBankAddress}`);
        console.log(`🔗 Transaction: ${tx.hash}`);

        return piggyBankAddress;
    }

    async interactWithPiggyBank(
        piggyBankAddress: string,
        ownerSigner: any
    ): Promise<void> {
        console.log(`🔄 Testing PiggyBank interactions at: ${piggyBankAddress}`);

        // Get PiggyBank contract instance
        const piggyBank = await ethers.getContractAt("PiggyBank", piggyBankAddress, ownerSigner) as PiggyBank;

        try {
            // Create a savings plan (1 day lock period)
            const lockPeriod = 24 * 60 * 60; // 1 day in seconds
            const tx1 = await piggyBank.createSavingsPlan(ethers.ZeroAddress, lockPeriod); // ETH plan
            await tx1.wait();

            console.log("✅ Created ETH savings plan (ID: 1)");

            // Deposit some ETH
            const depositAmount = ethers.parseEther("0.001");
            const tx2 = await piggyBank.depositETH(1, { value: depositAmount });
            await tx2.wait();

            console.log(`✅ Deposited ${ethers.formatEther(depositAmount)} ETH`);

            // Get plan details
            const planDetails = await piggyBank.getPlanDetails(1);
            console.log(`📊 Plan balance: ${ethers.formatEther(planDetails.amount)} ETH`);
            console.log(`🔒 Unlock time: ${new Date(Number(planDetails.unlockTime) * 1000).toISOString()}`);

            // Check if locked
            const isLocked = await piggyBank.isLocked(1);
            console.log(`🔐 Is locked: ${isLocked}`);

            if (isLocked) {
                const timeRemaining = await piggyBank.getTimeRemaining(1);
                console.log(`⏰ Time remaining: ${timeRemaining} seconds`);
            }

        } catch (error) {
            console.error("❌ PiggyBank interaction failed:", error);
            throw error;
        }
    }
}

// Configuration for Lisk Sepolia
const liskSepoliaConfig: DeploymentConfig = {
    network: "lisk-sepolia",
    confirmations: 2,
    gasPrice: "0.1", // 0.1 gwei (Lisk has very low gas fees)
    gasLimit: "5000000" // Increased gas limit for contract deployment
};

// Main deployment function
async function main() {
    try {
        // Get network name
        const network = await ethers.provider.getNetwork();

        console.log(`🌐 Deploying to Lisk Sepolia (Chain ID: ${network.chainId})`);

        // Verify we're on Lisk Sepolia (Chain ID: 4202)
        if (network.chainId !== 4202n) {
            throw new Error(`❌ Wrong network! Expected Lisk Sepolia (4202), got ${network.chainId}`);
        }

        // Create deployer instance with Lisk Sepolia config
        const deployer = new PiggyBankDeployer(liskSepoliaConfig);

        // Deploy contracts
        const result = await deployer.deploy();

        // Save deployment info
        const deploymentInfo = {
            network: "lisk-sepolia",
            chainId: "4202",
            factoryAddress: result.factoryAddress,
            deploymentTx: result.deploymentTx,
            gasUsed: result.gasUsed,
            deploymentCost: result.deploymentCost,
            timestamp: new Date().toISOString(),
            deployer: (await ethers.getSigners())[0].address,
            rpcUrl: "https://rpc.sepolia-api.lisk.com",
            blockExplorer: `https://sepolia-blockscout.lisk.com/address/${result.factoryAddress}`
        };

        console.log("\n📄 Lisk Sepolia Deployment Summary:");
        console.log(JSON.stringify(deploymentInfo, null, 2));

        // Optional: Create and test a PiggyBank
        if (process.env.CREATE_TEST_BANK === "true") {
            console.log("\n🧪 Creating test PiggyBank...");
            const [deployerSigner] = await ethers.getSigners();
            const testBankAddress = await deployer.createTestPiggyBank(result.factory, deployerSigner.address);
            await deployer.interactWithPiggyBank(testBankAddress, deployerSigner);
        }

        console.log("\n🎉 Lisk Sepolia deployment completed successfully!");
        console.log(`🔗 View on Lisk Sepolia Explorer: https://sepolia-blockscout.lisk.com/address/${result.factoryAddress}`);

    } catch (error) {
        console.error("💥 Deployment failed:", error);
        process.exit(1);
    }
}

// Export for use in other scripts
export { PiggyBankDeployer, liskSepoliaConfig };

// Run deployment if this file is executed directly
if (require.main === module) {
    main().catch((error) => {
        console.error(error);
        process.exit(1);
    });
}