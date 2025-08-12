import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const PermitAndSwapModule = buildModule("PermitAndSwapModule", (m) => {
  const permitAndSwap = m.contract("PermitAndSwap");
  return { permitAndSwap };
});

export default {
  PermitAndSwapModule: {
    futures: [
      {
        name: "PermitAndSwap",
        contract: "PermitAndSwap",
        args: [
          "0x000000000022D473030F116dDEE9F6B43aC78BA3",
          "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
        ],
      },
    ],
  },
};
