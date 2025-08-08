// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;


contract EventTicketSystem {

    struct Ticket{
        string eventName;
        uint ticketId;
        uint price;
    }
    EventToken eventToken;
    error INSUFFICIENT_TICKETS_LEFT();
    error TICKET_OUT_OF_SALES();
    mapping (string=> uint) private allEvents;
    mapping (string => Ticket) private eventTickets;
    function createTickets(string memory eventName, uint quantity)external{
        Ticket memory ticket = Ticket(eventName,quantity);
        allEvents[eventName] = quantity;
    }

    function getEventsTotalTicket(string memory eventName) external returns(uint){
        return allEvents[eventName];
    }
    function getEventTicketPrice(string memory eventName)external returns (uint){
        return eventTickets[eventName].price;
    }
    function purchaseTicket(string memory eventName, uint quantity) external {
        if(allEvents[eventName] ==0 )revert TICKET_OUT_OF_SALES();
        if(allEvents[eventName]<quantity)revert INSUFFICIENT_TICKETS_LEFT();
        if(eventToken.balanceOf(msg.sender)) {};
        allEvents[eventName]-=quantity;

    }
}
