// SPDX-License-Identifier: LICENSE
pragma solidity ^0.8.20;

// an event ticketing contract that allows users to purchase tickets using ERC20 tokens and mint ERC721 tokens as tickets
import "./ERC20.sol";
import "./ERC721.sol";

contract EventTicketing {
    ERC20Token public paymentToken;
    ERC721Token public ticketToken;

    event TicketPurchased(address indexed buyer, uint256 tokenId);

    constructor(ERC20Token _paymentToken, ERC721Token _ticketToken) {
        paymentToken = _paymentToken;
        ticketToken = _ticketToken;
    }

    function purchaseTicket() external {
        uint256 ticketPrice = 1 * 10 ** 18; // Assuming the price is 1 token
        require(paymentToken.balanceOf(msg.sender) >= ticketPrice, "Insufficient balance");

        paymentToken.transferFrom(msg.sender, address(this), ticketPrice);
        uint256 tokenId = ticketToken.mint(msg.sender);
        
        emit TicketPurchased(msg.sender, tokenId);
    }

    function withdrawFunds() external {
        uint256 balance = paymentToken.balanceOf(address(this));
        paymentToken.transfer(msg.sender, balance);
    }
}