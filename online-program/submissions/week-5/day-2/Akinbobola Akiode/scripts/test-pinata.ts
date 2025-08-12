import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY;

async function testPinataConnection() {
  console.log("🔗 Testing Pinata IPFS connection...");

  if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
    console.error('❌ Missing Pinata API keys in .env file');
    console.log('Please add the following to your .env file:');
    console.log('PINATA_API_KEY=your_api_key_here');
    console.log('PINATA_SECRET_KEY=your_secret_key_here');
    process.exit(1);
  }

  try {
    console.log('📡 Testing API connection...');
    
    const response = await axios.get('https://api.pinata.cloud/data/testAuthentication', {
      headers: {
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_SECRET_KEY
      }
    });

    if (response.status === 200) {
      console.log('✅ Pinata connection successful!');
      console.log('🎯 API keys are valid and working');
    } else {
      console.log('❌ Pinata connection failed');
      console.log(`Status: ${response.status}`);
    }

  } catch (error) {
    console.error('❌ Pinata connection test failed:');
    if (axios.isAxiosError(error)) {
      console.error(`Status: ${error.response?.status}`);
      console.error(`Message: ${error.response?.data?.message || error.message}`);
    } else {
      console.error(error);
    }
    process.exit(1);
  }

  console.log('\n🎉 Pinata connection test completed successfully!');
  console.log('You can now use the upload scripts to upload files to IPFS.');
}

testPinataConnection().catch(console.error); 