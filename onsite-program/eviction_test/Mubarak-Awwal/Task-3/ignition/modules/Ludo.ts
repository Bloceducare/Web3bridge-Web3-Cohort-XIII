import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TOTAL_SUPPLY = 1000n * 10n ** 18n; // 1000 tokens with 18 decimals
const STAKE_AMOUNT = 10n * 10n ** 18n; // 10 tokens

const LudoModule = buildModule("LudoModule", (m) => {
  const tokenSupply = m.getParameter("totalSupply", TOTAL_SUPPLY);
  const stake = m.getParameter("stakeAmount", STAKE_AMOUNT);

  const token = m.contract("LudoToken", [tokenSupply]);

  const game = m.contract("LudoGame", [token], {
    parameters: {
      stakeAmount: stake,
    },
  });

  return { token, game };
});

export default LudoModule;

