import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

const LudoGameModule = buildModule('LudoGameModule', (m) => {
  const ludoToken = m.contract('LudoToken');

  const ludoGame = m.contract('LudoGame', [ludoToken]);

  return { ludoToken, ludoGame };
});

export default LudoGameModule;
