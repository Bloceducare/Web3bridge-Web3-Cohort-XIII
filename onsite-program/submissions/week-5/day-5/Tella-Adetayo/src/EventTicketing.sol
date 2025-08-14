// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./TicketToken.sol";
import "./TicketNFT.sol";

contract EventTicketing {
    struct TicketInfo {
        uint256 tokenId; 
        uint256 totalTickets; 
        uint256 ticketsSold; 
        uint256 ticketPrice; 
        uint256 ticketStartDate;
        uint256 ticketEndDate; 
        address creator; 
        bool isTicketSold; 
        string eventName; 
    }

    struct BuyerInfo {
        address buyer; 
        uint256 ticketsBought; 
        uint256 totalPrice; 
        uint256 ticketId; 
        uint256 purchaseId; 
        uint256 purchaseTimestamp; 
    }


    TicketToken public paymentToken; 
    TicketNFT public ticketNFT; 
    uint256 internal currentID;
    address public owner; 

    


    uint256 public creationFeePercentage; 
    uint256 public purchaseFeePercentage;

    mapping(uint256 => TicketInfo) public tickets; 
    mapping(address => uint256[]) public userTickets; 
    mapping(uint256 => BuyerInfo[]) public ticketPurchases;

    error TICKET_MUST_BE_GREATER_THAN_ZERO();
    error TICKET_DATE_SHOULD_BE_FUTURE();
    error TICKET_PRICE_MUST_BE_GREATER_THAN_ZERO();
    error INVALID_NUMBER_OF_TICKETS();
    error TICKET_HAS_ALREADY_BEEN_SOLD(); 
    error INCORRECT_AMOUNT_SENT();
    error INCORRECT_CREATION_FEE_SENT();



    constructor(address _token, address _nft, uint256 _creationFeePercentage, uint256 _purchaseFeePercentage) {
        paymentToken = TicketToken(_token); 
        ticketNFT = TicketNFT(_nft); 
        purchaseFeePercentage = _purchaseFeePercentage; 
        creationFeePercentage = _creationFeePercentage; 
        owner = msg.sender; 
    }

    function createTicket(string calldata _tokenURI, uint256 _totalTickets, uint256 _ticketPrice, string calldata _eventName, uint256 _ticketEndDate) external payable { 
        if (_totalTickets == 0) {
            revert TICKET_MUST_BE_GREATER_THAN_ZERO();
        }

        if (_ticketPrice == 0) {
            revert TICKET_PRICE_MUST_BE_GREATER_THAN_ZERO();
        } 

        if (_ticketEndDate < block.timestamp) {
            revert TICKET_DATE_SHOULD_BE_FUTURE();
        }

        currentID++;

        ticketNFT.mintNFT(msg.sender, _tokenURI);

        uint256 ticketStartDate = block.timestamp; 

        tickets[currentID] = TicketInfo({
            tokenId: currentID, 
            totalTickets: _totalTickets, 
            ticketsSold: 0, 
            ticketPrice: _ticketPrice, 
            ticketStartDate: ticketStartDate, 
            ticketEndDate: _ticketEndDate, 
            creator: msg.sender, 
            isTicketSold: false, 
            eventName: _eventName
        });

        uint256 creationFee = creationFeePercentage; 
        if (msg.value != creationFee) {
            revert INCORRECT_CREATION_FEE_SENT();
        }

        payable(owner).transfer(creationFee);
    }

    function purchaseTicket(uint256 _eventId, uint256 _ticketsToBuy, string memory _tokenURI) external payable {
    TicketInfo storage ticket = tickets[_eventId];

    if (ticket.ticketsSold + _ticketsToBuy > ticket.totalTickets) revert INVALID_NUMBER_OF_TICKETS();

    uint256 totalPrice = ticket.ticketPrice * _ticketsToBuy; 
    uint256 totalPriceWithFee = totalPrice + purchaseFeePercentage; 

    if (msg.value != totalPriceWithFee) revert INCORRECT_AMOUNT_SENT();

    payable(ticket.creator).transfer(totalPrice);
    payable(owner).transfer(purchaseFeePercentage);

    for (uint256 i = 0; i < _ticketsToBuy; i++) {
        uint256 newTokenId = ticketNFT.mintNFT(msg.sender, _tokenURI);

        ticketPurchases[_eventId].push(BuyerInfo({
            buyer: msg.sender,
            ticketsBought: 1, 
            totalPrice: ticket.ticketPrice, 
            ticketId: _eventId, 
            purchaseId: newTokenId, 
            purchaseTimestamp: block.timestamp
        }));

        ticket.ticketsSold++;
        }
    }

    function getUserTickets(address _user) external view returns (uint256[] memory) {
        return userTickets[_user];
    }

    function getTicketInfo(uint256 _tokenID) external view returns (TicketInfo memory) {
        return tickets[_tokenID];
    }

    function getPurchaseInfo(uint256 _tokenID) external view returns (BuyerInfo[] memory) {
        return ticketPurchases[_tokenID];
    }
}