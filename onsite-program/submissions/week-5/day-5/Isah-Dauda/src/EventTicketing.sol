// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {TiketItem} from "./TicketNFT.sol";
import {TiketToken} from "./Ticketing.sol";

contract EventTicketing {
    TiketItem public ticketNFT;
    TiketToken public ticketToken;
    uint256 public ticketPrice;
    uint256 public totalTickets;
    uint256 public ticketsSold;
    address public eventOwner;
    bool public salesActive;
    string public eventName;
    string public eventDescription;

    mapping(address => uint256[]) public buyerToTokens;

    constructor(
        address _ticketNFT,
        address _ticketToken,
        uint256 _ticketPrice,
        uint256 _totalTickets,
        string memory _eventName,
        string memory _eventDescription
    ) {
        ticketNFT = TiketItem(_ticketNFT);
        ticketToken = TiketToken(_ticketToken);
        ticketPrice = _ticketPrice;
        totalTickets = _totalTickets;
        eventOwner = msg.sender;
        salesActive = true;
        eventName = _eventName;
        eventDescription = _eventDescription;
    }

    modifier onlyOwner() {
        require(msg.sender == eventOwner, "Not event owner");
        _;
    }

    function buyTicket(string memory tokenURI) public {
        require(salesActive, "Sales closed");
        require(ticketsSold < totalTickets, "Sold out");
        ticketToken.transferFrom(msg.sender, address(this), ticketPrice);
        uint256 tokenId = ticketNFT.awardItem(msg.sender, tokenURI);
        buyerToTokens[msg.sender].push(tokenId);
        ticketsSold++;
    }

    function setTicketPrice(uint256 _price) public onlyOwner {
        ticketPrice = _price;
    }

    function withdrawTokens(address to, uint256 amount) public onlyOwner {
        ticketToken.transfer(to, amount);
    }

    function closeSales() public onlyOwner {
        salesActive = false;
    }

    function ticketsRemaining() public view returns (uint256) {
        return totalTickets - ticketsSold;
    }

    function ticketsBoughtCount(address buyer) public view returns (uint256) {
        return buyerToTokens[buyer].length;
    }

    function tokenIdOfBuyerByIndex(
        address buyer,
        uint256 index
    ) public view returns (uint256) {
        require(index < buyerToTokens[buyer].length, "Index out of bounds");
        return buyerToTokens[buyer][index];
    }
}
