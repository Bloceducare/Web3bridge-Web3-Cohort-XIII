// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./TicketNFT.sol";

contract TicketingPlatform {
    IERC20 public token;
    TicketNFT public ticketNFT;
    uint256 public ticketPrice;
    address public owner;

    event TicketPurchased(address indexed buyer, uint256 tokenId);

    constructor(address _tokenAddress, address _ticketNFTAddress, uint256 _ticketPrice) {
        token = IERC20(_tokenAddress);
        ticketNFT = TicketNFT(_ticketNFTAddress);
        ticketPrice = _ticketPrice;
        owner = msg.sender;
    }

    function buyTicket() external {
        require(token.balanceOf(msg.sender) >= ticketPrice, "Insufficient token balance");
        require(token.allowance(msg.sender, address(this)) >= ticketPrice, "Insufficient allowance");

        
        token.transferFrom(msg.sender, address(this), ticketPrice);

        
        uint256 tokenId = ticketNFT.mintTicket(msg.sender);

        emit TicketPurchased(msg.sender, tokenId);
    }

    function withdrawTokens(uint256 amount) external {
        require(msg.sender == owner, "Only owner can withdraw");
        token.transfer(owner, amount);
    }
}