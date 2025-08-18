

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";



const LudoGame = buildModule("LudoGameModule", (m) => {

    const ludoGame = m.contract("LudoGame");

    return {ludoGame};
});

export default LudoGame;