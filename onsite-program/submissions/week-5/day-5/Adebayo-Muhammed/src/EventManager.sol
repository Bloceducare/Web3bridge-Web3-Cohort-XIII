// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./PaymentToken.sol";
import "./TicketNFT.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract EventManager is Ownable {
    PaymentToken public paymentToken;
    TicketNFT public ticketNFT;
    
    uint256 public ticketPrice = 100 * 10**18; // 100 tokens
    bool public eventActive = true;
    
    // Store ticket info here
    mapping(uint256 => address) public ticketBuyer;
    mapping(uint256 => uint256) public ticketPurchasePrice;
    mapping(address => bool) public hasTicket;
    
    event TicketPurchased(address indexed buyer, uint256 tokenId, uint256 price);
    event EventEnded();

    constructor(address _paymentToken, address _ticketNFT) Ownable(msg.sender) {
        paymentToken = PaymentToken(_paymentToken);
        ticketNFT = TicketNFT(_ticketNFT);
    }

    function buyTicket(uint256 tokenAmount) external {
        require(eventActive, "Event ended");
        require(!hasTicket[msg.sender], "Already has ticket");
        require(tokenAmount >= ticketPrice, "Not enough tokens");
        
        // Transfer tokens from buyer to owner
        paymentToken.transferFrom(msg.sender, owner(), tokenAmount);
        
        // Mint NFT ticket to buyer
        uint256 tokenId = ticketNFT.mint(msg.sender);
        
        // Store event info here
        ticketBuyer[tokenId] = msg.sender;
        ticketPurchasePrice[tokenId] = tokenAmount;
        hasTicket[msg.sender] = true;
        
        emit TicketPurchased(msg.sender, tokenId, tokenAmount);
    }

    function endEvent() external onlyOwner {
        eventActive = false;
        emit EventEnded();
    }

    function revealTickets() external onlyOwner {
        require(!eventActive, "End event first");
        ticketNFT.reveal();
    }

    function setTicketPrice(uint256 newPrice) external onlyOwner {
        ticketPrice = newPrice;
    }

    function getTicketInfo(uint256 tokenId) external view returns (address buyer, uint256 price) {
        return (ticketBuyer[tokenId], ticketPurchasePrice[tokenId]);
    }

    function getAllTicketInfo() external view returns (
        uint256 totalSold,
        address[] memory buyers,
        uint256[] memory prices
    ) {
        totalSold = ticketNFT.totalTickets();
        buyers = new address[](totalSold);
        prices = new uint256[](totalSold);
        
        for (uint256 i = 1; i <= totalSold; i++) {
            buyers[i-1] = ticketBuyer[i];
            prices[i-1] = ticketPurchasePrice[i];
        }
    }
}