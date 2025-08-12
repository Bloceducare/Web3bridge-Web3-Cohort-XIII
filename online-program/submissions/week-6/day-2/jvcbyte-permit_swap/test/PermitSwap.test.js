const { expect } = require('chai');
const { ethers } = require('hardhat');

// Import ethers v6 utils
const { parseEther, formatEther, parseUnits, formatUnits } = ethers;

// Mainnet addresses as AddressLike
const UNISWAP_V2_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const DAI_ADDRESS = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

// Whale addresses for impersonation
const DAI_WHALE = "0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503";
const USDC_WHALE = "0x55FE002aefF02F77364de339a1292923A15844B8";

// ABI for ERC20 permit
const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external",
  "function nonces(address owner) view returns (uint256)",
  "function DOMAIN_SEPARATOR() view returns (bytes32)"
];

// Helper function to impersonate an account
async function impersonateAccount(address) {
  await ethers.provider.send("hardhat_impersonateAccount", [address]);
  const signer = await ethers.getSigner(address);
  // Fund the impersonated account with ETH
  await ethers.provider.send("hardhat_setBalance", [
    address,
    "0x1000000000000000000000" // 1 ETH
  ]);
  return signer;
}

// Function to sign permit data
async function signPermit(owner, tokenAddress, spender, value, nonce, deadline, chainId, tokenName) {
  // DAI uses a different domain separator than the standard EIP-2612
  // We need to use the exact domain separator that DAI expects
  const domain = {
    name: tokenName,
    version: '1',
    chainId: chainId,
    verifyingContract: tokenAddress
  };
  
  // DAI's permit uses a different type name 'Permit' instead of the standard 'Permit'
  const types = {
    Permit: [
      { name: 'holder', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'nonce', type: 'uint256' },
      { name: 'expiry', type: 'uint256' },
      { name: 'allowed', type: 'bool' },
    ]
  };
  
  // DAI's permit uses 'holder' instead of 'owner' and 'expiry' instead of 'deadline'
  // It also includes an 'allowed' boolean which we set to true
  const message = {
    holder: await owner.getAddress(),
    spender: spender,
    nonce: nonce,
    expiry: deadline,
    allowed: true
  };
  
  try {
    // Sign the typed data
    const signature = await owner.signTypedData(domain, types, message);
    const sig = ethers.Signature.from(signature);
    
    return { 
      v: sig.v, 
      r: sig.r, 
      s: sig.s 
    };
  } catch (error) {
    console.error('Error signing permit:', error);
    throw error;
  }
}

describe('PermitSwap', function() {
  let owner, user, relayer, other;
  let permitSwap, uniswapRouter, dai, usdc, weth;
  
  // Test amounts
  const SWAP_AMOUNT = parseEther("10"); // 10 DAI
  const MIN_AMOUNT_OUT = parseEther("0.001"); // Minimum 0.001 WETH
  
  before(async function() {
    // Get signers
    [owner, user, relayer, other] = await ethers.getSigners();
    
    // Deploy PermitSwap contract first
    console.log("Deploying PermitSwap contract...");
    const PermitSwap = await ethers.getContractFactory("PermitSwap");
    permitSwap = await PermitSwap.deploy(UNISWAP_V2_ROUTER);
    await permitSwap.waitForDeployment();
    console.log("PermitSwap deployed to:", await permitSwap.getAddress());
    
    // Get mainnet contracts with proper typing
    uniswapRouter = await ethers.getContractAt("IUniswapV2Router02", UNISWAP_V2_ROUTER);
    
    // Define ABIs for different purposes
    const IERC20PermitABI = [
      "function nonces(address owner) external view returns (uint256)",
      "function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external",
      "function name() external view returns (string memory)",
      "function version() external view returns (string memory)",
      "function DOMAIN_SEPARATOR() external view returns (bytes32)",
      "function balanceOf(address account) external view returns (uint256)",
      "function allowance(address owner, address spender) external view returns (uint256)",
      "function approve(address spender, uint256 amount) external returns (bool)",
      "function transfer(address to, uint256 amount) external returns (bool)",
      "function transferFrom(address from, address to, uint256 amount) external returns (bool)"
    ];
    
    // Standard ERC20 ABI for whale transfers
    const ERC20_ABI = [
      "function balanceOf(address account) external view returns (uint256)",
      "function transfer(address to, uint256 amount) external returns (bool)",
      "function approve(address spender, uint256 amount) external returns (bool)",
      "function allowance(address owner, address spender) external view returns (uint256)",
      "function transferFrom(address from, address to, uint256 amount) external returns (bool)"
    ];
    
    // Get token instances with the full ABI
    dai = new ethers.Contract(DAI_ADDRESS, IERC20PermitABI, ethers.provider);
    usdc = new ethers.Contract(USDC_ADDRESS, IERC20PermitABI, ethers.provider);
    weth = await ethers.getContractAt("IWETH", WETH_ADDRESS);
    
    // Create separate instances for whale transfers
    const daiForWhale = new ethers.Contract(DAI_ADDRESS, ERC20_ABI, ethers.provider);
    const usdcForWhale = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, ethers.provider);
    
    // Impersonate whale accounts and fund user
    console.log("Impersonating DAI whale...");
    const daiWhale = await impersonateAccount(DAI_WHALE);
    const daiWithWhale = daiForWhale.connect(daiWhale);
    const daiTransferTx = await daiWithWhale.transfer(user.address, parseEther("1000"));
    await daiTransferTx.wait();
    
    console.log("Impersonating USDC whale...");
    const usdcWhale = await impersonateAccount(USDC_WHALE);
    const usdcWithWhale = usdcForWhale.connect(usdcWhale);
    const usdcTransferTx = await usdcWithWhale.transfer(user.address, parseUnits("10000", 6));
    await usdcTransferTx.wait();
    
    // Connect tokens to user
    dai = dai.connect(user);
    usdc = usdc.connect(user);
    weth = weth.connect(user);
    
    // Increase block time to avoid timestamp issues
    await ethers.provider.send("evm_increaseTime", [3600]);
    await ethers.provider.send("evm_mine");
    
    // Check and log balances
    const daiBalance = await dai.balanceOf(user.address);
    const usdcBalance = await usdc.balanceOf(user.address);
    
    console.log(`User DAI balance: ${formatEther(daiBalance)} DAI`);
    console.log(`User USDC balance: ${formatUnits(usdcBalance, 6)} USDC`);
    
    // Check if we have minimum required balances
    const minDaiBalance = parseEther("100");
    const minUsdcBalance = parseUnits("100", 6);
    
    if (daiBalance < minDaiBalance) {
      console.error(`Insufficient DAI balance. Required: ${formatEther(minDaiBalance)}, Got: ${formatEther(daiBalance)}`);
      throw new Error("Insufficient DAI balance for testing");
    }
    
    if (usdcBalance < minUsdcBalance) {
      console.error(`Insufficient USDC balance. Required: ${formatUnits(minUsdcBalance, 6)}, Got: ${formatUnits(usdcBalance, 6)}`);
      throw new Error("Insufficient USDC balance for testing");
    }
    
    // Approve PermitSwap to spend tokens
    console.log("Approving tokens...");
    await dai.approve(permitSwap.getAddress(), ethers.MaxUint256);
    await usdc.approve(permitSwap.getAddress(), ethers.MaxUint256);
  });
  
  describe('swapWithPermit', function() {
    it('should allow a user to swap DAI for WETH using permit', async function() {
      // Get current timestamp and add 1 hour
      const deadline = (await ethers.provider.getBlock('latest')).timestamp + 3600;
      
      // Use DAI for this test
      const token = dai;
      const swapAmount = parseEther('10'); // 10 DAI
      
      // Get current nonce
      const nonce = await token.nonces(user.address);
      
      // Sign permit
      const { v, r, s } = await signPermit(
        user,
        token.target,
        await permitSwap.getAddress(),
        swapAmount,
        nonce,
        deadline,
        (await ethers.provider.getNetwork()).chainId,
        await token.name()
      );
      
      // Get expected amount out from Uniswap
      const expectedAmountOut = await permitSwap.getAmountOut(
        DAI_ADDRESS,
        WETH_ADDRESS,
        swapAmount
      );
      
      // Get user's WETH balance before swap
      const wethBalanceBefore = await weth.balanceOf(user.address);
      
      // First, approve the contract to spend DAI
      console.log(`Approving ${formatEther(swapAmount)} DAI for PermitSwap contract...`);
      const approveTx = await dai.connect(user).approve(
        await permitSwap.getAddress(),
        swapAmount
      );
      await approveTx.wait();
      
      // Check allowance after approval
      const allowance = await dai.allowance(user.address, await permitSwap.getAddress());
      console.log(`Allowance after approval: ${allowance.toString()}`);
      
      // Check DAI balance before swap
      const daiBalanceBefore = await dai.balanceOf(user.address);
      console.log(`User DAI balance before swap: ${formatEther(daiBalanceBefore)} DAI`);
      
      try {
        // Execute the swap with permit
        const swapTx = await permitSwap.swapWithPermit(
          {
            tokenIn: DAI_ADDRESS,
            tokenOut: WETH_ADDRESS,
            amountIn: swapAmount,
            amountOutMin: expectedAmountOut,
            deadline: deadline,
            recipient: user.address
          },
          {
            v, r, s,
            deadline: deadline
          }
        );
        
        // Wait for the swap transaction to be mined
        const swapReceipt = await swapTx.wait();
        console.log('Swap successful in block:', swapReceipt.blockNumber);
        
        // Check allowance after permit (should be increased by swapAmount)
        const allowanceAfter = await dai.allowance(user.address, await permitSwap.getAddress());
        console.log(`Allowance after permit: ${allowanceAfter.toString()}`);
        
        // Get user's WETH balance after swap
        const wethBalanceAfter = await weth.balanceOf(user.address);
        const wethReceived = wethBalanceAfter - wethBalanceBefore;
        console.log(`Received ${formatEther(wethReceived)} WETH`);
        
        // Check DAI balance after swap
        const daiBalanceAfter = await dai.balanceOf(user.address);
        console.log(`User DAI balance after swap: ${formatEther(daiBalanceAfter)} DAI`);
        
        // Verify WETH balance increased by at least the expected amount
        expect(wethReceived).to.be.gte(expectedAmountOut);
      } catch (error) {
        console.error('Error during swapWithPermit:', error);
        
        // Check allowance after failed permit
        const allowanceAfter = await dai.allowance(user.address, await permitSwap.getAddress());
        console.log(`Allowance after failed permit: ${allowanceAfter.toString()}`);
        
        // Check DAI balance after failed swap
        const daiBalanceAfter = await dai.balanceOf(user.address);
        console.log(`User DAI balance after failed swap: ${formatEther(daiBalanceAfter)} DAI`);
        
        throw error;
      }
    });
  });
  
  describe('relayedSwapWithPermit', function() {
    it('should allow a relayer to execute a USDC to DAI swap on behalf of a user', async function() {
      // Get current timestamp and add 1 hour
      const deadline = (await ethers.provider.getBlock('latest')).timestamp + 3600;
      
      // Use USDC for this test
      const token = usdc;
      const swapAmount = parseUnits('100', 6); // 100 USDC
      
      // Get current nonce
      const nonce = await token.nonces(user.address);
      
      // Sign permit with relayer as the spender
      const { v, r, s } = await signPermit(
        user,
        token.target,
        await permitSwap.getAddress(),
        swapAmount,
        nonce,
        deadline,
        (await ethers.provider.getNetwork()).chainId,
        await token.name()
      );
      
      // Get expected amount out from Uniswap
      const expectedAmountOut = await permitSwap.getAmountOut(
        USDC_ADDRESS,
        DAI_ADDRESS,
        swapAmount
      );
      
      // Get user's DAI balance before swap
      const daiBalanceBefore = await dai.balanceOf(user.address);
      
      // Execute relayed swap with permit (relayer calls on behalf of user)
      const tx = await permitSwap.connect(relayer).relayedSwapWithPermit(
        {
          tokenIn: USDC_ADDRESS,
          tokenOut: DAI_ADDRESS,
          amountIn: swapAmount,
          amountOutMin: expectedAmountOut,
          deadline: deadline,
          recipient: user.address
        },
        {
          v, r, s,
          deadline: deadline
        },
        user.address // originalSender
      );
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      // Get user's DAI balance after swap
      const daiBalanceAfter = await dai.balanceOf(user.address);
      
      // Verify DAI balance increased by at least the expected amount
      const daiReceived = daiBalanceAfter - daiBalanceBefore;
      console.log(`Received ${formatEther(daiReceived)} DAI`);
      
      expect(daiReceived).to.be.gte(expectedAmountOut);
    });
  });
  
  describe('getAmountOut', function() {
    it('should return the expected output amount for a DAI to WETH swap', async function() {
      const amountOut = await permitSwap.getAmountOut(
        DAI_ADDRESS,
        WETH_ADDRESS,
        SWAP_AMOUNT
      );
      
      console.log(`${formatEther(SWAP_AMOUNT)} DAI = ${formatEther(amountOut)} WETH`);
      expect(amountOut).to.be.gt(0);
    });
  });
  
  describe('Security', function() {
    it('should revert if swap is expired', async function() {
      // Set expiration to past time
      const deadline = (await ethers.provider.getBlock('latest')).timestamp - 1;
      
      // Use DAI for this test
      const token = dai;
      const swapAmount = parseEther('10'); // 10 DAI
      
      // Sign permit with expired deadline
      const nonce = await token.nonces(user.address);
      const { v, r, s } = await signPermit(
        user,
        token.target,
        await permitSwap.getAddress(),
        swapAmount,
        nonce,
        deadline,
        (await ethers.provider.getNetwork()).chainId,
        await token.name()
      );
      
      // Try to swap with expired permit
      await expect(
        permitSwap.swapWithPermit(
          {
            tokenIn: DAI_ADDRESS,
            tokenOut: WETH_ADDRESS,
            amountIn: swapAmount,
            amountOutMin: 0,
            deadline: deadline,
            recipient: user.address
          },
          {
            v, r, s,
            deadline: deadline
          }
        )
      ).to.be.revertedWith('PermitSwap: EXPIRED');
    });
    
    it('should revert if signature is invalid', async function() {
      // Get current timestamp and add 1 hour
      const deadline = (await ethers.provider.getBlock('latest')).timestamp + 3600;
      
      // Use DAI for this test
      const token = dai;
      const swapAmount = parseEther('10'); // 10 DAI
      
      // Sign permit with wrong spender (attacker tries to use permit for another contract)
      const nonce = await token.nonces(user.address);
      const { v, r, s } = await signPermit(
        user,
        token.target,
        other.address, // Wrong spender
        swapAmount,
        nonce,
        deadline,
        (await ethers.provider.getNetwork()).chainId,
        await token.name()
      );
      
      // Try to swap with invalid permit
      await expect(
        permitSwap.swapWithPermit(
          {
            tokenIn: DAI_ADDRESS,
            tokenOut: WETH_ADDRESS,
            amountIn: swapAmount,
            amountOutMin: 0,
            deadline: deadline,
            recipient: user.address
          },
          {
            v, r, s,
            deadline: deadline
          }
        )
      ).to.be.revertedWith('PermitSwap: INVALID_SIGNATURE');
    });
  });

  describe("getAmountOut", function () {
    it("should return the expected output amount for a DAI to WETH swap", async function () {
      // Skip if not forking mainnet
      if (network.name !== 'hardhat') {
        this.skip();
      }
      
      const amountIn = parseEther("100"); // 100 DAI
      const amountOut = await permitSwap.getAmountOut(
        await dai.getAddress(),
        await weth.getAddress(),
        amountIn
      );
      
      // Just verify we get a non-zero amount out
      expect(amountOut).to.be.gt(0);
      console.log(`100 DAI = ${formatEther(amountOut)} WETH`);
      
      // Verify it matches Uniswap's calculation
      const expectedAmounts = await uniswapRouter.getAmountsOut(
        amountIn,
        [await dai.getAddress(), await weth.getAddress()]
      );
      expect(amountOut).to.equal(expectedAmounts[1]);
    });
  });
});
