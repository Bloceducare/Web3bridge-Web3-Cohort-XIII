// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {EventTicketNft} from "./TicketNft.sol";
import {EventTicketToken} from "./TicketToken.sol";

contract EventTicketing {

    struct TicketDetails {
        uint256 ticketPrice; 
        uint256 maxTickets; 
        uint256 ticketsSold;
        uint256 initialTokenSupply;
    }

    
    address public owner;
    
    EventTicketNft public ticketNft;
    
    EventTicketToken public ticketToken;
    
    TicketDetails public eventDetails;
    
    mapping(address => bool) public hasTicket;

    
    event TicketPurchased(address indexed buyer, uint256 ticketId, uint256 tokensReceived);

    
    constructor(
        uint256 _ticketPrice,
        uint256 _maxTickets,
        uint256 _initialTokenSupply,
        address _ticketNft,
        address _ticketToken
    ) {
        owner = msg.sender;
        ticketNft = EventTicketNft(_ticketNft);
        ticketToken = EventTicketToken(_ticketToken);
        eventDetails = TicketDetails({
            ticketPrice: _ticketPrice,
            maxTickets: _maxTickets,
            ticketsSold: 0,
            initialTokenSupply: _initialTokenSupply
        });
    }

    
    function buyTicket() external payable {
        
        require(eventDetails.ticketsSold < eventDetails.maxTickets, "No tickets left");
        
        require(msg.value >= eventDetails.ticketPrice, "Insufficient payment");
        
        require(!hasTicket[msg.sender], "Already purchased a ticket");

        
        eventDetails.ticketsSold++;
        
        hasTicket[msg.sender] = true;

        
        uint256 ticketId = eventDetails.ticketsSold;
        ticketNft.mint(msg.sender, ticketId);

        
        uint256 tokensToSend = 100 * 10**18;
        ticketToken.transfer(msg.sender, tokensToSend);

        
        if (msg.value > eventDetails.ticketPrice) {
            payable(msg.sender).transfer(msg.value - eventDetails.ticketPrice);
        }

        
        emit TicketPurchased(msg.sender, ticketId, tokensToSend);
    }

    
    function withdraw() external {
        require(msg.sender == owner, "Only owner can withdraw");
        payable(owner).transfer(address(this).balance);
    }

    
    function getTicketPrice() external view returns (uint256) {
        return eventDetails.ticketPrice;
    }

    
    function getRemainingTickets() external view returns (uint256) {
        return eventDetails.maxTickets - eventDetails.ticketsSold;
    }
}