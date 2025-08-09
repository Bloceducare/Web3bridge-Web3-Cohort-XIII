// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./TicketToken.sol";
import "./TicketNft.sol";

contract EventTicketing {
    struct TicketDetails {
        uint256 ticket_price;
        uint UID;
        string eventName;
        bool Active;
        string NFT;
        address erc20Token;
        address paymentAddress;
    }
    struct BuyTickets {
        uint TicketId;
        string eventName;
        uint ticket_amount;
        bool has_bought;
        address _buyer;
    }

    address private owner;
    TicketNft private ticketnft;
    TicketToken private tickettoken;

    constructor(address _nft, address _token) {
        owner = msg.sender;
        ticketnft = TicketNft(_nft);
        tickettoken = TicketToken(_token);
    }

    mapping(address => BuyTickets[]) TicketInfo;

    TicketDetails[] tickets;
    uint private nextId;
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    function createTicket(
        string memory _eventName,
        uint256 _amount,
        string memory _nftURI,
        address _paymentAddress
    ) external {
        TicketDetails memory _ticketDetails;

        _ticketDetails.eventName = _eventName;
        _ticketDetails.ticket_price = _amount;
        _ticketDetails.Active = true;
        _ticketDetails.UID = nextId;
        _ticketDetails.NFT = _nftURI;
        _ticketDetails.paymentAddress = _paymentAddress;
        _ticketDetails.erc20Token = address(tickettoken);
        nextId++;
        tickets.push(_ticketDetails);
    }

    function buyTickets(uint _UID) external payable {
        TicketDetails memory _ticketDetails = tickets[_UID];
        require(_ticketDetails.Active == true, "NOT OPEN");

        BuyTickets memory _buyTickets = BuyTickets({
            TicketId: _UID,
            eventName: _ticketDetails.eventName,
            ticket_amount: _ticketDetails.ticket_price,
            has_bought: true,
            _buyer: msg.sender
        });

        TicketInfo[msg.sender].push(_buyTickets);

        bool response = tickettoken.transferFrom(
            msg.sender,
            _ticketDetails.erc20Token,
            _ticketDetails.ticket_price
        );

        if (response == true) {
            ticketnft.mintNFT(msg.sender, _ticketDetails.NFT);
            return;
        }
        revert("APPROVE TO SPEND");

        // Create a BuyTickets struct and fill it
    }

    function getBuyTickets(
        address _address
    ) external view returns (BuyTickets[] memory) {
        return TicketInfo[_address];
    }
    function updateStatus(uint _UID) external onlyOwner {
        TicketDetails storage ticket = tickets[_UID];
        ticket.Active = false;
    }

    function getTickets() external view returns (TicketDetails[] memory) {
        return tickets;
    }
    receive() external payable {}
}

// "https://gateway.pinata.cloud/ipfs/bafkreie4gidtaxiacag7ocnnts7645llh65ew6giuzd6oczncf7j5vemh4"
