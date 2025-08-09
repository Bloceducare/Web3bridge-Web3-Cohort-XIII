// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {EventTicketing} from "../src/EventTicket.sol";
import {TicketNft} from "../src/TicketNft.sol";
import {TicketToken} from "../src/TicketToken.sol";




contract EventTicketTest is Test {
    EventTicketing public eventTicket;
    TicketNft public ticketNft;
    TicketToken public ticketToken;
    
   
    
    
    

    function setUp() public {
        ticketNft = new TicketNft();
        ticketToken = new TicketToken(100000000000000000); 
        eventTicket = new EventTicketing(address(ticketToken),address(ticketNft));

        
    }

    function test_Create_Ticket() public {
        uint256 _ticket_price = 100;
        string memory _eventName= "Burna event";
        string memory _eventDate= "12/10/2025";
        string memory _eventLocation= "Lagos";
        address _erc20TokenAddress= address(0x56C3da91721FeC41B3e1D859729B1B19a00A0F63);
        string memory _nftUri= "https://gateway.pnata.cloud/ipfs/bafkreiagqyvfasb76ta4cqyl2zzyvkf3vf374kzj4unpqbznfobyvbmr4q";
        eventTicket.createTicket(_ticket_price, _eventName,_eventDate, _eventLocation, _erc20TokenAddress,_nftUri);

        string memory name = eventTicket.getAllTicket()[0].eventName;

        assertEq(_eventName, name);
        assertEq(eventTicket.getAllTicket()[0].eventDate, _eventDate);
        assertEq(eventTicket.getAllTicket()[0].nftUri, _nftUri);
    }

     function test_Create_Ticket_with_invalid_address_revert() public {
        uint256 _ticket_price = 100;
        string memory _eventName= "Burna event";
        string memory _eventDate= "12/10/2025";
        string memory _eventLocation= "Lagos";
        string memory _nftUri= "https://gateway.pnata.cloud/ipfs/bafkreiagqyvfasb76ta4cqyl2zzyvkf3vf374kzj4unpqbznfobyvbmr4q";

        vm.expectRevert(bytes("INVALID_TOKEN_ADDRESS()"));
        eventTicket.createTicket(_ticket_price, _eventName,_eventDate, _eventLocation, address(0), _nftUri);
    }

    function test_Create_Ticket_with_invalid_amount_revert() public {
        uint256 _ticket_price = 0;
        string memory _eventName= "Burna event";
        string memory _eventDate= "12/10/2025";
        string memory _eventLocation= "Lagos";
        string memory _nftUri= "https://gateway.pnata.cloud/ipfs/bafkreiagqyvfasb76ta4cqyl2zzyvkf3vf374kzj4unpqbznfobyvbmr4q";

        vm.expectRevert(bytes("TICKET_PRICE_MUST_BE_GREATER_THAN_ZERO()"));
        eventTicket.createTicket(_ticket_price, _eventName,_eventDate, _eventLocation, address(0), _nftUri);
    }

      function test_Buy_Ticket_when_event_isClosed_revert() public {
        uint256 _ticket_price = 100;
        string memory _eventName= "Burna event";
        string memory _eventDate= "12/10/2025";
        string memory _eventLocation= "Lagos";
        address _erc20TokenAddress= address(0x56C3da91721FeC41B3e1D859729B1B19a00A0F63);
        string memory _nftUri= "https://gateway.pnata.cloud/ipfs/bafkreiagqyvfasb76ta4cqyl2zzyvkf3vf374kzj4unpqbznfobyvbmr4q";
        eventTicket.createTicket(_ticket_price, _eventName,_eventDate, _eventLocation, _erc20TokenAddress,_nftUri);
        eventTicket.closeTicket(0);

        vm.expectRevert(bytes("EVENT_CLOSED()"));
        eventTicket.buyTicket(0);

    }

    



    }



    // function testFuzz_SetNumber(uint256 x) public {
    //     counter.setNumber(x);
    //     assertEq(counter.number(), x);
    // }

