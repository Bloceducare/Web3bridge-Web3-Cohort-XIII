// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import {EventFactory} from "src/TIcketSFTFactory.sol";
import {BilalNFT} from "src/TicketNFT.sol";
import {TicketToken} from "src/TicketToken.sol";

contract FactoryFlowTest is Test {
    EventFactory public factory;
    address public organizer = address(0x1);
    address public buyer = address(0x2);

    function setUp() public {
        factory = new EventFactory(organizer);
        vm.deal(organizer, 10 ether);
        vm.deal(buyer, 10 ether);
    }

    function testFullFlow() public {
        vm.startPrank(organizer);
        factory.createEvent(
            "Gold",
            "GLD",
            1000 * 10**18,
            "BilalNFT",
            "BNFT",
            10 * 10**18,
            5
        );
        vm.stopPrank();

        (
            address erc20TokenAddr,
            address nftTicketAddr,
            ,
            ,
            ,
            
        ) = factory.events(0);

        TicketToken paymentToken = TicketToken(erc20TokenAddr);
        BilalNFT ticketNFT = BilalNFT(nftTicketAddr);

        vm.startPrank(organizer);
        paymentToken.transfer(buyer, 50 * 10**18);
        vm.stopPrank();

        vm.startPrank(buyer);
        paymentToken.approve(address(factory), 10 * 10**18);
        factory.buyTicket(0, "ipfs://test");
        vm.stopPrank();

        assertEq(ticketNFT.ownerOf(0), buyer);
        assertEq(paymentToken.balanceOf(buyer), 40 * 10**18);
        assertEq(paymentToken.balanceOf(organizer), (1000 - 50 + 10) * 10**18);

        vm.startPrank(organizer);
        factory.mintExtraNFT(0, organizer, "ipfs://extra");
        vm.stopPrank();

        assertEq(ticketNFT.ownerOf(1), organizer);
    }
}