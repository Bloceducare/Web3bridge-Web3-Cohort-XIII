import { ethers } from "hardhat";
import { PERMIT_DOMAIN, PERMIT_TYPES, getPermitSignature, SwapParams } from "./eip712Types";

async function main() {
    
    const PRIVATE_KEY = process.env.PRIVATE_KEY || "8cb0b52fc757ac15ff0d9a151c52a371e16cabddc10a6f86e0897597c6c55d0e";
    const PERMIT_SWAP_CONTRACT = process.env.PERMIT_SWAP_CONTRACT || "0x000000000022D473030F116dDEE9F6B43aC78BA3";
    const TOKEN_IN = process.env.TOKEN_IN || "0xA0b86a33E6441b8c4C8C0b4b4C8C0b4b4C8C0b4b"; // USDC
    const TOKEN_OUT = process.env.TOKEN_OUT || "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"; // WETH
    const AMOUNT_IN = ethers.parseUnits("100", 6); 
    const AMOUNT_OUT_MIN = ethers.parseUnits("0.05", 18); 
    const FEE = 3000; 
  

    PERMIT_DOMAIN.verifyingContract = PERMIT_SWAP_CONTRACT;
    PERMIT_DOMAIN.chainId = Number(await ethers.provider.getNetwork().then(net => net.chainId));
    
    const wallet = new ethers.Wallet(PRIVATE_KEY);
    const owner = wallet.address;
    

    const tokenContract = new ethers.Contract(
        TOKEN_IN,
        ["function nonces(address) view returns (uint256)"],
        ethers.provider
    );
    
    const nonce = await tokenContract.nonces(owner);
    
 
    const deadline = Math.floor(Date.now() / 1000) + 3600;
    
    
    const permitData = {
        owner,
        spender: PERMIT_SWAP_CONTRACT,
        value: AMOUNT_IN.toString(),
        nonce: nonce.toString(),
        deadline: deadline.toString(),
    };
    
    console.log("Permit Data:");
    console.log("Owner:", owner);
    console.log("Spender:", PERMIT_SWAP_CONTRACT);
    console.log("Value:", ethers.formatUnits(AMOUNT_IN, 6), "USDC");
    console.log("Nonce:", nonce.toString());
    console.log("Deadline:", new Date(deadline * 1000).toISOString());
    console.log("Chain ID:", PERMIT_DOMAIN.chainId);
    
    const signature = await getPermitSignature(
        owner,
        PERMIT_SWAP_CONTRACT,
        AMOUNT_IN.toString(),
        nonce.toString(),
        deadline.toString(),
        PRIVATE_KEY,
        PERMIT_DOMAIN
    );
    
    console.log("\nSignature:");
    console.log("v:", signature.v);
    console.log("r:", signature.r);
    console.log("s:", signature.s);
    
  
    const swapParams: SwapParams = {
        tokenIn: TOKEN_IN,
        tokenOut: TOKEN_OUT,
        amountIn: AMOUNT_IN.toString(),
        amountOutMinimum: AMOUNT_OUT_MIN.toString(),
        fee: FEE,
        deadline: deadline.toString(),
        permit: permitData,
    };
    
    console.log("\nSwap Parameters:");
    console.log(JSON.stringify(swapParams, null, 2));
    
  
    const permitSwapContract = new ethers.Contract(
        PERMIT_SWAP_CONTRACT,
        [
            "function permitAndSwap(address,address,uint256,uint256,uint24,uint256,uint8,bytes32,bytes32) returns (uint256)"
        ],
        ethers.provider
    );
    
    const txData = permitSwapContract.interface.encodeFunctionData("permitAndSwap", [
        TOKEN_IN,
        TOKEN_OUT,
        AMOUNT_IN,
        AMOUNT_OUT_MIN,
        FEE,
        deadline,
        signature.v,
        signature.r,
        signature.s,
    ]);
    
    console.log("\nTransaction Data for Relayer:");
    console.log("To:", PERMIT_SWAP_CONTRACT);
    console.log("Data:", txData);
    
  
    const fs = require("fs");
    const output = {
        permitData,
        signature,
        swapParams,
        transactionData: {
            to: PERMIT_SWAP_CONTRACT,
            data: txData,
        },
        domain: PERMIT_DOMAIN,
    };
    
    fs.writeFileSync("permit-signature.json", JSON.stringify(output, null, 2));
    console.log("\nSignature data saved to permit-signature.json");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
