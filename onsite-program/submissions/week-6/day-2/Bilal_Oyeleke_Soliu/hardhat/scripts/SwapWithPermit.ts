import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-network-helpers");

async function main() {
  const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const DAI  = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  const UNISWAP_V3_ROUTER = "0xE592427A0AEce92De3Edee1F18E0157C05861564";
  const assetHolder = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";
  const amountIn = ethers.parseUnits("1000", 6);
  const feeTier = 500;
  const sqrtPriceLimitX96 = 0;
  const amountOutMinimum = 0;

  await helpers.impersonateAccount(assetHolder);
  await helpers.setBalance(assetHolder, ethers.parseEther("10"));
  const signer = await ethers.getSigner(assetHolder);

  const PermitAndSwapFactory = await ethers.getContractFactory("PermitAndSwapV3");
  const permitAndSwap = await PermitAndSwapFactory.connect(signer).deploy(UNISWAP_V3_ROUTER);
  await permitAndSwap.waitForDeployment();
  console.log("PermitAndSwapV3 deployed at:", permitAndSwap.target);

  const usdcPermit = await ethers.getContractAt("IERC20Permit", USDC, signer);
  const usdc = await ethers.getContractAt("IERC20", USDC, signer);
  const dai = await ethers.getContractAt("IERC20", DAI, signer);

  const usdcBefore = await usdc.balanceOf(assetHolder);
  const daiBefore = await dai.balanceOf(assetHolder);
  console.log("USDC before:", ethers.formatUnits(usdcBefore, 6));
  console.log("DAI before:", ethers.formatUnits(daiBefore, 18));

  const chainId = (await signer.provider.getNetwork()).chainId;
  const nonce = await usdcPermit.nonces(assetHolder);
  const now = await helpers.time.latest();
  const permitDeadline = now + 600;
  const swapDeadline = now + 600;

  const domain = {
    name: "USD Coin",
    version: "2",
    chainId: chainId,
    verifyingContract: USDC
};

  const types = {
    Permit: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" }
    ]
  };

  const message = {
    owner: assetHolder,
    spender: permitAndSwap.target,
    value: amountIn,
    nonce: nonce,
    deadline: permitDeadline
  };

  const signature = await signer.signTypedData(domain, types, message);
  const { v, r, s } = ethers.Signature.from(signature);

  console.log("Signed permit:", { v, r: r.slice(0,10) + "...", s: s.slice(0,10) + "..." });

  const params = {
    tokenIn: USDC,
    tokenOut: DAI,
    fee: feeTier,
    recipient: assetHolder,
    deadline: swapDeadline,
    amountIn: amountIn,
    amountOutMinimum: amountOutMinimum,
    sqrtPriceLimitX96: sqrtPriceLimitX96
  };

  const tx = await permitAndSwap.connect(signer).permitAndSwapSingle(
    USDC,
    assetHolder,
    amountIn,
    permitDeadline,
    v, r, s,
    params
  );

  const receipt = await tx.wait();
  console.log("Transaction hash:", receipt.transactionHash);

  const usdcAfter = await usdc.balanceOf(assetHolder);
  const daiAfter = await dai.balanceOf(assetHolder);
  console.log("USDC after:", ethers.formatUnits(usdcAfter, 6));
  console.log("DAI after:", ethers.formatUnits(daiAfter, 18));

  if (daiAfter.gt(daiBefore)) {
    console.log("✅ Swap succeeded and DAI received");
  } else {
    console.log("❌ Swap failed or zero DAI received");
  }

  const permitAndSwapEvents = receipt.logs
    .map((log) => {
      try {
        return permitAndSwap.interface.parseLog(log);
      } catch (e) { return null; }
    })
    .filter(Boolean);
  console.log("PermitAndSwap events parsed:", permitAndSwapEvents.length);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
