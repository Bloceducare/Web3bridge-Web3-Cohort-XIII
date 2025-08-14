// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

/**
 * @title Mock ERC20 Token for testing
 */
contract MockERC20 is ERC20 {
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) ERC20(name, symbol) {
        _mint(msg.sender, initialSupply);
    }
    
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

/**
 * @title Mock ERC721 NFT for testing
 */
contract MockERC721 is ERC721 {
    uint256 private _tokenIdCounter;
    
    constructor(
        string memory name,
        string memory symbol
    ) ERC721(name, symbol) {}
    
    function mint(address to, uint256 tokenId) external {
        _mint(to, tokenId);
    }
    
    function safeMint(address to) external returns (uint256) {
        uint256 tokenId = _tokenIdCounter++;
        _safeMint(to, tokenId);
        return tokenId;
    }
}

/**
 * @title Mock ERC1155 Multi-Token for testing
 */
contract MockERC1155 is ERC1155 {
    constructor(string memory uri) ERC1155(uri) {}
    
    function mint(
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) external {
        _mint(to, id, amount, data);
    }
    
    function mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) external {
        _mintBatch(to, ids, amounts, data);
    }
}

/**
 * @title Mock VRF Coordinator for testing
 */
contract MockVRFCoordinatorV2 {
    uint64 private s_currentSubId = 0;
    uint256 private s_requestId = 1;
    
    mapping(uint64 => mapping(address => bool)) public s_consumers;
    mapping(uint256 => address) private s_requestIdToConsumer;
    
    event SubscriptionCreated(uint64 indexed subId, address owner);
    event ConsumerAdded(uint64 indexed subId, address consumer);
    event RandomWordsRequested(
        bytes32 indexed keyHash,
        uint256 requestId,
        uint256 preSeed,
        uint64 indexed subId,
        uint16 minimumRequestConfirmations,
        uint32 callbackGasLimit,
        uint32 numWords,
        address indexed sender
    );
    
    function createSubscription() external returns (uint64) {
        s_currentSubId++;
        emit SubscriptionCreated(s_currentSubId, msg.sender);
        return s_currentSubId;
    }
    
    function addConsumer(uint64 subId, address consumer) external {
        s_consumers[subId][consumer] = true;
        emit ConsumerAdded(subId, consumer);
    }
    
    function requestRandomWords(
        bytes32 keyHash,
        uint64 subId,
        uint16 minimumRequestConfirmations,
        uint32 callbackGasLimit,
        uint32 numWords
    ) external returns (uint256 requestId) {
        require(s_consumers[subId][msg.sender], "Invalid consumer");
        
        requestId = s_requestId++;
        s_requestIdToConsumer[requestId] = msg.sender;
        
        emit RandomWordsRequested(
                    keyHash,
                    requestId,
                    0, // preSeed (mock value)
                    subId,
                    minimumRequestConfirmations,
                    callbackGasLimit,
                    numWords,
                    msg.sender
                );
            }
        }