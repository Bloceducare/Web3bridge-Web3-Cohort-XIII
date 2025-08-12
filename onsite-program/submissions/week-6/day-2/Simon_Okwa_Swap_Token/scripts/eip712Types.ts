import { ethers } from "hardhat";

export const PERMIT_DOMAIN = {
    name: "PermitSwap",
    version: "1",
    chainId: 1, // Mainnet - change as needed
    verifyingContract: "", // Will be set when deploying
};

export const PERMIT_TYPES = {
    Permit: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
        { name: "value", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
    ],
};

export interface PermitData {
    owner: string;
    spender: string;
    value: string;
    nonce: string;
    deadline: string;
}

export interface SwapParams {
    tokenIn: string;
    tokenOut: string;
    amountIn: string;
    amountOutMinimum: string;
    fee: number;
    deadline: string;
    permit: PermitData;
}

export async function getPermitSignature(
    owner: string,
    spender: string,
    value: string,
    nonce: string,
    deadline: string,
    privateKey: string,
    domain: any
): Promise<{ v: number; r: string; s: string }> {
    const wallet = new ethers.Wallet(privateKey);
    
    const message = {
        owner,
        spender,
        value,
        nonce,
        deadline,
    };

    const signature = await wallet.signTypedData(domain, PERMIT_TYPES, message);
    const sig = ethers.Signature.from(signature);
    
    return {
        v: sig.v,
        r: sig.r,
        s: sig.s,
    };
}
