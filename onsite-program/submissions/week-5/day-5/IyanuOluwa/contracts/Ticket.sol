//SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Ticket is ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;

    struct TicketInfo {
        uint256 tokenId;
        uint256 totalTickets;
        uint256 ticketsSold;
        uint256 ticketPrice;
        uint256 ticketStartDate;
        uint256 ticketEndDate;
        address creator;
        bool ticketSold;
    }

    struct PurchaseInfo {
        address buyer;
        uint256 ticketsBought;
        uint256 totalPrice;
        uint256 ticketId;
        uint256 purchaseId;
        uint256 purchaseTimestamp;
    }

    mapping(uint256 => TicketInfo) public tickets;
    mapping(uint256 => PurchaseInfo[]) public ticketPurchases;
    mapping(address => uint256[]) public userTickets;

    uint256 public creationFeePercentage;  
    uint256 public purchaseFeePercentage;

    event TicketCreated(
        uint256 indexed tokenId,
        uint256 totalTickets,
        uint256 ticketPrice,
        uint256 ticketStartDate,
        uint256 ticketEndDate
    );

    event TicketPurchased(
        uint256 indexed tokenId,
        address buyer,
        uint256 ticketsBought
    );

    constructor(uint256 _creationFeePercentage, uint256 _purchaseFeePercentage) 
        ERC721("Ticket", "TICKET") 
    {
        _transferOwnership(msg.sender);
        creationFeePercentage = _creationFeePercentage;
        purchaseFeePercentage = _purchaseFeePercentage;
    }

    function createTicket(
        string calldata tokenURI,
        uint256 _totalTickets,
        uint256 _ticketPrice,
        uint256 _ticketEndDate
    ) external payable {
        require(_totalTickets > 0, "Total tickets must be greater than 0");
        require(_ticketPrice > 0, "Ticket price must be greater than 0");
        require(_ticketEndDate > block.timestamp, "Ticket end date must be in the future");

        uint256 currentID = _tokenIdCounter;
        _tokenIdCounter++;

        _safeMint(msg.sender, currentID);
        _setTokenURI(currentID, tokenURI);

        uint256 ticketStartDate = block.timestamp;

        tickets[currentID] = TicketInfo({
            tokenId: currentID,
            totalTickets: _totalTickets,
            ticketsSold: 0,
            ticketPrice: _ticketPrice,
            ticketStartDate: ticketStartDate,
            ticketEndDate: _ticketEndDate,
            creator: msg.sender,
            ticketSold: false
        });

        uint256 creationFee = creationFeePercentage;
        require(msg.value == creationFee, "Incorrect creation fee sent");

        payable(owner()).transfer(creationFee);

        emit TicketCreated(currentID, _totalTickets, _ticketPrice, ticketStartDate, _ticketEndDate);
    }

    function purchaseTicket(uint256 tokenID, uint256 ticketsToBuy) external payable {
        TicketInfo storage ticket = tickets[tokenID];
        require(ticket.creator != address(0), "Ticket does not exist");
        require(!ticket.ticketSold, "Ticket has already been sold");
        require(block.timestamp <= ticket.ticketEndDate, "Ticket sale period has ended");
        require(ticketsToBuy > 0 && ticketsToBuy <= ticket.totalTickets - ticket.ticketsSold, "Invalid number of tickets");

        uint256 totalPrice = ticket.ticketPrice * ticketsToBuy;
        uint256 purchaseFee = purchaseFeePercentage;
        uint256 totalPriceWithFee = totalPrice + purchaseFee;

        require(msg.value == totalPriceWithFee, "Incorrect amount sent");

        // Transfer the ticket price directly to the ticket creator
        payable(ticket.creator).transfer(totalPrice);

        // Transfer the purchase fee to the contract owner
        payable(owner()).transfer(purchaseFee);

        // Mint tickets and record purchases
        for (uint256 i = 0; i < ticketsToBuy; i++) {
            uint256 newTokenId = _tokenIdCounter;
            _tokenIdCounter++;
            _safeMint(msg.sender, newTokenId);
            _setTokenURI(newTokenId, tokenURI(tokenID));

            // Store the purchased ticket for the user
            userTickets[msg.sender].push(newTokenId);

            // Store the purchase information for the ticket
            ticketPurchases[newTokenId].push(PurchaseInfo({
                buyer: msg.sender,
                ticketsBought: 1,
                totalPrice: ticket.ticketPrice,
                ticketId: tokenID,
                purchaseId: newTokenId,
                purchaseTimestamp: block.timestamp
            }));

            ticket.ticketsSold++;
        }

        // Mark the ticket as sold when all tickets are sold
        if (ticket.ticketsSold == ticket.totalTickets) {
            ticket.ticketSold = true;
        }

        emit TicketPurchased(tokenID, msg.sender, ticketsToBuy);
    }

    function getUserTickets(address user) external view returns (uint256[] memory) {
        return userTickets[user];
    }

    function getTicketInfo(uint256 tokenID) external view returns (TicketInfo memory) {
        return tickets[tokenID];
    }

    function getPurchaseInfo(uint256 tokenID) external view returns (PurchaseInfo[] memory) {
        return ticketPurchases[tokenID];
    }

    function getCreationFeePercentage() external view returns (uint256) {
        return creationFeePercentage;
    }

    function getPurchaseFeePercentage() external view returns (uint256) {
        return purchaseFeePercentage;
    }

    // Additional functions for better functionality
    function setCreationFeePercentage(uint256 _newFee) external onlyOwner {
        creationFeePercentage = _newFee;
    }

    function setPurchaseFeePercentage(uint256 _newFee) external onlyOwner {
        purchaseFeePercentage = _newFee;
    }

    function withdrawFees() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}