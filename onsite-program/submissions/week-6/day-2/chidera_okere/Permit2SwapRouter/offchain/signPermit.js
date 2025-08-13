const { ethers } = require("ethers");

const domain = {
    name: "Permit2",
    chainId: 1,
    verifyingContract: "0x000000000022D473030F116dDEE9F6B43aC78BA3"
};

const types = {
    PermitTransferFrom: [
        { name: "permitted", type: "TokenPermissions" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" }
    ],
    TokenPermissions: [
        { name: "token", type: "address" },
        { name: "amount", type: "uint256" }
    ]
};

async function signPermit(permitData, signer) {
    const signature = await signer.signTypedData(domain, types, permitData);
    return signature;
}

module.exports = { signPermit };