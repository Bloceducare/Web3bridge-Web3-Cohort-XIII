// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {EventTicketing} from "../src/EventTicketing.sol";
import {TicketToken} from "../src/TicketToken.sol";
import {TicketNft} from "../src/TicketNft.sol";

contract EventTicketingTest is Test {
    EventTicketing public eventTicketing;
}
