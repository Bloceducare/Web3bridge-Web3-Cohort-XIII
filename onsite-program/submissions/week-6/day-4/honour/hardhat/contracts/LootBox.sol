// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {VRFConsumerBaseV2} from "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import {VRFCoordinatorV2Interface} from "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import {IERC1155Receiver} from "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";


contract LootBox is VRFConsumerBaseV2, IERC721Receiver, IERC1155Receiver {
    using Address for address payable;

    enum RewardType { ERC20, ERC721, ERC1155 }

    struct Reward {
        RewardType rType;        
        address token;          
        uint256 id;              
        uint256 amount;          
        uint96 weight;          
        bool active;             
    }
    
    address public owner;
    address public treasury;
    uint256 public boxFee; 

   
    VRFCoordinatorV2Interface public immutable COORDINATOR;
    uint64 public immutable subscriptionId;
    bytes32 public immutable keyHash;
    uint16 public constant REQUEST_CONFIRMATIONS = 3;
    uint32 public callbackGasLimit = 350_000;

    // State
    Reward[] public rewards;
    uint256 public totalWeight; 

    mapping(uint256 => address) public openerOf;      
    mapping(uint256 => uint256) public randomOf;      

    // Events
    event BoxOpened(address indexed user, uint256 indexed requestId, uint256 feePaid);
    event VRFRequested(uint256 indexed requestId);
    event VRFFulfilled(uint256 indexed requestId, uint256 randomWord);
    event RewardDispensed(uint256 indexed requestId, address indexed to, uint256 rewardIndex, RewardType rType, address token, uint256 id, uint256 amount);
    event RewardAdded(uint256 indexed index, RewardType rType, address token, uint256 id, uint256 amount, uint96 weight);
    event RewardUpdated(uint256 indexed index, bool active, uint96 newWeight);
    event RewardRemoved(uint256 indexed index);
    event FeeUpdated(uint256 newFee);
    event TreasuryUpdated(address indexed newTreasury);
    event Withdrawn(address indexed to, uint256 amount);

    // Errors
    error NotOwner();
    error InvalidFee();
    error NoRewards();
    error InventoryShort();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(
        address _vrfCoordinator,
        uint64 _subId,
        bytes32 _keyHash,
        uint256 _boxFee,
        address _treasury
    ) VRFConsumerBaseV2(_vrfCoordinator) {
        owner = msg.sender;
        treasury = _treasury == address(0) ? msg.sender : _treasury;
        boxFee = _boxFee;
        COORDINATOR = VRFCoordinatorV2Interface(_vrfCoordinator);
        subscriptionId = _subId;
        keyHash = _keyHash;
    }

    // --- Admin ---
    function setFee(uint256 _fee) external onlyOwner {
        boxFee = _fee;
        emit FeeUpdated(_fee);
    }

    function setTreasury(address _t) external onlyOwner {
        treasury = _t;
        emit TreasuryUpdated(_t);
    }

    function setCallbackGasLimit(uint32 gasLimit) external onlyOwner { callbackGasLimit = gasLimit; }

    function addReward(RewardType rType, address token, uint256 id, uint256 amount, uint96 weight) external onlyOwner returns (uint256 idx) {
        rewards.push(Reward({rType: rType, token: token, id: id, amount: amount, weight: weight, active: true}));
        idx = rewards.length - 1;
        totalWeight += weight;
        emit RewardAdded(idx, rType, token, id, amount, weight);
    }

    function updateReward(uint256 index, bool active, uint96 newWeight) external onlyOwner {
        Reward storage r = rewards[index];
        if (r.active) { totalWeight -= r.weight; }
        r.active = active;
        r.weight = newWeight;
        if (active) { totalWeight += newWeight; }
        emit RewardUpdated(index, active, newWeight);
    }

    function removeReward(uint256 index) external onlyOwner {
        Reward memory r = rewards[index];
        if (r.active) { totalWeight -= r.weight; }
        uint256 last = rewards.length - 1;
        if (index != last) {
            rewards[index] = rewards[last];
        }
        rewards.pop();
        emit RewardRemoved(index);
    }

    function withdrawETH(uint256 amount) external onlyOwner {
        (bool ok, ) = treasury.call{value: amount}("");
        require(ok, "withdraw failed");
        emit Withdrawn(treasury, amount);
    }

    // --- User ---
    function openBox() external payable returns (uint256 requestId) {
        if (msg.value != boxFee) revert InvalidFee();
        if (totalWeight == 0) revert NoRewards();
        requestId = COORDINATOR.requestRandomWords(
            keyHash,
            subscriptionId,
            REQUEST_CONFIRMATIONS,
            callbackGasLimit,
            1
        );
        openerOf[requestId] = msg.sender;
        emit BoxOpened(msg.sender, requestId, msg.value);
        emit VRFRequested(requestId);
    }

    // --- VRF callback ---
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        uint256 rand = randomWords[0];
        randomOf[requestId] = rand;
        emit VRFFulfilled(requestId, rand);

        // select reward by weight
        uint256 target = rand % totalWeight;
        uint256 running;
        uint256 index;
        Reward memory selected;
        for (uint256 i = 0; i < rewards.length; i++) {
            Reward memory r = rewards[i];
            if (!r.active || r.weight == 0) continue;
            running += r.weight;
            if (target < running) { selected = r; index = i; break; }
        }

        _dispense(openerOf[requestId], index, selected);
    }

    function _dispense(address to, uint256 index, Reward memory r) internal {
        if (r.rType == RewardType.ERC20) {
            uint256 bal = IERC20(r.token).balanceOf(address(this));
            if (bal < r.amount) revert InventoryShort();
            require(IERC20(r.token).transfer(to, r.amount), "ERC20 transfer failed");
        } else if (r.rType == RewardType.ERC721) {
            // contract must own the NFT
            IERC721(r.token).safeTransferFrom(address(this), to, r.id);
        } else {
            // ERC1155
            uint256 bal = IERC1155(r.token).balanceOf(address(this), r.id);
            if (bal < r.amount) revert InventoryShort();
            IERC1155(r.token).safeTransferFrom(address(this), to, r.id, r.amount, "");
        }
        emit RewardDispensed(0, to, index, r.rType, r.token, r.id, r.amount);
    }

    // --- Views ---
    function rewardCount() external view returns (uint256) { return rewards.length; }

    // --- Receivers ---
    function onERC721Received(address, address, uint256, bytes calldata) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }

    function onERC1155Received(address, address, uint256, uint256, bytes calldata) external pure override returns (bytes4) {
        return IERC1155Receiver.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(address, address, uint256[] calldata, uint256[] calldata, bytes calldata) external pure override returns (bytes4) {
        return IERC1155Receiver.onERC1155BatchReceived.selector;
    }

    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return interfaceId == type(IERC1155Receiver).interfaceId || interfaceId == type(IERC721Receiver).interfaceId;
    }

    receive() external payable {}
}