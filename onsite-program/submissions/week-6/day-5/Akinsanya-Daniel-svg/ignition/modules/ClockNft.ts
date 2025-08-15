import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ClockNftModule = buildModule("ClockNftModule",(m)  =>{
    const clockNftModule = m.contract("ClockNft");
    return {clockNftModule};
y
});

 export default ClockNftModule;
