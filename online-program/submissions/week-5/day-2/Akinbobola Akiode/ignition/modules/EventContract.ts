import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const EventContractModule = buildModule("EventContractModule", (m) => {
    
  const baseURI = "ipfs://QmfE733vdAm7V3WQVQrE24yddUJvBYs4FAtLuaK5AsvZyz/";
  
  const eventContract = m.contract("EventContract", [baseURI]);

  return { eventContract };
});

export default EventContractModule; 