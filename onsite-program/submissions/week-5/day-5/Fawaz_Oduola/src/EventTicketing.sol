// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;
import "./TicketToken.sol";
import "./TicketNft.sol";


contract EventTicketing {
    
    TicketNft ticketNft;
    TicketToken ticketToken;

    address owner;
    uint256 ticketPrice;
    uint256 tokenId;
    uint256 totalTicketsCount;

    

    constructor(address  _ticketNft, address _ticketToken, uint256 _ticketPrice, uint256 _totalTicketsCount){
        ticketNft = TicketNft(_ticketNft);
        ticketToken = TicketToken(_ticketToken);
        ticketPrice = _ticketPrice;
        totalTicketsCount = _totalTicketsCount;
        owner = msg.sender;
    }

    function buyTicket() external returns(uint256){
        if (totalTicketsCount < 1){
            revert("Tickets has finished");
        }

        ticketToken.transferFrom(msg.sender, owner, ticketPrice);
        totalTicketsCount--;
        return ticketNft.mint(msg.sender);
    }

    function buyToken() external payable {
        ticketToken.mint(msg.sender, 1000);
    }

}
