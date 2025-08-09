//SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;

import {TicketToken} from "./TicketToken.sol";

contract TokenSale {
    TicketToken public ticketToken; // Reference to the TicketToken contract
    uint256 public tokenPrice; // Price of each ticket token in wei
    address public owner; // Owner of the token sale contract

    constructor(
        address _ticketToken,
        uint256 _tokenPrice
    ) {
        ticketToken = TicketToken(_ticketToken);
        tokenPrice = _tokenPrice;
        owner = msg.sender;
    }

    function buyTokens() external payable {
        require(msg.value > 0, "Send ETH to buy tokens");
        
        uint256 tokenAmount = msg.value / tokenPrice;
        uint256 cost = tokenAmount * tokenPrice;
        uint256 refund = msg.value - cost;
        if (refund > 0) {
            payable(msg.sender).transfer(refund);
        }
        require(tokenAmount > 0, "Insufficient ETH for tokens");
        require(ticketToken.balanceOf(address(this)) >= tokenAmount, "Not enough tokens in sale contract");
        ticketToken.transfer(msg.sender, tokenAmount);
        payable(owner).transfer(cost);
    }
}