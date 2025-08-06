// ignition/modules/IERC721.ts
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const IERC721Module = buildModule("IERC721Module", (m) => {
    // Use fully qualified name: "filepath:ContractName"
    const nft = m.contract("contracts/CustomNFT.sol:CustomNFT");

    const mintToAddress = m.getParameter("mintToAddress", "0xBB543FC7EE81BfD6880313E25740dA711cAfC14D");
    const tokenURI = m.getParameter("tokenURI", "ipfs://bafkreicjzkarpqossc5xyty3tqxnyk3ff2c244wucvhoj4q7nufgon2edy/AMAS.jpg");
    
    m.call(nft, "safeMint", [mintToAddress, tokenURI], {
        id: "mint_first_token"
    });

    return { 
        nft
    };
});

export default IERC721Module;