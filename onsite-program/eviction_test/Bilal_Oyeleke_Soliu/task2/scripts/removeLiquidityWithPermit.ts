import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-network-helpers");

// Common constants
const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const DAI_ADDRESS = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const WHALE_ADDRESS = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621"; // Known USDC/DAI whale
const ETH_WHALE_ADDRESS = "0x2fEb1512183545f48f6b9C5b4EbfCaF49CfCa6F3"; // Known ETH whale
const ROUTER_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
const POOL_ADDRESS = "0xAE461cA67B15dc8dc81CE7615e0320dA1A9aB8D5";
const ETH_POOL_ADDRESS = "0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc"; // USDC-ETH pool

async function main() {
  // Use a local Hardhat account for signing
  const [localSigner] = await ethers.getSigners();
  console.log("Local Signer Address:", localSigner.address);

  // Impersonate the whale account to transfer funds
  await helpers.impersonateAccount(WHALE_ADDRESS);
  await helpers.setBalance(WHALE_ADDRESS, ethers.parseEther("10"));
  const whaleSigner = await ethers.provider.getSigner(WHALE_ADDRESS);

  // Get contracts
  const usdcContract = await ethers.getContractAt("IERC20", USDC_ADDRESS);
  const daiContract = await ethers.getContractAt("IERC20", DAI_ADDRESS);
  const wethContract = await ethers.getContractAt("IERC20", WETH_ADDRESS);
  const routerContract = await ethers.getContractAt("IUniswapV2Router02", ROUTER_ADDRESS);
  const poolContract = await ethers.getContractAt("IERC20Permit", POOL_ADDRESS);
  const ethPoolContract = await ethers.getContractAt("IERC20Permit", ETH_POOL_ADDRESS);
  const factoryContract = await ethers.getContractAt("IUniswapV2Factory", "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f");

  // Connect contracts to local signer for transactions
  const usdc = usdcContract.connect(localSigner);
  const dai = daiContract.connect(localSigner);
  const weth = wethContract.connect(localSigner);
  const router = routerContract.connect(localSigner);
  const pool = poolContract.connect(localSigner);
  const ethPool = ethPoolContract.connect(localSigner);

  // Check whale balances
  const whaleUsdcBalance = await usdcContract.balanceOf(WHALE_ADDRESS);
  const whaleDaiBalance = await daiContract.balanceOf(WHALE_ADDRESS);
  console.log("Whale USDC Balance:", ethers.formatUnits(whaleUsdcBalance, 6));
  console.log("Whale DAI Balance:", ethers.formatUnits(whaleDaiBalance, 18));

  // Transfer USDC and DAI from whale to local signer
  const usdcAmount = ethers.parseUnits("1000", 6);
  const daiAmount = ethers.parseUnits("1000", 18);
  if (whaleUsdcBalance < usdcAmount || whaleDaiBalance < daiAmount) {
    console.error("Whale has insufficient USDC or DAI balance");
    return;
  }
  await usdcContract.connect(whaleSigner).transfer(localSigner.address, usdcAmount);
  await daiContract.connect(whaleSigner).transfer(localSigner.address, daiAmount);
  console.log("Transferred USDC and DAI to local signer");

  // Add liquidity to ensure the local signer has LP tokens
  const deadline = (await helpers.time.latest()) + 300;
  await usdc.approve(ROUTER_ADDRESS, usdcAmount);
  await dai.approve(ROUTER_ADDRESS, daiAmount);

  // Verify token order for the USDC-DAI pair
  const token0 = await factoryContract.getPair(USDC_ADDRESS, DAI_ADDRESS);
  console.log("Pair Address:", token0);
  const isUsdcFirst = token0.toLowerCase() === POOL_ADDRESS.toLowerCase();
  console.log("Token Order (USDC, DAI):", isUsdcFirst);

  await router.addLiquidity(
    isUsdcFirst ? USDC_ADDRESS : DAI_ADDRESS,
    isUsdcFirst ? DAI_ADDRESS : USDC_ADDRESS,
    isUsdcFirst ? usdcAmount : daiAmount,
    isUsdcFirst ? daiAmount : usdcAmount,
    ethers.parseUnits("900", 6),
    ethers.parseUnits("900", 18),
    localSigner.address,
    deadline
  );
  console.log("Liquidity added successfully");

  // =============================================
  // Add ETH liquidity section
  // =============================================
  console.log("\nPreparing ETH liquidity...");
  
  // Impersonate ETH whale and transfer WETH to local signer
  await helpers.impersonateAccount(ETH_WHALE_ADDRESS);
  await helpers.setBalance(ETH_WHALE_ADDRESS, ethers.parseEther("10"));
  const ethWhaleSigner = await ethers.provider.getSigner(ETH_WHALE_ADDRESS);
  
  const ethAmount = ethers.parseEther("1");
  const wethAmount = ethAmount;
  
  // Transfer WETH from whale to local signer
  await wethContract.connect(ethWhaleSigner).transfer(localSigner.address, wethAmount);
  console.log("Transferred WETH to local signer");
  
  // Add ETH liquidity (USDC-ETH pair)
  const ethUsdcAmount = ethers.parseUnits("1000", 6);
  await usdc.approve(ROUTER_ADDRESS, ethUsdcAmount);
  await weth.approve(ROUTER_ADDRESS, wethAmount);
  
  // Verify token order for the USDC-ETH pair
  const ethToken0 = await factoryContract.getPair(USDC_ADDRESS, WETH_ADDRESS);
  console.log("ETH Pair Address:", ethToken0);
  const isUsdcFirstEth = ethToken0.toLowerCase() === ETH_POOL_ADDRESS.toLowerCase();
  console.log("Token Order (USDC, WETH):", isUsdcFirstEth);
  
  await router.addLiquidity(
    USDC_ADDRESS,
    WETH_ADDRESS,
    ethUsdcAmount,
    wethAmount,
    ethers.parseUnits("900", 6),
    ethers.parseEther("0.9"),
    localSigner.address,
    deadline
  );
  console.log("ETH Liquidity added successfully");
  
  // =============================================
  // Print balances before any removals
  // =============================================
  console.log("\nBalances before any removals:");
  const usdcBalance = await usdc.balanceOf(localSigner.address);
  const daiBalance = await dai.balanceOf(localSigner.address);
  const wethBalance = await weth.balanceOf(localSigner.address);
  const poolBalance = await pool.balanceOf(localSigner.address);
  const ethPoolBalance = await ethPool.balanceOf(localSigner.address);
  const ethBalance = await ethers.provider.getBalance(localSigner.address);
  
  console.log("USDC Balance:", ethers.formatUnits(usdcBalance, 6));
  console.log("DAI Balance:", ethers.formatUnits(daiBalance, 18));
  console.log("WETH Balance:", ethers.formatUnits(wethBalance, 18));
  console.log("ETH Balance:", ethers.formatUnits(ethBalance, 18));
  console.log("USDC-DAI Pool Balance:", ethers.formatUnits(poolBalance, 18));
  console.log("USDC-ETH Pool Balance:", ethers.formatUnits(ethPoolBalance, 18));

  // =============================================
  // Remove USDC-DAI liquidity with permit (original flow)
  // =============================================
  console.log("\nRemoving USDC-DAI liquidity with permit...");
  
  const liquidity = await pool.balanceOf(localSigner.address);
  if (liquidity === 0n) {
    console.error("No USDC-DAI LP tokens available for local signer");
  } else {
    const usdcMin = ethers.parseUnits("900", 6);
    const daiMin = ethers.parseUnits("900", 18);
    const permitDeadline = (await helpers.time.latest()) + 300;

    const nonce = await pool.nonces(localSigner.address);
    const domain = {
      name: await pool.name(),
      version: "1",
      chainId: 1, // Hardcode to mainnet chain ID for fork
      verifyingContract: POOL_ADDRESS,
    };

    const types = {
      Permit: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
        { name: "value", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    };

    const values = {
      owner: localSigner.address,
      spender: ROUTER_ADDRESS,
      value: liquidity,
      nonce: nonce,
      deadline: permitDeadline,
    };

    console.log("Permit Parameters:", { domain, types, values });
    console.log("Signing permit...");
    const signature = await localSigner.signTypedData(domain, types, values);
    const { v, r, s } = ethers.Signature.from(signature);
    console.log("Signature:", { v, r, s });

    // Remove liquidity with permit
    console.log("Removing liquidity with permit...");
    const removeLiquidity = await router.removeLiquidityWithPermit(
      isUsdcFirst ? USDC_ADDRESS : DAI_ADDRESS,
      isUsdcFirst ? DAI_ADDRESS : USDC_ADDRESS,
      liquidity,
      isUsdcFirst ? usdcMin : daiMin,
      isUsdcFirst ? daiMin : usdcMin,
      localSigner.address,
      permitDeadline,
      false,
      v,
      r,
      s
    );
    await removeLiquidity.wait();
    console.log("USDC-DAI Remove liquidity successful");
  }

  // =============================================
  // Remove ETH liquidity with permit (new implementation)
  // =============================================
  console.log("\nRemoving USDC-ETH liquidity with permit...");
  
  const ethLiquidity = await ethPool.balanceOf(localSigner.address);
  if (ethLiquidity === 0n) {
    console.error("No USDC-ETH LP tokens available for local signer");
  } else {
    const ethUsdcMin = ethers.parseUnits("900", 6);
    const ethMin = ethers.parseEther("0.9");
    const ethPermitDeadline = (await helpers.time.latest()) + 300;

    const ethNonce = await ethPool.nonces(localSigner.address);
    const ethDomain = {
      name: await ethPool.name(),
      version: "1",
      chainId: 1, // Hardcode to mainnet chain ID for fork
      verifyingContract: ETH_POOL_ADDRESS,
    };

    const ethTypes = {
      Permit: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
        { name: "value", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    };

    const ethValues = {
      owner: localSigner.address,
      spender: ROUTER_ADDRESS,
      value: ethLiquidity,
      nonce: ethNonce,
      deadline: ethPermitDeadline,
    };

    console.log("ETH Permit Parameters:", { domain: ethDomain, types: ethTypes, values: ethValues });
    console.log("Signing ETH permit...");
    const ethSignature = await localSigner.signTypedData(ethDomain, ethTypes, ethValues);
    const { v: ethV, r: ethR, s: ethS } = ethers.Signature.from(ethSignature);
    console.log("ETH Signature:", { v: ethV, r: ethR, s: ethS });

    // Remove ETH liquidity with permit
    console.log("Removing ETH liquidity with permit...");
    const removeEthLiquidity = await router.removeLiquidityETHWithPermit(
      USDC_ADDRESS, // token (USDC in this case)
      ethLiquidity,
      ethUsdcMin, // USDC minimum
      ethMin, // ETH minimum
      localSigner.address,
      ethPermitDeadline,
      false, // approve max
      ethV,
      ethR,
      ethS
    );
    await removeEthLiquidity.wait();
    console.log("USDC-ETH Remove liquidity successful");
  }

  // =============================================
  // Print final balances
  // =============================================
  console.log("\nFinal balances:");
  const newUsdcBalance = await usdc.balanceOf(localSigner.address);
  const newDaiBalance = await dai.balanceOf(localSigner.address);
  const newWethBalance = await weth.balanceOf(localSigner.address);
  const newPoolBalance = await pool.balanceOf(localSigner.address);
  const newEthPoolBalance = await ethPool.balanceOf(localSigner.address);
  const newEthBalance = await ethers.provider.getBalance(localSigner.address);
  
  console.log("USDC Balance:", ethers.formatUnits(newUsdcBalance, 6));
  console.log("DAI Balance:", ethers.formatUnits(newDaiBalance, 18));
  console.log("WETH Balance:", ethers.formatUnits(newWethBalance, 18));
  console.log("ETH Balance:", ethers.formatUnits(newEthBalance, 18));
  console.log("USDC-DAI Pool Balance:", ethers.formatUnits(newPoolBalance, 18));
  console.log("USDC-ETH Pool Balance:", ethers.formatUnits(newEthPoolBalance, 18));
}

main().catch((error) => {
  console.error("Error:", error);
  process.exitCode = 1;
});