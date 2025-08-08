// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.28;

library EventInfo {
    struct Event {
        string name;
        string description;
        uint256 ticketPrice;
        uint256 maxTickets;
        uint256 soldTickets;
        uint256 startTime;
        uint256 endTime;
        string venue;
        bool isActive;
        string metadataURI;
    }

    struct Ticket {
        uint256 eventId;
        address owner;
        bool used;
    }
}
