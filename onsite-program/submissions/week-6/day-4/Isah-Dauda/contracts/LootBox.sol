// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IVRFCoordinatorV2} from "./interfaces/IVRFCoordinatorV2.sol";
import {IERC20} from "./interfaces/IERC20.sol";
import {IERC721} from "./interfaces/IERC721.sol";
import {IERC721Receiver} from "./interfaces/IERC721Receiver.sol";
import {IERC1155} from "./interfaces/IERC1155.sol";
import {IERC1155Receiver} from "./interfaces/IERC1155Receiver.sol";
import {IERC165} from "./interfaces/IERC165.sol";

import {Ownable} from "./common/Ownable.sol";
import {ReentrancyGuard} from "./common/ReentrancyGuard.sol";
import {Errors} from "./common/Errors.sol";
import {LibSafeTransfer} from "./common/LibSafeTransfer.sol";

contract LootBox is Ownable, ReentrancyGuard, IERC721Receiver, IERC1155Receiver {
    using LibSafeTransfer for IERC20;

    uint16 public constant REQUEST_CONFIRMATIONS = 3;
    uint32 public constant NUM_WORDS = 1;

    // FOR THE VRF SETUP
    IVRFCoordinatorV2 public immutable vrfCoordinator;
    bytes32 public immutable keyHash;
    uint64  public immutable subscriptionId;
    uint32  public immutable callbackGasLimit;

    uint256 public openingFee;

    enum RewardType { ERC20, ERC721, ERC1155 }

    struct RewardItem {
        RewardType rType;
        address token;
        uint256 id;     
        uint256 amount; 
        uint96  weight; 
    }

    RewardItem[] private _rewards;
    uint256 private _totalWeight;

    mapping(uint256 => bool) private _active;

    mapping(uint256 => address) private _requestToOpener;

    event LootBoxOpened(uint256 indexed requestId, address indexed user);
    event RewardDistributed(uint256 indexed requestId, address indexed user, RewardType rewardType, address token, uint256 id, uint256 amount);
    event RewardAdded(uint256 indexed rewardIndex, RewardItem reward);
    event RewardRemoved(uint256 indexed rewardIndex);
    event FeeUpdated(uint256 newFee);

    constructor(
        address _coordinator,
        bytes32 _keyHash,
        uint64  _subId,
        uint32  _callbackGasLimit,
        uint256 _initialFee
    ) {
        if (_coordinator == address(0)) revert Errors.ZeroAddress();
        vrfCoordinator = IVRFCoordinatorV2(_coordinator);
        keyHash = _keyHash;
        subscriptionId = _subId;
        callbackGasLimit = _callbackGasLimit;
        openingFee = _initialFee;
    }

    function updateFee(uint256 newFee) external onlyOwner {
        openingFee = newFee;
        emit FeeUpdated(newFee);
    }


    function depositERC20(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) revert Errors.ZeroAddress();
        bool ok = IERC20(token).transferFrom(msg.sender, address(this), amount);
        if (!ok) revert Errors.ERC20TransferFailed(token, address(this), amount);
    }

    function withdrawETH(address payable to, uint256 amount) external onlyOwner {
        if (to == address(0)) revert Errors.ZeroAddress();
        (bool ok,) = to.call{value: amount}("");
        require(ok, "ETH withdraw failed");
    }

       function addReward(RewardItem calldata item) external onlyOwner {
        if (item.weight == 0) revert Errors.ZeroWeight();
        uint256 idx = _rewards.length;
        _rewards.push(item);
        _active[idx] = true;
        _totalWeight += item.weight;
        emit RewardAdded(idx, item);
    }

    function removeReward(uint256 index) external onlyOwner {
        uint256 len = _rewards.length;
        if (index >= len || !_active[index]) revert Errors.InvalidRewardIndex();

     
        _totalWeight -= _rewards[index].weight;

        uint256 last = len - 1;
        if (index != last) {
            _rewards[index] = _rewards[last];
            _active[index] = _active[last];
        }
        _rewards.pop();
        _active[last] = false;
        emit RewardRemoved(index);
    }

  
    function openLootBox() external payable nonReentrant returns (uint256 requestId) {
        if (_totalWeight == 0) revert Errors.NoRewardsConfigured();
        if (msg.value != openingFee) revert Errors.InvalidFee(openingFee, msg.value);

        requestId = vrfCoordinator.requestRandomWords(
            keyHash,
            subscriptionId,
            REQUEST_CONFIRMATIONS,
            callbackGasLimit,
            NUM_WORDS
        );
        _requestToOpener[requestId] = msg.sender;
        emit LootBoxOpened(requestId, msg.sender);
    }

    function rawFulfillRandomWords(uint256 requestId, uint256[] calldata randomWords) external {
        if (msg.sender != address(vrfCoordinator)) revert Errors.VRFOnlyCoordinator();
        _fulfillRandomWords(requestId, randomWords);
    }


    function _fulfillRandomWords(uint256 requestId, uint256[] calldata randomWords) internal {
        address opener = _requestToOpener[requestId];


        delete _requestToOpener[requestId];

        if (opener == address(0)) return;

        uint256 rand = randomWords.length > 0 ? randomWords[0] : uint256(keccak256(abi.encodePacked(block.timestamp, requestId)));
        uint256 winning = rand % _totalWeight;

        // Iterate through active rewards and pick the one where cumulative weight crosses 'winning'
        uint256 cumulative = 0;
        uint256 chosenIndex = type(uint256).max;

        uint256 len = _rewards.length;
        for (uint256 i = 0; i < len; ) {
            if (_active[i]) {
                uint96 w = _rewards[i].weight;
                cumulative += w;
                if (winning < cumulative) {
                    chosenIndex = i;
                    break;
                }
            }
            unchecked { i++; }
        }

        if (chosenIndex == type(uint256).max) {
            // No active reward found somehow; just return quietly
            return;
        }

        RewardItem memory reward = _rewards[chosenIndex];

        if (reward.rType == RewardType.ERC20) {
            IERC20(reward.token).safeTransferERC20(opener, reward.amount);
            emit RewardDistributed(requestId, opener, reward.rType, reward.token, 0, reward.amount);
        } else if (reward.rType == RewardType.ERC721) {
            
            IERC721(reward.token).safeTransferFrom(address(this), opener, reward.id);
            
            emit RewardDistributed(requestId, opener, reward.rType, reward.token, reward.id, 1);
        } else {
            
            IERC1155(reward.token).safeTransferFrom(address(this), opener, reward.id, reward.amount, "");
            emit RewardDistributed(requestId, opener, reward.rType, reward.token, reward.id, reward.amount);
        }
    }

    // Basic View Functions
    function totalWeight() external view returns (uint256) { return _totalWeight; }
    function rewardCount() external view returns (uint256) { return _rewards.length; }
    function getReward(uint256 index) external view returns (RewardItem memory) { return _rewards[index]; }
    function isActive(uint256 index) external view returns (bool) { return _active[index]; }

    // Not going to forge these Checkers!
    function onERC721Received(address, address, uint256, bytes calldata) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }

    function onERC1155Received(address, address, uint256, uint256, bytes calldata) external pure override returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(address, address, uint256[] calldata, uint256[] calldata, bytes calldata) external pure override returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }


    function supportsInterface(bytes4 interfaceId) external pure override returns (bool) {
        return
            interfaceId == type(IERC165).interfaceId ||
            interfaceId == type(IERC1155Receiver).interfaceId;
    }

    // Finally the receive and Fallback even thoug Fallback is optional
    receive() external payable {}
    fallback() external payable {}
}

    //Now we test and see wonders
