// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract RewardNFT is ERC721, Ownable {
    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIdCounter;
    
    mapping(uint256 => string) private _tokenURIs;
    
    constructor(string memory name, string memory symbol) ERC721(name, symbol) {
     
        _tokenIdCounter.increment();
    }
    
    function mint(address to) external onlyOwner returns (uint256) {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _mint(to, tokenId);
        return tokenId;
    }
    
    function mintWithURI(address to, string memory uri) external onlyOwner returns (uint256) {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _mint(to, tokenId);
        _setTokenURI(tokenId, uri);
        return tokenId;
    }

    function mintBatchForLootBox(address lootBoxAddress, uint256 amount) external onlyOwner returns (uint256[] memory) {
        uint256[] memory tokenIds = new uint256[](amount);
        
        for (uint256 i = 0; i < amount; i++) {
            uint256 tokenId = _tokenIdCounter.current();
            _tokenIdCounter.increment();
            _mint(lootBoxAddress, tokenId);
            tokenIds[i] = tokenId;
        }
        
        return tokenIds;
    }
 
    function _setTokenURI(uint256 tokenId, string memory uri) internal {
        require(_exists(tokenId), "Token does not exist");
        _tokenURIs[tokenId] = uri;
    }
    
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        
        string memory _tokenURI = _tokenURIs[tokenId];
        string memory base = _baseURI();
        
        if (bytes(base).length > 0 && bytes(_tokenURI).length > 0) {
            return string(abi.encodePacked(base, _tokenURI));
        }

        if (bytes(_tokenURI).length > 0) {
            return _tokenURI;
        }

        if (bytes(base).length > 0) {
            return string(abi.encodePacked(base, toString(tokenId)));
        }
        
        return "";
    }

    function getCurrentTokenId() external view returns (uint256) {
        return _tokenIdCounter.current();
    }
    
    function toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}