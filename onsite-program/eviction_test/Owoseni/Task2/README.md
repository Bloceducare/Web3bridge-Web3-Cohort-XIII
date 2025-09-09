# Uniswap V2 Interaction Scripts

This project contains scripts to interact with Uniswap V2 functions on the Sepolia testnet. Each script demonstrates a different function of the Uniswap V2 Router.

## Setup

1. Make sure you have Node.js and npm installed
2. Install dependencies:
   ```shell
   npm install
   ```
3. Create a `.env` file with your Sepolia RPC URL and private key:
   ```
   SEPOLIA_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
   PRIVATE_KEY=your_private_key_here
   ```

## Available Scripts

The following scripts are available in the `ignition/modules` directory:

1. **route.ts** - Gets the factory address from the router
2. **removeLiquidity.ts** - Removes liquidity from a token pair
3. **swapExactTokensForTokens.ts** - Swaps an exact amount of input tokens for output tokens
4. **swapExactETHForTokens.ts** - Swaps an exact amount of ETH for tokens
5. **addLiquidity.ts** - Adds liquidity to a token pair
6. **getAmountsOut.ts** - Calculates the expected output amount for a given input amount
7. **getAmountsIn.ts** - Calculates the required input amount for a desired output amount

## Running the Scripts

To run a script, use the following command:

```shell
npx hardhat run ignition/modules/<script-name>.ts --network sepolia
```

For example:

```shell
npx hardhat run ignition/modules/swapExactETHForTokens.ts --network sepolia
```

## Taking Screenshots

When running each script, take a screenshot of the terminal output showing the successful interaction with Uniswap V2. Save the screenshots in the `screenshots` folder with the following naming convention:

```
<function-name>.png
```

For example:

```
swapExactETHForTokens.png
```

## Notes

- Make sure you have enough ETH and tokens on Sepolia testnet
- The token addresses in the scripts are examples and may need to be updated
- Set realistic slippage parameters in production environments
