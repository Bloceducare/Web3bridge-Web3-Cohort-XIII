// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "./TicketToken.sol";
import "./TicketNft.sol";
import {console} from "forge-std/console.sol";

error EVENT_CLOSED();
error  NOT_ENOUGH_BALANCE_TO_PURCHASE();
error TOKEN_PURCHASE_FAIL_APPROVE_US_TO_DEDUCT_TICKET_PRICE();
error TICKET_PRICE_MUST_BE_GREATER_THAN_ZERO();
error INVALID_TOKEN_ADDRESS();

contract EventTicketing {
    TicketToken ticketToken;
    TicketNft ticketNft;

// "Ticket", "TKT" 0xB91B6DA35e25E0506dD82bf460e8F115ec7D1a27

    mapping (address =>  TicketDetails[]) ticketCreator;
    mapping (uint256 => TicketDetails) tickets;
    mapping (uint256 => TicketDetails []) ticketsPurched;
    uint256 ticketId;
    

    struct TicketDetails {
        uint256 ticket_price;
        string eventName;
        string eventDate;
        string eventLocation;
        uint256 ticketId;
        bool isOpen;
        address erc20TokenAddress;
        string nftUri;
    }

    constructor(address _token, address _nft) {
        ticketToken =  TicketToken(_token);
        ticketNft =  TicketNft(_nft);
    }

    function createTicket(uint256 _ticket_price, string memory _eventName, string memory _eventDate, string memory _eventLocation, address _erc20TokenAddress, string memory _nftUri) external  returns (TicketDetails memory) {
        require(_ticket_price > 0, TICKET_PRICE_MUST_BE_GREATER_THAN_ZERO());
        require(_erc20TokenAddress != address(0), INVALID_TOKEN_ADDRESS());
        uint256 _ticketId = ticketId ++;
        TicketDetails memory newTicket = TicketDetails({ 
            ticket_price: _ticket_price,
            eventName: _eventName,
            eventDate: _eventDate,
            eventLocation: _eventLocation,
            ticketId: _ticketId,
            isOpen: true,
            erc20TokenAddress: _erc20TokenAddress,
            nftUri: _nftUri
        });


        ticketCreator[msg.sender].push(newTicket);
    

        tickets[_ticketId] = newTicket;
        return newTicket;
    }

     function buyTicket(uint256 _ticketId) external  {
    
        TicketDetails storage ticketDetails = tickets[_ticketId];
        require(ticketDetails.isOpen != false, EVENT_CLOSED());
        require(ticketToken.balanceOf(msg.sender) >= ticketDetails.ticket_price,  NOT_ENOUGH_BALANCE_TO_PURCHASE());

        

        bool response = ticketToken.transferFrom(msg.sender,ticketDetails.erc20TokenAddress, ticketDetails.ticket_price);

        if (response == true){
            ticketNft.mintTicket(msg.sender, ticketDetails.nftUri);
             ticketsPurched[_ticketId].push(ticketDetails);
            return ;
        }

        revert("TOKEN_PURCHASE_FAIL_APPROVE_US_TO_DEDUCT_TICKET_PRICE");
    }

     function getTotalTicketPurchased (uint256 _ticketId) external view returns (TicketDetails [] memory){
        return ticketsPurched[_ticketId];
    }

    function getAllTicket() external view returns(TicketDetails [] memory) {
        return ticketCreator[msg.sender];
    }

    function closeTicket(uint256 _ticketId) external {
        TicketDetails storage ticketDetails = tickets[_ticketId];
        ticketDetails.isOpen = false;
    }



}




// "https://gateway.pnata.cloud/ipfs/bafkreiagqyvfasb76ta4cqyl2zzyvkf3vf374kzj4unpqbznfobyvbmr4q
