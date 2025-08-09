// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./EventNFT.sol";
import "./EventToken.sol";


contract EventTicketSystem {
    struct Ticket{
        string eventName;
        uint ticketId;
        uint price;
    }

    error INSUFFICIENT_TICKETS_LEFT();
    error TICKET_OUT_OF_SALES();
    error INSUFFICIENT_BALANCE();

    mapping (string=> uint) private allEvents;
    mapping (string => Ticket) private eventTickets;

    EventToken private eventToken;
    EventNFT private eventNFT;
    address private owner;

    constructor(address tokenAddress,address tokenNFT ){
        eventToken = EventToken(tokenAddress);
        eventNFT = EventNFT(tokenNFT);
        owner = msg.sender;
    }

    function createTickets(string memory eventName, uint quantity, uint price)external{
        Ticket memory ticket = Ticket(eventName,quantity,price);
        allEvents[eventName] = quantity;
        eventTickets[eventName]= ticket;
    }

    function getEventsTotalTicket(string memory eventName) external view returns(uint){
        return allEvents[eventName];
    }
    function getEventTicketPrice(string memory eventName)external view returns (uint){
        return eventTickets[eventName].price;
    }
    
    function purchaseTicket(string memory eventName) external {
        if(allEvents[eventName] ==0 )revert TICKET_OUT_OF_SALES();
        if(eventToken.balanceOf(msg.sender)<eventTickets[eventName].price) revert INSUFFICIENT_BALANCE();
        eventToken.transferFrom(msg.sender, owner, eventTickets[eventName].price);
        allEvents[eventName]-=1;
        eventNFT.mintToken(msg.sender,"https://gateway.pinata.cloud/ipfs/bafkreidywj6jwqdpnlndlussedj7u77dh47sjt5hm7ze6ufirow5prubzi");
    }
    function isHoldingNFT(address holder) external view returns(bool){
        return eventNFT.balanceOf(holder)>0;
    }
    function getEventsTicketsLeft(string memory eventName)external view returns(uint){
        return allEvents[eventName];
    }
}
