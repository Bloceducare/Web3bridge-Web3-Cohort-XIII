const { ethers } = require('hardhat');

async function main() {
    const baseURI = 'https://purple-official-muskox-784.mypinata.cloud/ipfs/bafkreibd2eo2wu5evrdumfezlw7spy7gc3ib4t5jwthxo5l527opzqaoja'; 
    const MyNFT = await ethers.getContractFactory('MyNFT');
    const myNFT = await MyNFT.deploy(baseURI);
    console.log('MyNFT deployed to:', myNFT.address);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });