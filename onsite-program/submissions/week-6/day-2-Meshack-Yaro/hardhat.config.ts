import { HardhatUserConfig, vars } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    hardhat: {
      forking: {
        url: `https://eth-mainnet.g.alchemy.com/v2/${vars.get("ALCHEMY_API_KEY")}`,
      },
    },
  },
};

export default config;



// import { HardhatUserConfig, vars } from "hardhat/config";
// import "@nomicfoundation/hardhat-toolbox";

// export default async function (): Promise<HardhatUserConfig> {
//   const ALCHEMY_API_KEY = await vars.get("ALCHEMY_API_KEY");

//   return {
//     solidity: "0.8.28",
//     networks: {
//       hardhat: {
//         forking: {
//           url: `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
//         },
//       },
//     },
//   };
// }
