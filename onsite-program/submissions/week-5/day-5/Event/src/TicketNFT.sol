pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
// import "@openzeppelin/contracts/utils/Counters.sol";

contract TicketNFT is ERC721 {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    string public eventName;

    constructor(string memory _eventName) ERC721("EventTicket", "TKT") {
        eventName = _eventName;
    }

    function mintTicket(address recipient) public returns (uint256) {
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        _mint(recipient, newTokenId);
        return newTokenId;
    }
}