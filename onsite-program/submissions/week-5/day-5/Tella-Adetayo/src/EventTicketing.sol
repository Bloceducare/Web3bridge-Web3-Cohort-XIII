// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "./TicketNFT.sol";
import "./TicketToken.sol";
import "openzeppelin-contracts/contracts/utils/structs/EnumerableSet.sol";

error TOTAL_TICKET_MUST_BE_GREATER_THAN_ZERO();
error TICKET_END_DATE_MUST_BE_IN_FUTURE();
error TICKET_PRICE_MUST_BE_GREATER_THAN_ZERO();
error TICKET_NOT_FOUND();
error NOT_ENOUGH_PAYMENT();
error TICKETS_SOLD_OUT();
error TICKET_SALE_INACTIVE();
error ONLY_CREATOR();
error WITHDRAW_FAILED();

contract EventTicketing is TicketNFT, ReentrancyGuard {
    using EnumerableSet for EnumerableSet.UintSet;

    
    struct EventTicketInfo {
        uint256 tokenId; 
        uint256 ticketPrice;   
        uint256 totalTickets;   
        uint256 ticketsSold;     
        uint256 ticketStartDate;   
        uint256 ticketEndDate;      
        address payable creator;    
        bool isSoldOut;
    }

    struct PurchaseInfo {
        address buyer;
        uint256 ticketsBought;
        uint256 tokenId;            
        uint256 purchaseTimestamp;
        uint256 paid;               
    }

    mapping(uint256 => EventTicketInfo) public tickets;       
    mapping(address => uint256[]) public userPurchasedEventIds;     
    mapping(uint256 => PurchaseInfo[]) public ticketPurchases;     
    mapping(uint256 => EnumerableSet.UintSet) private purchasers;   

    // events
    event TicketCreated(
        uint256 indexed tokenId,
        uint256 totalTickets,
        uint256 ticketPrice,
        uint256 ticketStartDate,
        uint256 ticketEndDate,
        address indexed creator
    );

    event TicketPurchased(
        uint256 indexed tokenId,
        address indexed buyer,
        uint256 ticketsBought,
        uint256 totalPaid,
        uint256 purchaseId
    );

    event CreatorWithdrawn(
        uint256 indexed tokenId,
        address indexed creator,
        uint256 amount
    );

    constructor() TicketNFT("EventTicketMeta", "ETM") {
        
    }

    function createEventTicket(
        string calldata tokenURI,
        uint256 _totalTickets,
        uint256 _ticketPrice,
        uint256 _ticketEndDate
    ) external returns (uint256) {
        if (_totalTickets == 0) revert TOTAL_TICKET_MUST_BE_GREATER_THAN_ZERO();
        if (_ticketPrice == 0) revert TICKET_PRICE_MUST_BE_GREATER_THAN_ZERO();
        if (_ticketEndDate <= block.timestamp) revert TICKET_END_DATE_MUST_BE_IN_FUTURE();

        // mint metadata NFT to creator (this NFT represents the event)
        uint256 newTokenId = _mintTicket(msg.sender, tokenURI);

        uint256 ticketStartDate = block.timestamp;

        tickets[newTokenId] = EventTicketInfo({
            tokenId: newTokenId,
            ticketPrice: _ticketPrice,
            totalTickets: _totalTickets,
            ticketsSold: 0,
            ticketStartDate: ticketStartDate,
            ticketEndDate: _ticketEndDate,
            creator: payable(msg.sender),
            isSoldOut: false
        });

        emit TicketCreated(newTokenId, _totalTickets, _ticketPrice, ticketStartDate, _ticketEndDate, msg.sender);

        return newTokenId;
    }


    function buyTickets(uint256 tokenId, uint256 quantity) external payable nonReentrant {
        if (quantity == 0) revert TICKET_PRICE_MUST_BE_GREATER_THAN_ZERO();
        EventTicketInfo storage info = tickets[tokenId];
        if (info.tokenId == 0) revert TICKET_NOT_FOUND();
        if (block.timestamp < info.ticketStartDate || block.timestamp > info.ticketEndDate) revert TICKET_SALE_INACTIVE();
        if (info.isSoldOut) revert TICKETS_SOLD_OUT();

       
        uint256 remaining = info.totalTickets - info.ticketsSold;
        if (quantity > remaining) revert TICKETS_SOLD_OUT();

        uint256 required = info.ticketPrice * quantity;
        if (msg.value < required) revert NOT_ENOUGH_PAYMENT();

        
        info.ticketsSold += quantity;
        if (info.ticketsSold >= info.totalTickets) {
            info.isSoldOut = true;
        }

       
        uint256 purchaseId = ticketPurchases[tokenId].length + 1;
        PurchaseInfo memory p = PurchaseInfo({
            buyer: msg.sender,
            ticketsBought: quantity,
            tokenId: tokenId,
            purchaseId: purchaseId,
            purchaseTimestamp: block.timestamp,
            paid: required
        });
        ticketPurchases[tokenId].push(p);

       
        userPurchasedEventIds[msg.sender].push(tokenId);
        purchasers[tokenId].add(uint256(uint160(msg.sender))); 

        emit TicketPurchased(tokenId, msg.sender, quantity, required, purchaseId);
        
        if (msg.value > required) {
            uint256 refund = msg.value - required;
            (bool sent, ) = payable(msg.sender).call{value: refund}("");
            
            if (!sent) {
                
            }
        }
    }

    
    function getPurchasesForEvent(uint256 tokenId) external view returns (PurchaseInfo[] memory) {
        return ticketPurchases[tokenId];
    }

    
    function getPurchasersForEvent(uint256 tokenId) external view returns (address[] memory) {
        uint256 len = purchasers[tokenId].length();
        address[] memory list = new address[](len);
        for (uint256 i = 0; i < len; i++) {
            list[i] = address(uint160(purchasers[tokenId].at(i)));
        }
        return list;
    }

   
    function withdrawProceeds(uint256 tokenId) external nonReentrant {
        EventTicketInfo storage info = tickets[tokenId];
        if (info.tokenId == 0) revert TICKET_NOT_FOUND();
        if (msg.sender != info.creator) revert ONLY_CREATOR();

        
        uint256 total = 0;
        PurchaseInfo[] storage arr = ticketPurchases[tokenId];
        for (uint256 i = 0; i < arr.length; i++) {
            total += arr[i].paid;
        }

        
        delete ticketPurchases[tokenId];

        
        (bool sent, ) = info.creator.call{value: total}("");
        if (!sent) revert WITHDRAW_FAILED();

        emit CreatorWithdrawn(tokenId, info.creator, total);
    }

    function purchasesCount(uint256 tokenId) external view returns (uint256) {
        return ticketPurchases[tokenId].length;
    }

    
    function getUserPurchasedEvents(address user) external view returns (uint256[] memory) {
        return userPurchasedEventIds[user];
    }

   
    receive() external payable {}
}
