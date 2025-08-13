import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const PermitSwapModule = buildModule("PermitSwapModule", (m) => {
  
  const uniswapRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"; // Mainnet Uniswap V2 Router
  const mockToken = m.contract("MockToken");
  const permitSwap = m.contract("PermitSwap", [uniswapRouter]);

  return { permitSwap, mockToken };
});

export default PermitSwapModule;