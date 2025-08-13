const { ethers } = require("ethers");
const { signPermit } = require("./signPermit");

async function main() {
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
    const signer = new ethers.Wallet(privateKey, provider);

    const permit = {
        permitted: {
            token: "0x6B175474E89094C44Da98b954EedeAC495271d0F", // DAI
            amount: ethers.parseUnits("100", 18)
        },
        nonce: 0,
        deadline: Math.floor(Date.now() / 1000) + 3600
    };

    const signature = await signPermit(permit, signer);
    console.log("Signature:", signature);
    console.log("Signer address:", signer.address);
}

main().catch(console.error);