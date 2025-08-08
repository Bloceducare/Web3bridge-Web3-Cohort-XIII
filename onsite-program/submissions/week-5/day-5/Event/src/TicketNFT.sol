pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TicketNFT is ERC721URIStorage, Ownable {
    uint256 private _tokenIds;
    string public eventName;
    address public ticketingPlatform;

    
    error NotTicketingPlatform();

    constructor(string memory _eventName) ERC721("EventTicket", "TKT") Ownable(msg.sender) {
        eventName = _eventName;
        _tokenIds = 0;
    }

    
    function setTicketingPlatform(address _platform) external onlyOwner {
        ticketingPlatform = _platform;
    }

    
    function mintTicket(address recipient, string memory tokenURI) public returns (uint256) {
        if (msg.sender != ticketingPlatform) revert NotTicketingPlatform();
        _tokenIds++;
        uint256 newTokenId = _tokenIds;
        _mint(recipient, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        return newTokenId;
    }
}