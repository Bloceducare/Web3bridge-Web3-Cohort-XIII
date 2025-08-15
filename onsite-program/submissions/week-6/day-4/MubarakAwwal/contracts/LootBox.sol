// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IRandomGenerator {
    function requestRandomWords() external returns (uint256);
    function getRandomWords(uint256 requestId) external view returns (uint256);
}

interface IERC721Receiver {
    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data) external returns (bytes4);
}

interface IERC1155ReceiverLite {
    function onERC1155Received(address operator, address from, uint256 id, uint256 value, bytes calldata data) external returns (bytes4);
    function onERC1155BatchReceived(address operator, address from, uint256[] calldata ids, uint256[] calldata values, bytes calldata data) external returns (bytes4);
}

contract LootBox is IERC721Receiver, IERC1155ReceiverLite {
    address public owner;
    IRandomGenerator public rng;
    uint256 public fee;

    struct Reward {
        address token;
        uint256 id;
        uint256 amount;
        uint8 tokenType; // 0=ERC20, 1=ERC721, 2=ERC1155
        uint256 weight;
    }

    Reward[] public rewards;
    uint256 public totalWeight;
    uint256 public collectedFees;

    event RewardAdded(address token, uint256 id, uint256 amount, uint8 tokenType, uint256 weight);
    event BoxOpened(address indexed user, uint256 requestId);
    event RewardGiven(address indexed user, address token, uint256 id, uint256 amount, uint8 tokenType);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _rng, uint256 _fee) {
        owner = msg.sender;
        rng = IRandomGenerator(_rng);
        fee = _fee;
    }

    function addReward(address token, uint256 id, uint256 amount, uint8 tokenType, uint256 weight) external onlyOwner {
        require(weight > 0, "Weight must be > 0");
        rewards.push(Reward(token, id, amount, tokenType, weight));
        totalWeight += weight;
        emit RewardAdded(token, id, amount, tokenType, weight);
    }

    function openBox() external payable {
        require(msg.value == fee, "Incorrect fee");
        collectedFees += msg.value;

        uint256 requestId = rng.requestRandomWords();
        uint256 rand = rng.getRandomWords(requestId) % totalWeight;
        uint256 cumulative = 0;

        for (uint256 i = 0; i < rewards.length; i++) {
            cumulative += rewards[i].weight;
            if (rand < cumulative) {
                _giveReward(msg.sender, rewards[i]);
                emit RewardGiven(msg.sender, rewards[i].token, rewards[i].id, rewards[i].amount, rewards[i].tokenType);
                break;
            }
        }

        emit BoxOpened(msg.sender, requestId);
    }

    function _giveReward(address to, Reward memory reward) internal {
        if (reward.tokenType == 0) {
            (bool sent,) = reward.token.call(abi.encodeWithSignature("transfer(address,uint256)", to, reward.amount));
            require(sent, "ERC20 transfer failed");
        } else if (reward.tokenType == 1) {
            (bool sent,) = reward.token.call(abi.encodeWithSignature("safeTransferFrom(address,address,uint256)", address(this), to, reward.id));
            require(sent, "ERC721 transfer failed");
        } else if (reward.tokenType == 2) {
            (bool sent,) = reward.token.call(abi.encodeWithSignature("safeTransferFrom(address,address,uint256,uint256,bytes)", address(this), to, reward.id, reward.amount, ""));
            require(sent, "ERC1155 transfer failed");
        }
    }

    function withdrawFees() external onlyOwner {
        uint256 amount = collectedFees;
        collectedFees = 0;
        (bool sent,) = payable(owner).call{value: amount}("");
        require(sent, "Withdraw failed");
    }

    // ERC721 & ERC1155 receiver functions
    function onERC721Received(address, address, uint256, bytes calldata) external pure override returns (bytes4) {
        return this.onERC721Received.selector;
    }

    function onERC1155Received(address, address, uint256, uint256, bytes calldata) external pure override returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(address, address, uint256[] calldata, uint256[] calldata, bytes calldata) external pure override returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }
}
