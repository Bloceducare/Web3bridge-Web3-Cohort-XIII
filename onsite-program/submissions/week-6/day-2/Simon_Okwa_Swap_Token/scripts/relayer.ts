import { ethers } from "hardhat";

async function main() {
    
    const RELAYER_PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000";
    const RPC_URL = process.env.RPC_URL || "http://localhost:8545";
    
    
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const relayerWallet = new ethers.Wallet(RELAYER_PRIVATE_KEY, provider);
    
    console.log("Relayer address:", relayerWallet.address);
    console.log("Network:", await provider.getNetwork().then(net => net.name));
    
    
    const fs = require("fs");
    let signatureData;
    
    try {
        signatureData = JSON.parse(fs.readFileSync("permit-signature.json", "utf8"));
    } catch (error) {
        console.error("Error reading permit-signature.json. Make sure to run the signing script first.");
        process.exit(1);
    }
    
    const { transactionData, swapParams, permitData } = signatureData;
    
    console.log("\nExecuting permit and swap transaction...");
    console.log("Token In:", swapParams.tokenIn);
    console.log("Token Out:", swapParams.tokenOut);
    console.log("Amount In:", ethers.formatUnits(swapParams.amountIn, 6), "USDC");
    console.log("Fee:", swapParams.fee);
    console.log("Deadline:", new Date(parseInt(swapParams.deadline) * 1000).toISOString());
    
 
    const currentTime = Math.floor(Date.now() / 1000);
    if (currentTime > parseInt(swapParams.deadline)) {
        console.error("Error: Permit deadline has expired");
        process.exit(1);
    }
    
    
    const gasPrice = await provider.getFeeData().then(fee => fee.gasPrice);
    console.log("Current gas price:", ethers.formatUnits(gasPrice || 0, "gwei"), "gwei");
    

    const permitSwapContract = new ethers.Contract(
        transactionData.to,
        [
            "function permitAndSwap(address,address,uint256,uint256,uint24,uint256,uint8,bytes32,bytes32) returns (uint256)"
        ],
        relayerWallet
    );
    
    try {
        const gasEstimate = await permitSwapContract.permitAndSwap.estimateGas(
            swapParams.tokenIn,
            swapParams.tokenOut,
            swapParams.amountIn,
            swapParams.amountOutMinimum,
            swapParams.fee,
            swapParams.deadline,
            signatureData.signature.v,
            signatureData.signature.r,
            signatureData.signature.s
        );
        
        console.log("Estimated gas:", gasEstimate.toString());
        
      
        const tx = await permitSwapContract.permitAndSwap(
            swapParams.tokenIn,
            swapParams.tokenOut,
            swapParams.amountIn,
            swapParams.amountOutMinimum,
            swapParams.fee,
            swapParams.deadline,
            signatureData.signature.v,
            signatureData.signature.r,
            signatureData.signature.s,
            {
                gasLimit: gasEstimate * 120n / 100n, 
                gasPrice: gasPrice,
            }
        );
        
        console.log("\nTransaction submitted!");
        console.log("Transaction hash:", tx.hash);
        console.log("Waiting for confirmation...");
        
    
        const receipt = await tx.wait();
        
        console.log("\nTransaction confirmed!");
        console.log("Block number:", receipt.blockNumber);
        console.log("Gas used:", receipt.gasUsed.toString());
        console.log("Effective gas price:", ethers.formatUnits(receipt.gasPrice || 0, "gwei"), "gwei");
        
     
        const swapExecutedEvent = receipt.logs.find((log: any) => {
            try {
                const parsed = permitSwapContract.interface.parseLog(log);
                return parsed && parsed.name === "SwapExecuted";
            } catch {
                return false;
            }
        });
        
        if (swapExecutedEvent) {
            const parsed = permitSwapContract.interface.parseLog(swapExecutedEvent);
            console.log("\nSwap executed successfully!");
            if (parsed && parsed.args && parsed.args.amountOut) {
                console.log("Amount out:", ethers.formatUnits(parsed.args.amountOut, 18), "WETH");
            } else {
                console.log("Amount out: (unable to parse)");
            }
        }
        
       
        fs.writeFileSync("transaction-receipt.json", JSON.stringify({
            transactionHash: tx.hash,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString(),
            gasPrice: receipt.gasPrice?.toString(),
            status: receipt.status,
            timestamp: new Date().toISOString(),
        }, null, 2));
        
        console.log("\nTransaction receipt saved to transaction-receipt.json");
        
    } catch (error: any) {
        console.error("Error executing transaction:", error.message);
        
        if (error.data) {
          
            try {
                const decodedError = permitSwapContract.interface.parseError(error.data);
                if (decodedError) {
                    console.error("Decoded error:", decodedError.name, decodedError.args);
                } else {
                    console.error("Failed to decode error, raw data:", error.data);
                }
            } catch {
                console.error("Raw error data:", error.data);
            }
        }
        
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
