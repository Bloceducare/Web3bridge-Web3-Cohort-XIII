// SPDX-License-Idetifier: MIT
pragma solidity ^0.8.28;

import "./RandomNumberGenerator.sol";
import "./Token.sol";
// import "./MultiToken.sol";
import {GameERC721} from "./NFT.sol";

contract GameBox {
    RandomNumberGenerator private generator;

    constructor(uint64 subscriptionId) {
        generator = new RandomNumberGenerator(0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B);
        Token token = new Token();
        GameERC721 nfts = new GameERC721();
    }

    enum KeyType {
        BRONZE,
        SILVER,
        GOLD
    }
    struct Key {
        uint keyId;
        KeyType _keyType;
        bool isValid;
    }
    struct Reward{
        RewardType rewardsTypes,
    }
    uint private counter = 1000;
    uint256 BASE_VALUE = 1096 gwei;
    mapping(address => mapping(uint => Key)) usersKeys;
    mapping(address => mapping(uint => Reward)) allUserRewards;
    error INVALID_TIER_PAYMENT(uint);
    error INVALID_KEY(uint);
    event OpenBox(address indexed userAddress, uint indexed keyId);

    function getKey(KeyType keyType) external payable returns (Key memory) {
        counter = counter + 1;
        bool isValidPrice;
        uint finalValue = BASE_VALUE;
        if (keyType == KeyType.BRONZE) {
            isValidPrice = true;
        } else if (keyType == KeyType.SILVER) {
            finalValue = (BASE_VALUE * 17) / 10;
            isValidPrice = true;
        } else if (keyType == KeyType.GOLD) {
            finalValue = (BASE_VALUE * 25) / 10;
            isValidPrice = true;
        }
        if (!isValidPrice) revert INVALID_TIER_PAYMENT(msg.value);
        Key memory newKey = Key(counter, keyType, true);
        usersKeys[msg.sender][newKey.keyId] = newKey;
        return newKey;
    }

    event RewardGiven(address indexed receiver, uint indexed keyId);

    function openBox(uint keyId) external {
        emit OpenBox(msg.sender, keyId);
        Key memory key = usersKeys[msg.sender][keyId];
        require(key.isValid, INVALID_KEY(keyId));
        
        uint randomNumber = generator.getRandomResult();
        uint mod;
        uint div;
        if (key._keyType == KeyType.BRONZE) {
            mod= uint16(randomNumber%10);
            token.mint(msg.sender,mod);
            emit RewardGiven(msg.sender,KeyId);
            
            Reward memory reward = Reward(KeyType.BRONZE,keyId);
            allUserRewards[msg.sender][keyId]= reward;
            return reward;
        }
        if(key._keyType== KeyType.SILVER){
            mod= uint16(randomNumber%100);
            div = mod%2;
            div==1?token.mint(msg.sender,mod): {
                token.mint(msg.sender, mod/2);
                nfts.mint(msg.sender,counter);
            }
             emit RewardGiven(msg.sender,KeyId);
            Reward memory reward = Reward(KeyType.SILVER,keyId);
            allUserRewards[msg.sender][keyId]= reward;
            return reward;
        }
    }

    receive() external payable {}

    fallback() external {}
}
