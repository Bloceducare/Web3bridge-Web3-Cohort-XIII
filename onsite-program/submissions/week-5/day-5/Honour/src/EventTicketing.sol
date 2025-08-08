// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "./TicketNft.sol";
import "./TicketToken.sol";

contract EventTicketing {
    TicketNft public ticketNft;
    TicketToken public ticketToken;

    struct Ticket {
        uint256 ticketID;
        string name;
        uint256 price;
        address currentOwner;
    }

    address public Owner;

    modifier onlyOwner() {
        require(msg.sender == Owner, "Not the contract owner");
        _;
    }

    uint256 public ticketPrice;
    uint256 public nextTicketID = 1;

    mapping(uint256 => Ticket) public tickets;

    constructor(
        uint256 _ticketPrice,
        address _nftAddress,
        address _tokenAddress
    ) {
        require(_ticketPrice > 0, "Price must be greater than 0");
        ticketPrice = _ticketPrice;
        ticketNft = TicketNft(_nftAddress);
        ticketToken = TicketToken(_tokenAddress);
        Owner = msg.sender;
    }

    function buyTicket(string memory name, address recipient) external payable {
        require(msg.value >= ticketPrice, "Insufficient payment");
        require(recipient != address(0), "Invalid address");
        require(bytes(name).length > 0, "Name required");

        uint256 ticketID = nextTicketID++;

        tickets[ticketID] = Ticket({
            ticketID: ticketID,
            name: name,
            price: ticketPrice,
            currentOwner: recipient
        });

        ticketNft.mint(recipient, ticketID);

        if (msg.value > ticketPrice) {
            payable(msg.sender).transfer(msg.value - ticketPrice);
        }
    }

    function mintTicket(string memory name) external onlyOwner {
        require(bytes(name).length > 0, "Name required");

        uint256 ticketID = nextTicketID++;
        ticketNft.mint(Owner, ticketID);
        

        tickets[ticketID] = Ticket({
            ticketID: ticketID,
            name: name,
            price: 0,
            currentOwner: Owner
        });
    }

    function totalSupply() external view returns (uint256) {
        return nextTicketID - 1;
    }

    function withdraw() external onlyOwner {
        payable(Owner).transfer(address(this).balance);
    }
}

// ##### 4202
// ✅  [Success] Hash: 0xe9e5ed5aa4e181d273b259ccf999ddc006b213f54caadee72534420eaf58a116
// Contract Address: 0xD3a504f1029628D18C37B53E47f0B0e560BfAfb3
// Block: 24677610
// Paid: 0.000000000315666374 ETH (1242781 gas * 0.000000254 gwei)
// https://sepolia-blockscout.lisk.com/address/0xd3a504f1029628d18c37b53e47f0b0e560bfafb3

// ##### 4202
// ✅  [Success] Hash: 0x9a51ad15b2b704aa7e56c4a0f45121f83d0ce457dd51e0adc1cc19aa609a632a
// Contract Address: 0x2e347aebf457f349886880999F5F465Cd2F69F4B
// Block: 24677610
// Paid: 0.000000000239226598 ETH (941837 gas * 0.000000254 gwei)
// URL: https://sepolia-blockscout.lisk.com/address/0x2e347aebf457f349886880999f5f465cd2f69f4b


// ##### 4202
// ✅  [Success] Hash: 0xed5edc0c2e632e8ee15271c9d715f8c930baf792f1e44bc16eeda377cf812aec
// Contract Address: 0xAE8B4f37ad89a075Ad5392Add2F29C7C62E8228D
// Block: 24677610
// Paid: 0.000000000483349554 ETH (1902951 gas * 0.000000254 gwei)
// URL: https://sepolia-blockscout.lisk.com/address/0xae8b4f37ad89a075ad5392add2f29c7c62e8228d

// ✅ Sequence #1 on 4202 | Total Paid: 0.000000001038242526 ETH (4087569 gas * avg 0.000000254 gwei)      ✅ Sequence #1 on 4202 | Total Paid: 0.000000001038242526 ETH (4087569 gas * avg 0.000000254 gwei)       
