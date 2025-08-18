import { ethers } from 'ethers'
import hre from 'hardhat'
const helpers = require('@nomicfoundation/hardhat-toolbox/network-helpers')

// Uniswap V2 Router address on Ethereum mainnet
const ROUTER_ADDRESS = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'

// Token addresses for testing
const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
const DAI_ADDRESS = '0x6B175474E89094C44Da98b954EedeAC495271d0F'
const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'

// Rich account to impersonate
const WHALE_ADDRESS = '0xf584f8728b874a6a5c7a8d4d387c9aae9172d621' // USDC whale

async function testSwapExactTokensForTokens(
  signer: any,
  router: any,
  tokenA: any,
  tokenB: any,
  amountIn: bigint
) {
  console.log('\n=== Testing swapExactTokensForTokens ===\n')

  // Approve router to spend tokens
  const approveTx = await tokenA.connect(signer).approve(ROUTER_ADDRESS, amountIn)
  await approveTx.wait()
  console.log('Approved router to spend tokens')

  // Get balances before swap
  const balanceABefore = await tokenA.balanceOf(signer.address)
  const balanceBBefore = await tokenB.balanceOf(signer.address)

  console.log(
    `Balance before swap: ${ethers.formatUnits(
      balanceABefore,
      await tokenA.decimals()
    )} ${await tokenA.symbol()}`
  )
  console.log(
    `Balance before swap: ${ethers.formatUnits(
      balanceBBefore,
      await tokenB.decimals()
    )} ${await tokenB.symbol()}`
  )

  // Execute swap
  const path = [await tokenA.getAddress(), await tokenB.getAddress()]
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20 // 20 minutes from now

  try {
    const tx = await router.connect(signer).swapExactTokensForTokens(
      amountIn,
      0, // Accept any amount of output token
      path,
      signer.address,
      deadline
    )

    const receipt = await tx.wait()
    console.log(`Swap executed successfully: ${receipt.hash}`)

    // Get balances after swap
    const balanceAAfter = await tokenA.balanceOf(signer.address)
    const balanceBAfter = await tokenB.balanceOf(signer.address)

    console.log(
      `Balance after swap: ${ethers.formatUnits(
        balanceAAfter,
        await tokenA.decimals()
      )} ${await tokenA.symbol()}`
    )
    console.log(
      `Balance after swap: ${ethers.formatUnits(
        balanceBAfter,
        await tokenB.decimals()
      )} ${await tokenB.symbol()}`
    )
    console.log(
      `Tokens spent: ${ethers.formatUnits(
        balanceABefore - balanceAAfter,
        await tokenA.decimals()
      )} ${await tokenA.symbol()}`
    )
    console.log(
      `Tokens received: ${ethers.formatUnits(
        balanceBAfter - balanceBBefore,
        await tokenB.decimals()
      )} ${await tokenB.symbol()}`
    )

    return true
  } catch (error) {
    console.error('Error executing swap:', error)
    return false
  }
}

async function testSwapTokensForExactTokens(
  signer: any,
  router: any,
  tokenA: any,
  tokenB: any,
  amountOut: bigint,
  amountInMax: bigint
) {
  console.log('\n=== Testing swapTokensForExactTokens ===\n')

  // Approve router to spend tokens
  const approveTx = await tokenA.connect(signer).approve(ROUTER_ADDRESS, amountInMax)
  await approveTx.wait()
  console.log('Approved router to spend tokens')

  // Get balances before swap
  const balanceABefore = await tokenA.balanceOf(signer.address)
  const balanceBBefore = await tokenB.balanceOf(signer.address)

  console.log(
    `Balance before swap: ${ethers.formatUnits(
      balanceABefore,
      await tokenA.decimals()
    )} ${await tokenA.symbol()}`
  )
  console.log(
    `Balance before swap: ${ethers.formatUnits(
      balanceBBefore,
      await tokenB.decimals()
    )} ${await tokenB.symbol()}`
  )

  // Execute swap
  const path = [await tokenA.getAddress(), await tokenB.getAddress()]
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20 // 20 minutes from now

  try {
    const tx = await router
      .connect(signer)
      .swapTokensForExactTokens(amountOut, amountInMax, path, signer.address, deadline)

    const receipt = await tx.wait()
    console.log(`Swap executed successfully: ${receipt.hash}`)

    // Get balances after swap
    const balanceAAfter = await tokenA.balanceOf(signer.address)
    const balanceBAfter = await tokenB.balanceOf(signer.address)

    console.log(
      `Balance after swap: ${ethers.formatUnits(
        balanceAAfter,
        await tokenA.decimals()
      )} ${await tokenA.symbol()}`
    )
    console.log(
      `Balance after swap: ${ethers.formatUnits(
        balanceBAfter,
        await tokenB.decimals()
      )} ${await tokenB.symbol()}`
    )
    console.log(
      `Tokens spent: ${ethers.formatUnits(
        balanceABefore - balanceAAfter,
        await tokenA.decimals()
      )} ${await tokenA.symbol()}`
    )
    console.log(
      `Tokens received: ${ethers.formatUnits(
        balanceBAfter - balanceBBefore,
        await tokenB.decimals()
      )} ${await tokenB.symbol()}`
    )

    return true
  } catch (error) {
    console.error('Error executing swap:', error)
    return false
  }
}

async function testAddLiquidity(
  signer: any,
  router: any,
  tokenA: any,
  tokenB: any,
  amountA: bigint,
  amountB: bigint
) {
  console.log('\n=== Testing addLiquidity ===\n')

  // Approve router to spend tokens
  const approveATx = await tokenA.connect(signer).approve(ROUTER_ADDRESS, amountA)
  await approveATx.wait()
  const approveBTx = await tokenB.connect(signer).approve(ROUTER_ADDRESS, amountB)
  await approveBTx.wait()
  console.log('Approved router to spend tokens')

  // Get balances before adding liquidity
  const balanceABefore = await tokenA.balanceOf(signer.address)
  const balanceBBefore = await tokenB.balanceOf(signer.address)

  console.log(
    `Balance before adding liquidity: ${ethers.formatUnits(
      balanceABefore,
      await tokenA.decimals()
    )} ${await tokenA.symbol()}`
  )
  console.log(
    `Balance before adding liquidity: ${ethers.formatUnits(
      balanceBBefore,
      await tokenB.decimals()
    )} ${await tokenB.symbol()}`
  )

  // Execute addLiquidity
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20 // 20 minutes from now

  try {
    const tx = await router.connect(signer).addLiquidity(
      await tokenA.getAddress(),
      await tokenB.getAddress(),
      amountA,
      amountB,
      0, // Accept any amount of tokenA
      0, // Accept any amount of tokenB
      signer.address,
      deadline
    )

    const receipt = await tx.wait()
    console.log(`Add liquidity executed successfully: ${receipt.hash}`)

    // Get balances after adding liquidity
    const balanceAAfter = await tokenA.balanceOf(signer.address)
    const balanceBAfter = await tokenB.balanceOf(signer.address)

    console.log(
      `Balance after adding liquidity: ${ethers.formatUnits(
        balanceAAfter,
        await tokenA.decimals()
      )} ${await tokenA.symbol()}`
    )
    console.log(
      `Balance after adding liquidity: ${ethers.formatUnits(
        balanceBAfter,
        await tokenB.decimals()
      )} ${await tokenB.symbol()}`
    )
    console.log(
      `Tokens deposited: ${ethers.formatUnits(
        balanceABefore - balanceAAfter,
        await tokenA.decimals()
      )} ${await tokenA.symbol()}`
    )
    console.log(
      `Tokens deposited: ${ethers.formatUnits(
        balanceBBefore - balanceBAfter,
        await tokenB.decimals()
      )} ${await tokenB.symbol()}`
    )

    return true
  } catch (error) {
    console.error('Error adding liquidity:', error)
    return false
  }
}

async function testRemoveLiquidity(
  signer: any,
  router: any,
  factory: any,
  tokenA: any,
  tokenB: any
) {
  console.log('\n=== Testing removeLiquidity ===\n')

  try {
    // Get the pair address
    const pairAddress = await factory.getPair(await tokenA.getAddress(), await tokenB.getAddress())
    console.log(`Pair address: ${pairAddress}`)

    // Get the LP token contract
    const lpToken = await hre.ethers.getContractAt('IERC20', pairAddress)

    // Get LP token balance
    const lpBalance = await lpToken.balanceOf(signer.address)
    console.log(`LP token balance: ${ethers.formatUnits(lpBalance, 18)}`)

    if (lpBalance <= 0n) {
      console.log('No LP tokens to remove liquidity')
      return false
    }

    // Approve router to spend LP tokens
    const approveTx = await lpToken.connect(signer).approve(ROUTER_ADDRESS, lpBalance)
    await approveTx.wait()
    console.log('Approved router to spend LP tokens')

    // Get balances before removing liquidity
    const balanceABefore = await tokenA.balanceOf(signer.address)
    const balanceBBefore = await tokenB.balanceOf(signer.address)

    console.log(
      `Balance before removing liquidity: ${ethers.formatUnits(
        balanceABefore,
        await tokenA.decimals()
      )} ${await tokenA.symbol()}`
    )
    console.log(
      `Balance before removing liquidity: ${ethers.formatUnits(
        balanceBBefore,
        await tokenB.decimals()
      )} ${await tokenB.symbol()}`
    )

    // Execute removeLiquidity
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20 // 20 minutes from now

    const tx = await router.connect(signer).removeLiquidity(
      await tokenA.getAddress(),
      await tokenB.getAddress(),
      lpBalance,
      0, // Accept any amount of tokenA
      0, // Accept any amount of tokenB
      signer.address,
      deadline
    )

    const receipt = await tx.wait()
    console.log(`Remove liquidity executed successfully: ${receipt.hash}`)

    // Get balances after removing liquidity
    const balanceAAfter = await tokenA.balanceOf(signer.address)
    const balanceBAfter = await tokenB.balanceOf(signer.address)

    console.log(
      `Balance after removing liquidity: ${ethers.formatUnits(
        balanceAAfter,
        await tokenA.decimals()
      )} ${await tokenA.symbol()}`
    )
    console.log(
      `Balance after removing liquidity: ${ethers.formatUnits(
        balanceBAfter,
        await tokenB.decimals()
      )} ${await tokenB.symbol()}`
    )
    console.log(
      `Tokens received: ${ethers.formatUnits(
        balanceAAfter - balanceABefore,
        await tokenA.decimals()
      )} ${await tokenA.symbol()}`
    )
    console.log(
      `Tokens received: ${ethers.formatUnits(
        balanceBAfter - balanceBBefore,
        await tokenB.decimals()
      )} ${await tokenB.symbol()}`
    )

    return true
  } catch (error) {
    console.error('Error removing liquidity:', error)
    return false
  }
}

async function main() {
  console.log('\n=== UNISWAP V2 TEST SCRIPT ===\n')

  // Impersonate a whale account
  await helpers.impersonateAccount(WHALE_ADDRESS)
  const impersonatedSigner = await hre.ethers.getSigner(WHALE_ADDRESS)
  console.log(`Impersonated account: ${impersonatedSigner.address}`)

  // Get contract instances
  const router = await hre.ethers.getContractAt('IUniswapV2Router02', ROUTER_ADDRESS)
  const factory = await hre.ethers.getContractAt('IUniswapV2Factory', await router.factory())
  const weth = await hre.ethers.getContractAt('IERC20', WETH_ADDRESS)
  const dai = await hre.ethers.getContractAt('IERC20', DAI_ADDRESS)
  const usdc = await hre.ethers.getContractAt('IERC20', USDC_ADDRESS)

  console.log('Contract instances created')

  // Test results
  const results = {
    swapExactTokensForTokens: false,
    swapTokensForExactTokens: false,
    addLiquidity: false,
    removeLiquidity: false
  }

  // Test swapExactTokensForTokens (USDC -> DAI)
  const amountIn = ethers.parseUnits('1000', 6) // 1000 USDC
  results.swapExactTokensForTokens = await testSwapExactTokensForTokens(
    impersonatedSigner,
    router,
    usdc,
    dai,
    amountIn
  )

  // Test swapTokensForExactTokens (USDC -> WETH)
  const amountOut = ethers.parseUnits('0.5', 18) // 0.5 WETH
  const amountInMax = ethers.parseUnits('2000', 6) // Max 2000 USDC
  results.swapTokensForExactTokens = await testSwapTokensForExactTokens(
    impersonatedSigner,
    router,
    usdc,
    weth,
    amountOut,
    amountInMax
  )

  // Test addLiquidity (DAI-WETH)
  const amountDAI = ethers.parseUnits('1000', 18) // 1000 DAI
  const amountWETH = ethers.parseUnits('0.5', 18) // 0.5 WETH
  results.addLiquidity = await testAddLiquidity(
    impersonatedSigner,
    router,
    dai,
    weth,
    amountDAI,
    amountWETH
  )

  // Test removeLiquidity (DAI-WETH)
  results.removeLiquidity = await testRemoveLiquidity(
    impersonatedSigner,
    router,
    factory,
    dai,
    weth
  )

  // Print test summary
  console.log('\n=== TEST SUMMARY ===\n')
  for (const [test, result] of Object.entries(results)) {
    console.log(`${test}: ${result ? '✅ PASSED' : '❌ FAILED'}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
