import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

const MultiSigWalletModule = buildModule('MultiSigWalletModule', (m) => {
  const owners = [
    '0x27460aD9375953700B8A0A99C7aaf96834411f76',
    '0x27460aD9375953700B8A0A99C7aaf96834411f73',
    '0x27460aD9375953700B8A0A99C7aaf96834411f73',
  ];

  const requiredConfirmations = 2;

  const multiSigWallet = m.contract('MultiSigWallet', [
    owners,
    requiredConfirmations,
  ]);

  return { multiSigWallet };
});

export default MultiSigWalletModule;
