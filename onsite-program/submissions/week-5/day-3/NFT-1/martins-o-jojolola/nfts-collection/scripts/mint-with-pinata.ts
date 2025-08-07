import { ethers } from "hardhat";
import { uploadCompleteNFT } from './pinata-upload';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { NftMetadata, IpfsUploadResult, NFTDetails } from './types';

dotenv.config();

const CONTRACT_ADDRESS = "0xB4A124C569ddC6D89faA71F2da0225f5e52c8b3f";

export async function mintWithPinata(imagePath: string, nftData: NftMetadata): Promise<NFTDetails> {
    if (CONTRACT_ADDRESS === "0xB4A124C569ddC6D89faA71F2da0225f5e52c8b3f") {
        throw new Error("Please update CONTRACT_ADDRESS in the script");
    }

    const ipfsResult: IpfsUploadResult = await uploadCompleteNFT(imagePath, nftData);

    const [minter] = await ethers.getSigners();
    const SimpleNFT = await ethers.getContractFactory("MartinsNFT");
    const simpleNFT = SimpleNFT.attach(CONTRACT_ADDRESS);

    const mintPrice = await simpleNFT.mintPrice();
    const totalSupply = await simpleNFT.totalSupply();
    const balance = await ethers.provider.getBalance(minter.address);

    if (balance < mintPrice) {
        throw new Error("Insufficient balance for minting");
    }

    const tx = await simpleNFT.mint(minter.address, ipfsResult.tokenURI, {
        value: mintPrice,
        gasLimit: 300_000
    });

    const receipt = await tx.wait();

    const mintEvent = receipt.logs.find(log => {
        try {
            const parsed = simpleNFT.interface.parseLog(log);
            return parsed.name === "NFTMinted";
        } catch {
            return false;
        }
    });

    const tokenId = mintEvent
        ? simpleNFT.interface.parseLog(mintEvent).args.tokenId
        : totalSupply + 1n;

    const nftDetails: NFTDetails = {
        contractAddress: CONTRACT_ADDRESS,
        tokenId: tokenId.toString(),
        owner: minter.address,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        ipfs: ipfsResult,
        mintedAt: new Date().toISOString(),
        name: nftData.name,
        description: nftData.description
    };

    const fileName = `nft-${tokenId}-details-${Date.now()}.json`;
    fs.writeFileSync(fileName, JSON.stringify(nftDetails, null, 2));
    return nftDetails;
}

export async function batchMintWithPinata(imagesDirectory: string): Promise<any[]> {
    const imageFiles = fs.readdirSync(imagesDirectory)
        .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
        .slice(0, 10);

    const results: any[] = [];

    for (let i = 0; i < imageFiles.length; i++) {
        const imagePath = path.join(imagesDirectory, imageFiles[i]);
        const fileName = path.parse(imageFiles[i]).name;

        const nftData: NftMetadata = {
            name: `${fileName.charAt(0).toUpperCase() + fileName.slice(1)} NFT #${i + 1}`,
            description: `Auto-generated NFT from ${imageFiles[i]}`,
            external_url: "https://your-website.com",
            attributes: [
                { trait_type: "Collection", value: "Auto Generated" },
                { trait_type: "Batch", value: new Date().toISOString().split('T')[0] },
                { trait_type: "Number", value: i + 1, display_type: "number" }
            ],
            creator: "Batch Creator",
            properties: {
                category: "Generated",
                originalFileName: imageFiles[i]
            }
        };

        try {
            const result = await mintWithPinata(imagePath, nftData);
            results.push(result);
            if (i < imageFiles.length - 1) await new Promise(res => setTimeout(res, 3000));
        } catch (error: any) {
            results.push({ fileName: imageFiles[i], error: error.message, failed: true });
        }
    }

    const batchFile = `batch-mint-results-${Date.now()}.json`;
    fs.writeFileSync(batchFile, JSON.stringify(results, null, 2));
    return results;
}

if (require.main === module) {
    const args = process.argv.slice(2);
    const command = args[0];

    (async () => {
        switch (command) {
            case 'single':
                if (!args[1]) {
                    console.error('Usage: ts-node mint-with-pinata.ts single <image-path> [name]');
                    process.exit(1);
                }

                const singleNftData: NftMetadata = {
                    name: args[2] || `NFT ${Date.now()}`,
                    description: "Amazing NFT with Pinata IPFS on Lisk testnet!",
                    external_url: "https://your-website.com",
                    attributes: [
                        { trait_type: "Storage", value: "IPFS" },
                        { trait_type: "Network", value: "Lisk Testnet" },
                        { trait_type: "Rarity", value: "Unique" },
                        { trait_type: "Created", value: new Date().toISOString().split('T')[0] }
                    ],
                    creator: "NFT Creator",
                    properties: {
                        category: "Digital Art",
                        tool: "Pinata + Hardhat"
                    }
                };

                await mintWithPinata(args[1], singleNftData);
                break;

            case 'batch':
                if (!args[1]) {
                    console.error('Usage: ts-node mint-with-pinata.ts batch <images-directory>');
                    process.exit(1);
                }
                await batchMintWithPinata(args[1]);
                break;

            default:
                console.log("Unknown command. Use 'single' or 'batch'.");
        }
    })();
}
