// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { parseEther } from "ethers";

const EventTicketingModule = buildModule("EventTicketingModule", (m) => {
  

  const ticketToken = m.contract("TicketToken", [parseEther("1000000")]);

  const ticketNft = m.contract("TicketNft");

  const eventTicketing = m.contract("EventTicketing", [ticketToken, ticketNft]);

  // 4. Authorize EventTicketing to mint NFTs
  m.call(ticketNft, "authorizeMinter", [eventTicketing]);

  return { 
    ticketToken, 
    ticketNft, 
    eventTicketing 
  };
});

export default EventTicketingModule;