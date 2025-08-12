import { ethers, run } from "hardhat";
import { impersonateAccount } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import * as fs from "fs";
import * as pathLib from "path";

const PERMIT_SWAP_HELPER_SOURCE = `
  // SPDX-License-Identifier: MIT
  pragma solidity ^0.8.28;

  import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

  interface IERC20Permit {
      function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external;
      function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
      function approve(address spender, uint256 amount) external returns (bool);
  }

  interface IUniswapV2Router02 {
      function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] calldata path, address to, uint256 deadline) external returns (uint256[] memory amounts);
  }

  contract PermitSwapHelper is ReentrancyGuard {
      event PermitAndSwapExecuted(address indexed owner, address token, uint256 amountIn, address[] path);
      function permitAndSwap(address owner, address token, address router, uint256 amountIn, uint256 amountOutMin, address[] calldata path, address to, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external nonReentrant returns (uint256[] memory amounts) {
          require(deadline >= block.timestamp, "Deadline expired");
          IERC20Permit(token).permit(owner, address(this), amountIn, deadline, v, r, s);
          require(IERC20Permit(token).transferFrom(owner, address(this), amountIn), "TransferFrom failed");
          require(IERC20Permit(token).approve(router, amountIn), "Approve failed");
          amounts = IUniswapV2Router02(router).swapExactTokensForTokens(amountIn, amountOutMin, path, to, deadline);
          emit PermitAndSwapExecuted(owner, token, amountIn, path);
          return amounts;
      }
  }
`;

const EIP712Domain = [
  { name: "name", type: "string" },
  { name: "version", type: "string" },
  { name: "chainId", type: "uint256" },
  { name: "verifyingContract", type: "address" },
];

const Permit = [
  { name: "owner", type: "address" },
  { name: "spender", type: "address" },
  { name: "value", type: "uint256" },
  { name: "nonce", type: "uint256" },
  { name: "deadline", type: "uint256" },
];

async function main() {
  const DAI_ADDRESS = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const ROUTER_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
  const WHALE_ADDRESS = "0xf584F8728B874a6a5c7A8d4d387C9aae9172D621";

  const [defaultSigner] = await ethers.getSigners();
  const EXECUTOR_ADDRESS = defaultSigner.address;

  await ethers.provider.send("hardhat_setBalance", [EXECUTOR_ADDRESS, ethers.toBeHex(ethers.parseEther("1.0"))]);

  await impersonateAccount(WHALE_ADDRESS);
  const whaleSigner = await ethers.getSigner(WHALE_ADDRESS);

  const dai = await ethers.getContractAt(
    ["function balanceOf(address) view returns (uint256)", "function transfer(address, uint256) returns (bool)"],
    DAI_ADDRESS,
    whaleSigner
  );

  const amountIn = ethers.parseUnits("100", 18);
  console.log(`Transferring ${ethers.formatUnits(amountIn, 18)} DAI from whale to executor...`);
  await dai.transfer(EXECUTOR_ADDRESS, amountIn);
  console.log("DAI transferred");

  const tempDir = pathLib.join(__dirname, "temp");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
  const contractPath = pathLib.join(tempDir, "PermitSwapHelper.sol");
  fs.writeFileSync(contractPath, PERMIT_SWAP_HELPER_SOURCE);

  console.log("Compiling PermitSwapHelper...");
  await run("compile");

  console.log("Deploying PermitSwapHelper...");
  const factory = await ethers.getContractFactory("PermitSwapHelper");
  const helper = await factory.connect(defaultSigner).deploy();
  await helper.waitForDeployment();
  const HELPER_ADDRESS = await helper.getAddress();
  console.log("PermitSwapHelper deployed to:", HELPER_ADDRESS);

  fs.unlinkSync(contractPath);
  if (fs.readdirSync(tempDir).length === 0) fs.rmdirSync(tempDir);

  const daiExecutor = await ethers.getContractAt(
    [
      "function balanceOf(address) view returns (uint256)",
      "function name() view returns (string)",
      "function nonces(address) view returns (uint256)",
      "function permit(address, address, uint256, uint256, uint8, bytes32, bytes32)",
    ],
    DAI_ADDRESS,
    defaultSigner
  );

  const amountOutMin = ethers.parseUnits("99", 6);
  const path = [DAI_ADDRESS, USDC_ADDRESS];
  const to = EXECUTOR_ADDRESS;
  const deadline = Math.floor(Date.now() / 1000) + 60 * 30;

  const daiBalance = await daiExecutor.balanceOf(EXECUTOR_ADDRESS);
  console.log("Executor DAI Balance:", ethers.formatUnits(daiBalance, 18));
  if (daiBalance < amountIn) throw new Error("Insufficient DAI balance");

  const domain = {
    name: await daiExecutor.name(),
    version: "1",
    chainId: 1,
    verifyingContract: DAI_ADDRESS,
  };
  console.log("EIP-712 Domain:", domain);

  const nonce = await daiExecutor.nonces(EXECUTOR_ADDRESS);
  console.log("Nonce:", nonce.toString());
  if (nonce > 0) throw new Error("Nonce is non-zero, please reset fork by running: rm -rf artifacts cache && npx hardhat node --fork https://eth-mainnet.g.alchemy.com/v2/9M_9XNxpBEgAX7by9gv-11GwHzNVL4Sz");

  const message = {
    owner: EXECUTOR_ADDRESS,
    spender: HELPER_ADDRESS,
    value: amountIn,
    nonce,
    deadline,
  };
  console.log("EIP-712 Message:", message);
  console.log("Signing EIP-712 permit...");
  const signature = await defaultSigner.signTypedData(domain, { Permit }, message);
  const { v, r, s } = ethers.Signature.from(signature);
  console.log("Signature:", { v, r, s });

  const helperContract = await ethers.getContractAt("PermitSwapHelper", HELPER_ADDRESS, defaultSigner);

  console.log("Executing permitAndSwap...");
  const tx = await helperContract.permitAndSwap(
    EXECUTOR_ADDRESS,
    DAI_ADDRESS,
    ROUTER_ADDRESS,
    amountIn,
    amountOutMin,
    path,
    to,
    deadline,
    v,
    r,
    s,
    { gasLimit: 1000000 }
  );
  const usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS);
  const usdcBalance = await usdc.balanceOf(EXECUTOR_ADDRESS);
  console.log("Executor USDC Balance after swap:", ethers.formatUnits(usdcBalance, 6));
}

main().catch((error) => {
  console.error("Error:", error);
  process.exitCode = 1;
});