// ignition/modules/IERC721.ts
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const IERC721Module = buildModule("IERC721Module", (m) => {
    // Use fully qualified name: "filepath:ContractName"
     const nft = m.contract("contracts/UniqueNFT.sol:UniqueNFT");

    const mintToAddress = m.getParameter("mintToAddress", "0xBB543FC7EE81BfD6880313E25740dA711cAfC14D");
    const tokenURI = m.getParameter("tokenURI", "https://coffee-urgent-owl-462.mypinata.cloud/ipfs/bafkreifq4lhld3ttipg3r7c72hbareqqjmw7chws3rblsftuhew3of44rm");
    
    m.call(nft, "safeMint", [mintToAddress, tokenURI], {
        id: "mint_eighth_token"
    });

    return { 
        nft
    };
});

export default IERC721Module;