// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Counters} from "@openzeppelin/contracts/utils/Counters.sol";

contract TicketNft is ERC721, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    address public minter;
    mapping(uint256 => uint256) public ticketOfToken;

    event MinterChanged(address indexed oldMinter, address indexed newMinter);
    event TicketMinted(address indexed to, uint256 indexed tokenId, uint256 indexed ticketId);

    constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) {}

    modifier onlyMinter() {
        require(minter == msg.sender, "TicketNft: caller is not minter");
        _;
    }

    function setMinter(address newMinter) external onlyOwner {
        emit MinterChanged(minter, newMinter);
        minter = newMinter;
    }

    function mintForRegistrant(address to, uint256 ticketId) external onlyMinter returns (uint256) {
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        _safeMint(to, newTokenId);
        ticketOfToken[newTokenId] = ticketId;
        emit TicketMinted(to, newTokenId, ticketId);
        return newTokenId;
    }
}
