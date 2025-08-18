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

async function testSwapExactETHForTokens(signer: any, router: any, token: any, amountETH: bigint) {
  console.log('\n=== Testing swapExactETHForTokens ===\n')

  // Get balances before swap
  const ethBalanceBefore = await signer.provider.getBalance(signer.address)
  const tokenBalanceBefore = await token.balanceOf(signer.address)

  console.log(`ETH Balance before swap: ${ethers.formatEther(ethBalanceBefore)}`)
  console.log(
    `${await token.symbol()} Balance before swap: ${ethers.formatUnits(
      tokenBalanceBefore,
      await token.decimals()
    )}`
  )

  // Execute swap
  const path = [WETH_ADDRESS, await token.getAddress()]
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20 // 20 minutes from now

  try {
    const tx = await router.connect(signer).swapExactETHForTokens(
      0, // Accept any amount of output token
      path,
      signer.address,
      deadline,
      { value: amountETH }
    )

    const receipt = await tx.wait()
    console.log(`Swap executed successfully: ${receipt.hash}`)

    // Get balances after swap
    const ethBalanceAfter = await signer.provider.getBalance(signer.address)
    const tokenBalanceAfter = await token.balanceOf(signer.address)

    console.log(`ETH Balance after swap: ${ethers.formatEther(ethBalanceAfter)}`)
    console.log(
      `${await token.symbol()} Balance after swap: ${ethers.formatUnits(
        tokenBalanceAfter,
        await token.decimals()
      )}`
    )
    console.log(
      `Tokens received: ${ethers.formatUnits(
        tokenBalanceAfter - tokenBalanceBefore,
        await token.decimals()
      )} ${await token.symbol()}`
    )

    return true
  } catch (error) {
    console.error('Error executing swap:', error)
    return false
  }
}

async function testSwapETHForExactTokens(
  signer: any,
  router: any,
  token: any,
  amountOut: bigint,
  amountETHMax: bigint
) {
  console.log('\n=== Testing swapETHForExactTokens ===\n')

  // Get balances before swap
  const ethBalanceBefore = await signer.provider.getBalance(signer.address)
  const tokenBalanceBefore = await token.balanceOf(signer.address)

  console.log(`ETH Balance before swap: ${ethers.formatEther(ethBalanceBefore)}`)
  console.log(
    `${await token.symbol()} Balance before swap: ${ethers.formatUnits(
      tokenBalanceBefore,
      await token.decimals()
    )}`
  )

  // Execute swap
  const path = [WETH_ADDRESS, await token.getAddress()]
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20 // 20 minutes from now

  try {
    const tx = await router
      .connect(signer)
      .swapETHForExactTokens(amountOut, path, signer.address, deadline, { value: amountETHMax })

    const receipt = await tx.wait()
    console.log(`Swap executed successfully: ${receipt.hash}`)

    // Get balances after swap
    const ethBalanceAfter = await signer.provider.getBalance(signer.address)
    const tokenBalanceAfter = await token.balanceOf(signer.address)

    console.log(`ETH Balance after swap: ${ethers.formatEther(ethBalanceAfter)}`)
    console.log(
      `${await token.symbol()} Balance after swap: ${ethers.formatUnits(
        tokenBalanceAfter,
        await token.decimals()
      )}`
    )
    console.log(
      `Tokens received: ${ethers.formatUnits(
        tokenBalanceAfter - tokenBalanceBefore,
        await token.decimals()
      )} ${await token.symbol()}`
    )

    return true
  } catch (error) {
    console.error('Error executing swap:', error)
    return false
  }
}

async function testSwapExactTokensForETH(signer: any, router: any, token: any, amountIn: bigint) {
  console.log('\n=== Testing swapExactTokensForETH ===\n')

  // Approve router to spend tokens
  const approveTx = await token.connect(signer).approve(ROUTER_ADDRESS, amountIn)
  await approveTx.wait()
  console.log('Approved router to spend tokens')

  // Get balances before swap
  const ethBalanceBefore = await signer.provider.getBalance(signer.address)
  const tokenBalanceBefore = await token.balanceOf(signer.address)

  console.log(`ETH Balance before swap: ${ethers.formatEther(ethBalanceBefore)}`)
  console.log(
    `${await token.symbol()} Balance before swap: ${ethers.formatUnits(
      tokenBalanceBefore,
      await token.decimals()
    )}`
  )

  // Execute swap
  const path = [await token.getAddress(), WETH_ADDRESS]
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20 // 20 minutes from now

  try {
    const tx = await router.connect(signer).swapExactTokensForETH(
      amountIn,
      0, // Accept any amount of ETH
      path,
      signer.address,
      deadline
    )

    const receipt = await tx.wait()
    console.log(`Swap executed successfully: ${receipt.hash}`)

    // Get balances after swap
    const ethBalanceAfter = await signer.provider.getBalance(signer.address)
    const tokenBalanceAfter = await token.balanceOf(signer.address)

    console.log(`ETH Balance after swap: ${ethers.formatEther(ethBalanceAfter)}`)
    console.log(
      `${await token.symbol()} Balance after swap: ${ethers.formatUnits(
        tokenBalanceAfter,
        await token.decimals()
      )}`
    )
    console.log(
      `Tokens spent: ${ethers.formatUnits(
        tokenBalanceBefore - tokenBalanceAfter,
        await token.decimals()
      )} ${await token.symbol()}`
    )

    return true
  } catch (error) {
    console.error('Error executing swap:', error)
    return false
  }
}

async function testSwapTokensForExactETH(
  signer: any,
  router: any,
  token: any,
  amountOut: bigint,
  amountInMax: bigint
) {
  console.log('\n=== Testing swapTokensForExactETH ===\n')

  // Approve router to spend tokens
  const approveTx = await token.connect(signer).approve(ROUTER_ADDRESS, amountInMax)
  await approveTx.wait()
  console.log('Approved router to spend tokens')

  // Get balances before swap
  const ethBalanceBefore = await signer.provider.getBalance(signer.address)
  const tokenBalanceBefore = await token.balanceOf(signer.address)

  console.log(`ETH Balance before swap: ${ethers.formatEther(ethBalanceBefore)}`)
  console.log(
    `${await token.symbol()} Balance before swap: ${ethers.formatUnits(
      tokenBalanceBefore,
      await token.decimals()
    )}`
  )

  // Execute swap
  const path = [await token.getAddress(), WETH_ADDRESS]
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20 // 20 minutes from now

  try {
    const tx = await router
      .connect(signer)
      .swapTokensForExactETH(amountOut, amountInMax, path, signer.address, deadline)

    const receipt = await tx.wait()
    console.log(`Swap executed successfully: ${receipt.hash}`)

    // Get balances after swap
    const ethBalanceAfter = await signer.provider.getBalance(signer.address)
    const tokenBalanceAfter = await token.balanceOf(signer.address)

    console.log(`ETH Balance after swap: ${ethers.formatEther(ethBalanceAfter)}`)
    console.log(
      `${await token.symbol()} Balance after swap: ${ethers.formatUnits(
        tokenBalanceAfter,
        await token.decimals()
      )}`
    )
    console.log(
      `Tokens spent: ${ethers.formatUnits(
        tokenBalanceBefore - tokenBalanceAfter,
        await token.decimals()
      )} ${await token.symbol()}`
    )

    return true
  } catch (error) {
    console.error('Error executing swap:', error)
    return false
  }
}

async function testSwapExactTokensForETHSupportingFeeOnTransferTokens(
  signer: any,
  router: any,
  token: any,
  amountIn: bigint
) {
  console.log('\n=== Testing swapExactTokensForETHSupportingFeeOnTransferTokens ===\n')

  // Approve router to spend tokens
  const approveTx = await token.connect(signer).approve(ROUTER_ADDRESS, amountIn)
  await approveTx.wait()
  console.log('Approved router to spend tokens')

  // Get balances before swap
  const ethBalanceBefore = await signer.provider.getBalance(signer.address)
  const tokenBalanceBefore = await token.balanceOf(signer.address)

  console.log(`ETH Balance before swap: ${ethers.formatEther(ethBalanceBefore)}`)
  console.log(
    `${await token.symbol()} Balance before swap: ${ethers.formatUnits(
      tokenBalanceBefore,
      await token.decimals()
    )}`
  )

  // Execute swap
  const path = [await token.getAddress(), WETH_ADDRESS]
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20 // 20 minutes from now

  try {
    const tx = await router.connect(signer).swapExactTokensForETHSupportingFeeOnTransferTokens(
      amountIn,
      0, // Accept any amount of ETH
      path,
      signer.address,
      deadline
    )

    const receipt = await tx.wait()
    console.log(`Swap executed successfully: ${receipt.hash}`)

    // Get balances after swap
    const ethBalanceAfter = await signer.provider.getBalance(signer.address)
    const tokenBalanceAfter = await token.balanceOf(signer.address)

    console.log(`ETH Balance after swap: ${ethers.formatEther(ethBalanceAfter)}`)
    console.log(
      `${await token.symbol()} Balance after swap: ${ethers.formatUnits(
        tokenBalanceAfter,
        await token.decimals()
      )}`
    )
    console.log(
      `Tokens spent: ${ethers.formatUnits(
        tokenBalanceBefore - tokenBalanceAfter,
        await token.decimals()
      )} ${await token.symbol()}`
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

async function testAddLiquidityETH(
  signer: any,
  router: any,
  token: any,
  amountToken: bigint,
  amountETH: bigint
) {
  console.log('\n=== Testing addLiquidityETH ===\n')

  // Approve router to spend tokens
  const approveTx = await token.connect(signer).approve(ROUTER_ADDRESS, amountToken)
  await approveTx.wait()
  console.log('Approved router to spend tokens')

  // Get balances before adding liquidity
  const ethBalanceBefore = await signer.provider.getBalance(signer.address)
  const tokenBalanceBefore = await token.balanceOf(signer.address)

  console.log(`ETH Balance before adding liquidity: ${ethers.formatEther(ethBalanceBefore)}`)
  console.log(
    `${await token.symbol()} Balance before adding liquidity: ${ethers.formatUnits(
      tokenBalanceBefore,
      await token.decimals()
    )}`
  )

  // Execute addLiquidityETH
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20 // 20 minutes from now

  try {
    const tx = await router.connect(signer).addLiquidityETH(
      await token.getAddress(),
      amountToken,
      0, // Accept any amount of token
      0, // Accept any amount of ETH
      signer.address,
      deadline,
      { value: amountETH }
    )

    const receipt = await tx.wait()
    console.log(`Add liquidity ETH executed successfully: ${receipt.hash}`)

    // Get balances after adding liquidity
    const ethBalanceAfter = await signer.provider.getBalance(signer.address)
    const tokenBalanceAfter = await token.balanceOf(signer.address)

    console.log(`ETH Balance after adding liquidity: ${ethers.formatEther(ethBalanceAfter)}`)
    console.log(
      `${await token.symbol()} Balance after adding liquidity: ${ethers.formatUnits(
        tokenBalanceAfter,
        await token.decimals()
      )}`
    )
    console.log(
      `Tokens deposited: ${ethers.formatUnits(
        tokenBalanceBefore - tokenBalanceAfter,
        await token.decimals()
      )} ${await token.symbol()}`
    )

    return true
  } catch (error) {
    console.error('Error adding liquidity ETH:', error)
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

async function testRemoveLiquidityETH(signer: any, router: any, factory: any, token: any) {
  console.log('\n=== Testing removeLiquidityETH ===\n')

  try {
    // Get the pair address
    const pairAddress = await factory.getPair(await token.getAddress(), WETH_ADDRESS)
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
    const ethBalanceBefore = await signer.provider.getBalance(signer.address)
    const tokenBalanceBefore = await token.balanceOf(signer.address)

    console.log(`ETH Balance before removing liquidity: ${ethers.formatEther(ethBalanceBefore)}`)
    console.log(
      `${await token.symbol()} Balance before removing liquidity: ${ethers.formatUnits(
        tokenBalanceBefore,
        await token.decimals()
      )}`
    )

    // Execute removeLiquidityETH
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20 // 20 minutes from now

    const tx = await router.connect(signer).removeLiquidityETH(
      await token.getAddress(),
      lpBalance,
      0, // Accept any amount of token
      0, // Accept any amount of ETH
      signer.address,
      deadline
    )

    const receipt = await tx.wait()
    console.log(`Remove liquidity ETH executed successfully: ${receipt.hash}`)

    // Get balances after removing liquidity
    const ethBalanceAfter = await signer.provider.getBalance(signer.address)
    const tokenBalanceAfter = await token.balanceOf(signer.address)

    console.log(`ETH Balance after removing liquidity: ${ethers.formatEther(ethBalanceAfter)}`)
    console.log(
      `${await token.symbol()} Balance after removing liquidity: ${ethers.formatUnits(
        tokenBalanceAfter,
        await token.decimals()
      )}`
    )
    console.log(
      `Tokens received: ${ethers.formatUnits(
        tokenBalanceAfter - tokenBalanceBefore,
        await token.decimals()
      )} ${await token.symbol()}`
    )

    return true
  } catch (error) {
    console.error('Error removing liquidity ETH:', error)
    return false
  }
}

async function main() {
  console.log('\n=== UNISWAP V2 TEST SCRIPT - YOUR IMPLEMENTED FUNCTIONS ===\n')

  // Impersonate a whale account
  await helpers.impersonateAccount(WHALE_ADDRESS)
  const impersonatedSigner = await hre.ethers.getSigner(WHALE_ADDRESS)
  console.log(`Impersonated account: ${impersonatedSigner.address}`)

  // Get contract instances
  const router = await hre.ethers.getContractAt('IUniswapV2Router02', ROUTER_ADDRESS)
  const factory = await hre.ethers.getContractAt('IUniswapV2Factory', await router.factory())
  const dai = await hre.ethers.getContractAt('IERC20', DAI_ADDRESS)
  const usdc = await hre.ethers.getContractAt('IERC20', USDC_ADDRESS)

  console.log('Contract instances created')

  // Test results for your implemented functions
  const results = {
    swapExactETHForTokens: false,
    swapETHForExactTokens: false,
    swapExactTokensForETH: false,
    swapTokensForExactETH: false,
    swapExactTokensForETHSupportingFeeOnTransferTokens: false,
    addLiquidity: false,
    addLiquidityETH: false,
    removeLiquidity: false,
    removeLiquidityETH: false,
    removeLiquidityWithPermit: false
  }

  // Test swapExactETHForTokens (ETH -> DAI)
  const amountETH = ethers.parseEther('1') // 1 ETH
  results.swapExactETHForTokens = await testSwapExactETHForTokens(
    impersonatedSigner,
    router,
    dai,
    amountETH
  )

  // Test swapETHForExactTokens (ETH -> DAI)
  const amountDAIOut = ethers.parseUnits('1000', 18) // 1000 DAI
  const amountETHMax = ethers.parseEther('2') // Max 2 ETH
  results.swapETHForExactTokens = await testSwapETHForExactTokens(
    impersonatedSigner,
    router,
    dai,
    amountDAIOut,
    amountETHMax
  )

  // Test swapExactTokensForETH (DAI -> ETH)
  const amountDAIIn = ethers.parseUnits('500', 18) // 500 DAI
  results.swapExactTokensForETH = await testSwapExactTokensForETH(
    impersonatedSigner,
    router,
    dai,
    amountDAIIn
  )

  // Test swapTokensForExactETH (DAI -> ETH)
  const amountETHOut = ethers.parseEther('0.5') // 0.5 ETH
  const amountDAIMax = ethers.parseUnits('2000', 18) // Max 2000 DAI
  results.swapTokensForExactETH = await testSwapTokensForExactETH(
    impersonatedSigner,
    router,
    dai,
    amountETHOut,
    amountDAIMax
  )

  // Test swapExactTokensForETHSupportingFeeOnTransferTokens (DAI -> ETH)
  const amountDAIInFee = ethers.parseUnits('300', 18) // 300 DAI
  results.swapExactTokensForETHSupportingFeeOnTransferTokens =
    await testSwapExactTokensForETHSupportingFeeOnTransferTokens(
      impersonatedSigner,
      router,
      dai,
      amountDAIInFee
    )

  // Test addLiquidity (DAI-USDC)
  const amountDAI = ethers.parseUnits('1000', 18) // 1000 DAI
  const amountUSDC = ethers.parseUnits('1000', 6) // 1000 USDC
  results.addLiquidity = await testAddLiquidity(
    impersonatedSigner,
    router,
    dai,
    usdc,
    amountDAI,
    amountUSDC
  )

  // Test addLiquidityETH (DAI-ETH)
  const amountDAIForETH = ethers.parseUnits('2000', 18) // 2000 DAI
  const amountETHForLiquidity = ethers.parseEther('1') // 1 ETH
  results.addLiquidityETH = await testAddLiquidityETH(
    impersonatedSigner,
    router,
    dai,
    amountDAIForETH,
    amountETHForLiquidity
  )

  // Test removeLiquidity (DAI-USDC)
  results.removeLiquidity = await testRemoveLiquidity(
    impersonatedSigner,
    router,
    factory,
    dai,
    usdc
  )

  // Test removeLiquidityETH (DAI-ETH)
  results.removeLiquidityETH = await testRemoveLiquidityETH(
    impersonatedSigner,
    router,
    factory,
    dai
  )

  // Note: removeLiquidityWithPermit requires permit signature - skipping for now
  console.log('\n⚠️  Skipping removeLiquidityWithPermit (requires permit signature implementation)')
  results.removeLiquidityWithPermit = false

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
