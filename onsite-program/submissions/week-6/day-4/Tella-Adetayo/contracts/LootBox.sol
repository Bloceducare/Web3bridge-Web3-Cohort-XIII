// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";



interface IMintableERC20 {
    function mint(address to, uint256 amount) external;
}
interface IMintableERC721 {
    function mint(address to, uint256 tokenId) external;
}
interface IMintableERC1155 {
    function mint(address to, uint256 id, uint256 amount, bytes calldata data) external;
}

contract LootBox is VRFConsumerBaseV2, ERC721Holder, ERC1155Holder, Ownable {
    using SafeERC20 for IERC20;

    enum KeyType { BRONZE, SILVER, GOLD }

    struct Key {
        uint256 keyId;  
        KeyType keyType;   
        bool used;
    }

    uint256 public constant BRONZE_PRICE = 0.01 ether;
    uint256 public constant SILVER_PRICE = 0.05 ether;
    uint256 public constant GOLD_PRICE   = 0.10 ether;
    uint256 public nextKeyId = 1;

    mapping(address => Key) public keys;

    enum TokenKind { ERC20, ERC721, ERC1155 }

    struct RewardSpec {
        TokenKind kind;        // which standard
        address token;         // token contract address
        uint256 tokenId;       // for ERC721/1155
        uint256 amount;        // ERC20 or ERC1155 quantity
        bool mintOnClaim;      // true => call mint, false => transfer from this contract
    }

    RewardSpec[] public rewardPool;

    // Fast type-index lists for weighted picking by key type
    uint256[] private idxERC20;
    uint256[] private idxERC721;
    uint256[] private idxERC1155;

    struct UserReward {
        TokenKind kind;
        address token;
        uint256 tokenId;
        uint256 amount;
    }
    mapping(address => UserReward) public ownerOfReward;

    uint32 private constant CALLBACK_GAS_LIMIT     = 200_000;
    uint16 private constant REQUEST_CONFIRMATIONS  = 3;
    uint32 private constant NUM_WORDS              = 1;

    bytes32 private immutable i_vrfKeyHash;
    address private immutable i_vrfCoordinatorV2;
    uint64  private immutable i_vrfSubscriptionId;

    mapping(uint256 => address) private s_requestToUser;

    event KeyBought(address indexed user, uint256 keyId, KeyType keyType, uint256 priceCharged);
    event OpenRequested(address indexed user, uint256 requestId);
    event RewardAdded(uint256 indexed index, RewardSpec spec);
    event RewardsClaimed(address indexed user, UserReward reward);

    constructor(
        RewardSpec[] memory initialRewards,
        bytes32 vrfKeyHash,
        address vrfCoordinatorV2,
        uint64 vrfSubscriptionId
    ) VRFConsumerBaseV2(vrfCoordinatorV2) Ownable(msg.sender) {
        i_vrfKeyHash        = vrfKeyHash;
        i_vrfCoordinatorV2  = vrfCoordinatorV2;
        i_vrfSubscriptionId = vrfSubscriptionId;

        // Optional: start with some rewards configured
        for (uint256 i = 0; i < initialRewards.length; i++) {
            _addRewardInternal(initialRewards[i]);
        }
    }

    function addReward(RewardSpec calldata spec) external onlyOwner {
        _addRewardInternal(spec);
    }

    function _addRewardInternal(RewardSpec memory spec) internal {
        require(spec.token != address(0), "Invalid token address");

        // Basic sanity: ERC20 must have amount > 0; ERC721 amount ignored; ERC1155 amount > 0
        if (spec.kind == TokenKind.ERC20) {
            require(spec.amount > 0, "ERC20 amount=0");
        } else if (spec.kind == TokenKind.ERC1155) {
            require(spec.amount > 0, "ERC1155 amount=0");
        }

        rewardPool.push(spec);
        uint256 idx = rewardPool.length - 1;

        if (spec.kind == TokenKind.ERC20) idxERC20.push(idx);
        else if (spec.kind == TokenKind.ERC721) idxERC721.push(idx);
        else idxERC1155.push(idx);

        emit RewardAdded(idx, spec);
    }

    /// Optional funding helpers for transfer-based rewards
    function fundERC20(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
    }
    function fundERC721(address token, uint256 tokenId) external onlyOwner {
        IERC721(token).safeTransferFrom(msg.sender, address(this), tokenId);
    }
    function fundERC1155(address token, uint256 id, uint256 amount) external onlyOwner {
        IERC1155(token).safeTransferFrom(msg.sender, address(this), id, amount, "");
    }

    // Buy keys 
    function buyKey() external payable {
        require(msg.value >= BRONZE_PRICE, "Insufficient payment");

        // assign key type by price tiers
        KeyType kt;
        uint256 price = BRONZE_PRICE;
        if (msg.value < SILVER_PRICE) {
            kt = KeyType.BRONZE;
            price = BRONZE_PRICE;
        } else if (msg.value < GOLD_PRICE) {
            kt = KeyType.SILVER;
            price = SILVER_PRICE;
        } else {
            kt = KeyType.GOLD;
            price = GOLD_PRICE;
        }

        // overwrite any previous key (keeps things simple)
        keys[msg.sender] = Key({ keyId: nextKeyId, keyType: kt, used: false });
        emit KeyBought(msg.sender, nextKeyId, kt, price);
        nextKeyId++;

        // refund any excess
        if (msg.value > price) {
            unchecked {
                payable(msg.sender).transfer(msg.value - price);
            }
        }
    }

    function openBox() external {
        Key storage k = keys[msg.sender];
        require(k.keyId != 0, "No key");
        require(!k.used, "Key used");
        require(rewardPool.length > 0, "No rewards configured");

        // Consume the key up-front
        k.used = true;

        uint256 requestId = VRFCoordinatorV2Interface(i_vrfCoordinatorV2).requestRandomWords(
            i_vrfKeyHash,
            i_vrfSubscriptionId,
            REQUEST_CONFIRMATIONS,
            CALLBACK_GAS_LIMIT,
            NUM_WORDS
        );

        s_requestToUser[requestId] = msg.sender;
        emit OpenRequested(msg.sender, requestId);
    }

    // Chainlink VRF callback
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        address user = s_requestToUser[requestId];
        require(user != address(0), "Unknown request");

        Key memory k = keys[user];
        require(k.used, "Key not used"); // sanity

        // pick target token type by key-weight, then pick a random reward of that type
        TokenKind target = _pickTargetKind(k.keyType, randomWords[0]);

        // find an actual reward entry of that kind; fallback if empty
        (bool ok, uint256 rewardIdx) = _pickRewardIndexOfKind(target, randomWords[0]);
        if (!ok) {
            // fallback path: try the other allowed types (bronze excludes ERC1155)
            if (k.keyType == KeyType.BRONZE) {
                // prefer ERC721, then ERC20
                (ok, rewardIdx) = _pickRewardIndexOfKind(TokenKind.ERC721, randomWords[0]);
                if (!ok) (ok, rewardIdx) = _pickRewardIndexOfKind(TokenKind.ERC20, randomWords[0]);
            } else if (k.keyType == KeyType.SILVER) {
                // try 721 -> 1155 -> 20
                (ok, rewardIdx) = _pickRewardIndexOfKind(TokenKind.ERC721, randomWords[0]);
                if (!ok) (ok, rewardIdx) = _pickRewardIndexOfKind(TokenKind.ERC1155, randomWords[0]);
                if (!ok) (ok, rewardIdx) = _pickRewardIndexOfKind(TokenKind.ERC20, randomWords[0]);
            } else {
                // gold: 1155 -> 721 -> 20
                (ok, rewardIdx) = _pickRewardIndexOfKind(TokenKind.ERC1155, randomWords[0]);
                if (!ok) (ok, rewardIdx) = _pickRewardIndexOfKind(TokenKind.ERC721, randomWords[0]);
                if (!ok) (ok, rewardIdx) = _pickRewardIndexOfKind(TokenKind.ERC20, randomWords[0]);
            }
            require(ok, "No eligible rewards");
        }

        RewardSpec memory spec = rewardPool[rewardIdx];

        // Bronze must never receive ERC1155: if somehow chosen, fallback to ERC721/20
        if (k.keyType == KeyType.BRONZE && spec.kind == TokenKind.ERC1155) {
            // try 721 then 20
            (ok, rewardIdx) = _pickRewardIndexOfKind(TokenKind.ERC721, randomWords[0]);
            if (!ok) (ok, rewardIdx) = _pickRewardIndexOfKind(TokenKind.ERC20, randomWords[0]);
            require(ok, "No bronze-eligible rewards");
            spec = rewardPool[rewardIdx];
        }

        // deliver the reward (mint or transfer)
        UserReward memory ur = _deliverReward(user, spec);
        ownerOfReward[user] = ur;

        emit RewardsClaimed(user, ur);
    }

    function _pickTargetKind(KeyType kt, uint256 rand) internal pure returns (TokenKind) {
        // use 0..99
        uint256 r = rand % 100;

        if (kt == KeyType.BRONZE) {
            // 50% ERC721, 50% ERC20 (never 1155)
            return (r < 50) ? TokenKind.ERC721 : TokenKind.ERC20;
        } else if (kt == KeyType.SILVER) {
            // 60% 721, 30% 20, 10% 1155
            if (r < 60) return TokenKind.ERC721;
            if (r < 90) return TokenKind.ERC20;
            return TokenKind.ERC1155;
        } else {
            // GOLD: 50% 1155, 30% 721, 20% 20
            if (r < 50) return TokenKind.ERC1155;
            if (r < 80) return TokenKind.ERC721;
            return TokenKind.ERC20;
        }
    }

    function _pickRewardIndexOfKind(TokenKind kind, uint256 rand) internal view returns (bool, uint256) {
        uint256[] memory list =
            (kind == TokenKind.ERC20) ? idxERC20 :
            (kind == TokenKind.ERC721) ? idxERC721 : idxERC1155;

        if (list.length == 0) return (false, 0);
        uint256 pos = rand % list.length;
        return (true, list[pos]);
    }

    function _deliverReward(address to, RewardSpec memory spec) internal returns (UserReward memory ur) {
        if (spec.mintOnClaim) {
            if (spec.kind == TokenKind.ERC20) {
                IMintableERC20(spec.token).mint(to, spec.amount);
                ur = UserReward(TokenKind.ERC20, spec.token, 0, spec.amount);
            } else if (spec.kind == TokenKind.ERC721) {
                // NOTE: your mintable 721 must accept an explicit tokenId (or adjust to auto-mint)
                IMintableERC721(spec.token).mint(to, spec.tokenId);
                ur = UserReward(TokenKind.ERC721, spec.token, spec.tokenId, 1);
            } else {
                IMintableERC1155(spec.token).mint(to, spec.tokenId, spec.amount, "");
                ur = UserReward(TokenKind.ERC1155, spec.token, spec.tokenId, spec.amount);
            }
        } else {
            if (spec.kind == TokenKind.ERC20) {
                IERC20(spec.token).safeTransfer(to, spec.amount);
                ur = UserReward(TokenKind.ERC20, spec.token, 0, spec.amount);
            } else if (spec.kind == TokenKind.ERC721) {
                IERC721(spec.token).safeTransferFrom(address(this), to, spec.tokenId);
                ur = UserReward(TokenKind.ERC721, spec.token, spec.tokenId, 1);
            } else {
                IERC1155(spec.token).safeTransferFrom(address(this), to, spec.tokenId, spec.amount, "");
                ur = UserReward(TokenKind.ERC1155, spec.token, spec.tokenId, spec.amount);
            }
        }
    }

    function getUserKey(address account) external view returns (Key memory) {
        return keys[account];
    }

    function getUserReward(address account) external view returns (UserReward memory) {
        return ownerOfReward[account];
    }

    function rewardPoolLength() external view returns (uint256) {
        return rewardPool.length;
    }
}
