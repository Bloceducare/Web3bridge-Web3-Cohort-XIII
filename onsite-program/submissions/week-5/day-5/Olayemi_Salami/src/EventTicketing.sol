// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./TicketNft.sol";
import "./TicketToken.sol";

contract EventTicketing is Ownable {
    struct TicketDetails {
        uint256 ticket_price;
    }

    TicketToken public token;
    TicketNft public ticketNFT;
    TicketDetails public ticketDetails;
    uint256 public ticketsSold;

    event TicketPurchased(address indexed buyer, uint256 ticketId);

    constructor(
        address _tokenAddress,
        address _ticketNFTAddress,
        uint256 _ticketPrice
    ) Ownable(msg.sender) {
        token = TicketToken(_tokenAddress);
        ticketNFT = TicketNft(_ticketNFTAddress);
        ticketDetails = TicketDetails({ticket_price: _ticketPrice});
        ticketsSold = 0;
    }

    function buyTicket() external {
        require(token.balanceOf(msg.sender) >= ticketDetails.ticket_price, "Insufficient tokens");
        require(token.allowance(msg.sender, address(this)) >= ticketDetails.ticket_price, "Token allowance too low");

        bool success = token.transferFrom(msg.sender, owner(), ticketDetails.ticket_price);
        require(success, "Token transfer failed");

        uint256 ticketId = ticketNFT.mint(msg.sender);
        ticketsSold++;

        emit TicketPurchased(msg.sender, ticketId);
    }

    function setTicketPrice(uint256 _newPrice) external onlyOwner {
        ticketDetails.ticket_price = _newPrice;
    }
}