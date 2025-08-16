<!-- # Sample Hardhat 3 Beta Project (`mocha` and `ethers`)

This project showcases a Hardhat 3 Beta project using `mocha` for tests and the `ethers` library for Ethereum interactions.

To learn more about the Hardhat 3 Beta, please visit the [Getting Started guide](https://hardhat.org/docs/getting-started#getting-started-with-hardhat-3). To share your feedback, join our [Hardhat 3 Beta](https://hardhat.org/hardhat3-beta-telegram-group) Telegram group or [open an issue](https://github.com/NomicFoundation/hardhat/issues/new) in our GitHub issue tracker.

## Project Overview

This example project includes:

- A simple Hardhat configuration file.
- Foundry-compatible Solidity unit tests.
- TypeScript integration tests using `mocha` and ethers.js
- Examples demonstrating how to connect to different types of networks, including locally simulating OP mainnet.

## Usage

### Running Tests

To run all the tests in the project, execute the following command:

```shell
npx hardhat test
```

You can also selectively run the Solidity or `mocha` tests:

```shell
npx hardhat test solidity
npx hardhat test mocha
```

### Make a deployment to Sepolia

This project includes an example Ignition module to deploy the contract. You can deploy this module to a locally simulated chain or to Sepolia.

To run the deployment to a local chain:

```shell
npx hardhat ignition deploy ignition/modules/Counter.ts
```

To run the deployment to Sepolia, you need an account with funds to send the transaction. The provided Hardhat configuration includes a Configuration Variable called `SEPOLIA_PRIVATE_KEY`, which you can use to set the private key of the account you want to use.

You can set the `SEPOLIA_PRIVATE_KEY` variable using the `hardhat-keystore` plugin or by setting it as an environment variable.

To set the `SEPOLIA_PRIVATE_KEY` config variable using `hardhat-keystore`:

```shell
npx hardhat keystore set SEPOLIA_PRIVATE_KEY
```

After setting the variable, you can run the deployment with the Sepolia network:

```shell
npx hardhat ignition deploy --network sepolia ignition/modules/Counter.ts
``` -->
## contract deployment address
- 0x0fC4D47304060d0B0BE73Ac06D2383B2FEae408E

## contract delpoyment verification link
[click here to verify](https://sepolia-blockscout.lisk.com/address/0x0fC4D47304060d0B0BE73Ac06D2383B2FEae408E?tab=index)

## Hardhat version3 verification 
- install hardhat Keystore dependency to access keystore when deploying
```
    npx hardhat -D @nomicfoundation/hardhat-keystore
```
or using pnpm
```
    pnpm add -D @nomicfoundation/hardhat-keystore
```

- install the hardhat verify dependency
```
    npx hardhat -D @nomicfoundation/hardhat-verify";
```
- add Your environment variables using keystore instead of using the custom VARS in V2
```
    npx hardhat keystore set ENVIRONMENT_VARIABLE
```
after setting your Environment variables, your hardhat config.ts should look like this
```
    import type { HardhatUserConfig } from "hardhat/config";
    import hardhatVerify from "@nomicfoundation/hardhat-verify";
    import hardhatKeystore from "@nomicfoundation/hardhat-Keystore";
    import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
    import { configVariable } from "hardhat/config";

    const config: HardhatUserConfig = {
    plugins: [hardhatToolboxMochaEthersPlugin, hardhatVerify, hardhatKeystore],
    solidity: {
        profiles: {
        default: {
            version: "0.8.28",
        },
        production: {
            version: "0.8.28",
            settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
            viaIR: true,
            },
        },
        },
    },
    networks: {
        liskSepolia: {
            type: "http",
            url:configVariable("LISK_SEPOLIA_URL"),
            accounts: [configVariable("PRIVATE_KEY")],
            chainId: 4202,
        },
        hardhatMainnet: {
            type: "edr-simulated",
            chainType: "l1",
        },
        hardhatOp: {
            type: "edr-simulated",
            chainType: "op",
        },
    },
    verify: {
        etherscan: {
            apiKey: configVariable("ETHERSCAN_API_KEY"),
        },
        blockscout: {
            enabled: true,
        }
    },
        chainDescriptors: {
        4202: {
        name: "Listk Sepolia Blockscout",
        blockExplorers: {
            blockscout: {
                name: "Lisk Sepolia Blockscout",
                url: "https://rpc.sepolia-api.lisk.com",
                apiUrl: "https://sepolia-blockscout.lisk.com/api",
            },
            etherscan: {
                name: "Lisk Sepolia Blockscout",
                url: "https://rpc.sepolia-api.lisk.com",
                apiUrl: "https://sepolia-blockscout.lisk.com/api",
            },
        },
        },
    },
    };

    export default config;
```

- to deploy your contract

```
    npx hardhat ignition deploy --network <THE NETWORK YOU USED IN YOUR CONFIG i.e liskSepolia in this case> ignition/modules/Counter.ts 
```

or with pnpm 

```
    pnpm hardhat ignition deploy --network lisksepolia ignition/modules/Counter.ts 
```

- After the deploment create a file to programattically verify your deployed contract
- create your verification script file.
 After creating your verification script file, its content should look like this

```
    import hre from "hardhat";
    import { verifyContract } from "@nomicfoundation/hardhat-verify/verify";

    await verifyContract(
    {
        address: "YOUR DEPLOYED CONTRACT ADDRESS",
        constructorArgs: [YOUR CONTRACT ARGS], // you can comment this line is your contract has no arguement
        provider: "etherscan",
    },
    hre,
    );
```

- build your project again using 

```
    npx hardhat build --build-profile production
``` 
    or using pnpm 
```
    pnpm dlx hardhat build --build-profile production
```
- Run the script using 
```
    hardhat verify --network <YOUR NETWORK TO DEPLOY AS IT IS IN THE HARDHAT CONFIG (liskSepolia in this case)> <DEPLOYED CONTRACT ADDRESS> 
```
or 
```
    pnpm dlx hardhat verify --network <YOUR NETWORK TO DEPLOY AS IT IS IN THE HARDHAT CONFIG (liskSepolia in this case)> <DEPLOYED CONTRACT ADDRESS> 
```

### Congrats 🎉🎉
you have successfully verified your contract 
you can check the scan

### Proudly sponsored by WAGMI.
