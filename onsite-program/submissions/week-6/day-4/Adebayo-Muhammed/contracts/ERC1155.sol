// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
contract GameItems is ERC1155, Ownable {
    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIdCounter;
    
    mapping(uint256 => string) public itemNames;
    
    uint256 public constant SWORD = 1;
    uint256 public constant SHIELD = 2;
    uint256 public constant POTION = 3;
    uint256 public constant GEM = 4;
    
    constructor() ERC1155("https://indigo-effective-porpoise-546.mypinata.cloud/ipfs/bafkreiausplr4is6u2quqxddzpm5ihqq2j4ogyq2skk53eyleetzqnfsw4") {
        itemNames[SWORD] = "Magic Sword";
        itemNames[SHIELD] = "Dragon Shield";
        itemNames[POTION] = "Health Potion";
        itemNames[GEM] = "Power Gem";
        
        _tokenIdCounter._value = 5; 
    }
    

    function mint(address to, uint256 tokenId, uint256 amount, bytes memory data) external onlyOwner {
        _mint(to, tokenId, amount, data);
    }
    
    function mintBatch(
        address to,
        uint256[] memory tokenIds,
        uint256[] memory amounts,
        bytes memory data
    ) external onlyOwner {
        _mintBatch(to, tokenIds, amounts, data);
    }
    
    function createAndMint(
        address to,
        uint256 amount,
        string memory itemName,
        bytes memory data
    ) external onlyOwner returns (uint256) {
        uint256 newTokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        itemNames[newTokenId] = itemName;
        _mint(to, newTokenId, amount, data);
        
        return newTokenId;
    }
    
    function mintForLootBox(
        address lootBoxAddress,
        uint256 tokenId,
        uint256 amount
    ) external onlyOwner {
        _mint(lootBoxAddress, tokenId, amount, "");
    }
    
    function mintStarterPackForLootBox(address lootBoxAddress) external onlyOwner {
        uint256[] memory tokenIds = new uint256[](4);
        uint256[] memory amounts = new uint256[](4);
        
        tokenIds[0] = SWORD;
        tokenIds[1] = SHIELD;
        tokenIds[2] = POTION;
        tokenIds[3] = GEM;
        
        amounts[0] = 10; // 10 swords
        amounts[1] = 15; // 15 shields
        amounts[2] = 50; // 50 potions
        amounts[3] = 5;  // 5 gems
        
        _mintBatch(lootBoxAddress, tokenIds, amounts, "");
    }
    
    function getItemName(uint256 tokenId) external view returns (string memory) {
        return itemNames[tokenId];
    }
    
    function setURI(string memory newUri) external onlyOwner {
        _setURI(newUri);
    }
    
    function getNextTokenId() external view returns (uint256) {
        return _tokenIdCounter.current();
    }
}