// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;
import "./TicketNft.sol";
import "./TicketToken.sol";


contract EventTicket{
    struct TicketDetails {
        uint256 ticketId;
        uint256 ticketPrice;
        string eventName;
        bool isActive;
        address  ticketOwner;
        string nftUrl;
    
    }
    address public owner;
    uint256 uuid;

    TicketNft ticketNft;
    TicketToken ticketToken;

    mapping(uint256 => TicketDetails) tickets;
    constructor(address _token,address _nft){
          ticketNft = TicketNft(_nft);
          ticketToken =  TicketToken(_token);
    }
  



    
    function createTicket(uint256 _ticketPrice, string memory _eventName, address _ticketAddress,string memory _nftUrl)external{
        require(_ticketPrice > 0, "Ticket Price must be greater than zero");
        uuid = uuid + 1;
        TicketDetails memory new_ticket = TicketDetails(uuid,_ticketPrice,_eventName,true,_ticketAddress,_nftUrl);
        tickets[uuid] = new_ticket;
       

    }

    function purchaseTicket(uint256 ticketId)external payable{
       TicketDetails memory ticketDetails = tickets[ticketId];
       require(ticketDetails.isActive == true,"ticket not available");
       require(ticketToken.balanceOf(msg.sender) >= ticketDetails.ticketPrice,"Insufficient fundss");
       bool success = ticketToken.transferFrom(msg.sender, ticketDetails.ticketOwner, ticketDetails.ticketPrice);
       if(success){
        ticketNft.mintTicket(msg.sender,ticketDetails.nftUrl);
        ticketDetails.isActive = false;
        return ;
      }

      revert("Failed");
       
       
    }

    function getTicket(uint256 ticketId)external view returns(TicketDetails memory) {
        return tickets[ticketId];

    }
}
