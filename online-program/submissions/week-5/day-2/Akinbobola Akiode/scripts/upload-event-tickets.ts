import * as fs from 'fs';
import * as path from 'path';
import FormData from 'form-data';
import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY;

if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
    console.error('❌ Missing Pinata API keys in .env file');
    console.log('Please add the following to your .env file:');
    console.log('PINATA_API_KEY=your_api_key_here');
    console.log('PINATA_SECRET_KEY=your_secret_key_here');
    process.exit(1);
}

async function uploadToPinata(filePath: string, fileName: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    
    const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
        headers: {
            'pinata_api_key': PINATA_API_KEY,
            'pinata_secret_api_key': PINATA_SECRET_KEY,
            ...formData.getHeaders()
        }
    });
    
    return response.data.IpfsHash;
}

async function uploadFolder(folderPath: string, folderName: string): Promise<string> {
    console.log(`🖼️  Uploading ${folderName} to IPFS...`);
    
    const formData = new FormData();
    const files = fs.readdirSync(folderPath);
    
    for (const file of files) {
        const filePath = path.join(folderPath, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isFile()) {
            formData.append('file', fs.createReadStream(filePath), {
                filepath: `${folderName}/${file}`
            });
        }
    }
    
    const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
        headers: {
            'pinata_api_key': PINATA_API_KEY,
            'pinata_secret_api_key': PINATA_SECRET_KEY,
            ...formData.getHeaders()
        }
    });
    
    return response.data.IpfsHash;
}

async function updateMetadataWithIPFS(metadataHash: string): Promise<void> {
    const metadataDir = path.join(__dirname, '..', 'generated', 'event-tickets', 'metadata');
    const files = fs.readdirSync(metadataDir);
    
    console.log('📝 Updating metadata with IPFS URLs...');
    
    for (const file of files) {
        if (file.endsWith('.json')) {
            const filePath = path.join(metadataDir, file);
            const metadata = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            
            metadata.image = `ipfs://${metadataHash}/${file.replace('.json', '.svg')}`;
            
            fs.writeFileSync(filePath, JSON.stringify(metadata, null, 2));
        }
    }
}

async function main() {
    try {
        const eventTicketsDir = path.join(__dirname, '..', 'generated', 'event-tickets');
        const imagesDir = path.join(eventTicketsDir, 'images');
        const metadataDir = path.join(eventTicketsDir, 'metadata');
        
        if (!fs.existsSync(imagesDir) || !fs.existsSync(metadataDir)) {
            console.log('❌ Please run "npx ts-node scripts/generate-event-tickets.ts" first');
            return;
        }
        
        console.log('🚀 Starting IPFS upload for event tickets...');
        
        const imagesHash = await uploadFolder(imagesDir, 'images');
        console.log(`✅ Images uploaded: ipfs://${imagesHash}/`);
        
        await updateMetadataWithIPFS(imagesHash);
        
        const metadataHash = await uploadFolder(metadataDir, 'metadata');
        console.log(`✅ Metadata uploaded: ipfs://${metadataHash}/`);
        
        console.log('\n🎉 Upload complete!');
        console.log('\n📋 Next steps:');
        console.log(`1. Update your EventContract base URI with: ipfs://${metadataHash}/`);
        console.log(`2. Deploy contract: npx hardhat run scripts/simulate-event-ticketing.ts --network <network>`);
        console.log(`3. Verify contract: npx hardhat verify --network <network> CONTRACT_ADDRESS "ipfs://${metadataHash}/"`);
        
        const hashInfo = {
            imagesHash: imagesHash,
            metadataHash: metadataHash,
            imagesUrl: `ipfs://${imagesHash}/`,
            metadataUrl: `ipfs://${metadataHash}/`,
            timestamp: new Date().toISOString()
        };
        
        fs.writeFileSync(
            path.join(__dirname, '..', 'event-tickets-ipfs-hashes.json'), 
            JSON.stringify(hashInfo, null, 2)
        );
        console.log('\n💾 IPFS hashes saved to event-tickets-ipfs-hashes.json');
        
    } catch (error) {
        console.error('❌ Upload failed:', error);
        process.exit(1);
    }
}

main(); 