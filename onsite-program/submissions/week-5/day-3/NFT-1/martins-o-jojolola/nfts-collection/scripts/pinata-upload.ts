import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Pinata API configuration
const PINATA_JWT = process.env.PINATA_JWT;
const PINATA_PIN_FILE_URL = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
const PINATA_PIN_JSON_URL = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';

interface UploadResult {
    hash: string;
    url: string;
    size: number;
    timestamp: string;
}

interface NFTMetadata {
    name: string;
    description: string;
    external_url?: string;
    attributes?: Array<{ trait_type: string; value: string | number; display_type?: string }>;
    creator?: string;
    properties?: Record<string, any>;
}

interface CompleteNFTUploadResult {
    image: {
        hash: string;
        url: string;
        gateway: string;
    };
    metadata: {
        hash: string;
        url: string;
        gateway: string;
    };
    tokenURI: string;
}

export async function uploadFileToIPFS(filePath: string, fileName: string): Promise<UploadResult> {
    try {
        console.log(`📤 Uploading ${fileName} to IPFS...`);

        const formData = new FormData();
        const fileStream = fs.createReadStream(filePath);
        formData.append('file', fileStream, fileName);

        const pinataMetadata = JSON.stringify({
            name: fileName,
            keyvalues: {
                type: 'nft-image',
                uploadDate: new Date().toISOString()
            }
        });
        formData.append('pinataMetadata', pinataMetadata);

        const pinataOptions = JSON.stringify({
            cidVersion: 1
        });
        formData.append('pinataOptions', pinataOptions);

        const response = await axios.post(PINATA_PIN_FILE_URL, formData, {
            headers: {
                ...formData.getHeaders(),
                Authorization: `Bearer ${PINATA_JWT}`
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        const ipfsHash = response.data.IpfsHash;
        const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

        console.log(`✅ File uploaded successfully!`);
        console.log(`📍 IPFS Hash: ${ipfsHash}`);
        console.log(`🔗 IPFS URL: ${ipfsUrl}`);

        return {
            hash: ipfsHash,
            url: ipfsUrl,
            size: response.data.PinSize,
            timestamp: response.data.Timestamp
        };
    } catch (error: any) {
        console.error('❌ Error uploading file:', error?.response?.data || error.message);
        throw error;
    }
}


export async function uploadJSONToIPFS(metadata: object, name: string): Promise<UploadResult> {
    try {
        console.log(`📤 Uploading ${name} metadata to IPFS...`);

        const data = {
            pinataContent: metadata,
            pinataMetadata: {
                name,
                keyvalues: {
                    type: 'nft-metadata',
                    uploadDate: new Date().toISOString()
                }
            },
            pinataOptions: {
                cidVersion: 1
            }
        };

        const response = await axios.post(PINATA_PIN_JSON_URL, data, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${PINATA_JWT}`
            }
        });

        const ipfsHash = response.data.IpfsHash;
        const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

        console.log(`✅ Metadata uploaded successfully!`);
        console.log(`📍 IPFS Hash: ${ipfsHash}`);
        console.log(`🔗 IPFS URL: ${ipfsUrl}`);

        return {
            hash: ipfsHash,
            url: ipfsUrl,
            size: response.data.PinSize,
            timestamp: response.data.Timestamp
        };
    } catch (error: any) {
        console.error('❌ Error uploading JSON:', error?.response?.data || error.message);
        throw error;
    }
}

export async function uploadMultipleFiles(filePaths: string[]) {
    const results = [];

    for (const filePath of filePaths) {
        const fileName = path.basename(filePath);
        try {
            const result = await uploadFileToIPFS(filePath, fileName);
            results.push({ fileName, filePath, ...result });

            await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (error: any) {
            console.error(`❌ Failed to upload ${fileName}:`, error.message);
            results.push({ fileName, filePath, error: error.message });
        }
    }

    return results;
}

/**
 * Create and upload NFT metadata
 */
export async function createAndUploadNFTMetadata(imageHash: string, nftData: NFTMetadata): Promise<UploadResult> {
    const metadata = {
        name: nftData.name,
        description: nftData.description,
        image: `ipfs://${imageHash}`,
        external_url: nftData.external_url || '',
        attributes: nftData.attributes || [],
        properties: {
            creator: nftData.creator || 'Unknown',
            blockchain: 'Lisk',
            network: 'Testnet',
            created_date: new Date().toISOString(),
            ...nftData.properties
        }
    };

    return await uploadJSONToIPFS(metadata, `${nftData.name}-metadata`);
}

/**
 * Upload image + metadata
 */
export async function uploadCompleteNFT(imagePath: string, nftData: NFTMetadata): Promise<CompleteNFTUploadResult> {
    try {
        console.log('🚀 Starting complete NFT upload workflow...');
        const fileName = path.basename(imagePath);
        const imageResult = await uploadFileToIPFS(imagePath, fileName);
        const metadataResult = await createAndUploadNFTMetadata(imageResult.hash, nftData);

        const result: CompleteNFTUploadResult = {
            image: {
                hash: imageResult.hash,
                url: imageResult.url,
                gateway: `https://gateway.pinata.cloud/ipfs/${imageResult.hash}`
            },
            metadata: {
                hash: metadataResult.hash,
                url: metadataResult.url,
                gateway: `https://gateway.pinata.cloud/ipfs/${metadataResult.hash}`
            },
            tokenURI: `ipfs://${metadataResult.hash}`
        };

        console.log('\n🎉 Complete NFT uploaded successfully!');
        console.log('📊 Summary:');
        console.log(`   Image IPFS: ${result.image.hash}`);
        console.log(`   Metadata IPFS: ${result.metadata.hash}`);
        console.log(`   Token URI: ${result.tokenURI}`);
        console.log(`   Image URL: ${result.image.gateway}`);
        console.log(`   Metadata URL: ${result.metadata.gateway}`);

        return result;
    } catch (error: any) {
        console.error('❌ Complete NFT upload failed:', error.message);
        throw error;
    }
}

/**
 * Test Pinata connectivity
 */
export async function testPinataConnection(): Promise<boolean> {
    try {
        console.log('🔍 Testing Pinata connection...');
        const response = await axios.get('https://api.pinata.cloud/data/testAuthentication', {
            headers: {
                Authorization: `Bearer ${PINATA_JWT}`
            }
        });
        console.log('✅ Pinata connection successful!');
        console.log('📋 Account info:', response.data.message);
        return true;
    } catch (error: any) {
        console.error('❌ Pinata connection failed:', error.response?.data || error.message);
        return false;
    }
}
