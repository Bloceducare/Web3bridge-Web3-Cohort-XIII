// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "./TicketNft.sol";
import "./TicketToken.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract EventTicketing {
    struct Ticket {
        Event eventCreated;
        bool isActive;
        uint ticket_id;
    }

    struct Event {
        string event_name;
        uint event_price;
        uint max_tickets;
        uint tickets_sold;
    }

    address owner;
    Event myEvent;
    address tokenAddress;
    address nftAddress;
    uint tokenId;

    Ticket[] listOfTickets;

    mapping(address => Ticket) ticketsLibrary;

    event TicketBought(address indexed _user);

    constructor(
        address _tokenAddress,
        address _nftAddress,
        string memory _name,
        uint _price,
        uint _max_ticket
    ) {
        owner = msg.sender;
        tokenAddress = _tokenAddress;
        nftAddress = _nftAddress;
        myEvent = Event(_name, _price, _max_ticket, 0);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "You're not the owner of event");
        _;
    }

    function buyTicket() external {
        require(myEvent.tickets_sold < myEvent.max_tickets, "Event sold out");
        require(
            IERC20(tokenAddress).balanceOf(msg.sender) >  myEvent.event_price,
            "Insufficient balance"
        );
        require(!ticketsLibrary[msg.sender].isActive, "Already has ticket");

        IERC20(tokenAddress).transferFrom(msg.sender, owner,  myEvent.event_price);

        tokenId++;
         
        // Mint NFT to buyer
        TicketNFT(nftAddress).safeMint(msg.sender);        

        ticketsLibrary[msg.sender] = Ticket(myEvent, true, tokenId);
        myEvent.tickets_sold = myEvent.tickets_sold + 1;


        emit TicketBought(msg.sender);
    }

    function hasTicket(address _user) external view returns (bool) {
        return ticketsLibrary[_user].isActive;
    }

    function getUserTicket(address _user) external view returns (Ticket memory) {
        return ticketsLibrary[_user];
    }

    function getTicketsSold() external view returns (uint) {
        return myEvent.tickets_sold;
    }

    function getEventDetails() external view returns (Event memory) {
        return myEvent;
    }

    function updateEventPrice(uint _price) external onlyOwner {
        myEvent.event_price = _price;
    }

    function getOwner() external view returns(address) {
        return owner;
    }
}
