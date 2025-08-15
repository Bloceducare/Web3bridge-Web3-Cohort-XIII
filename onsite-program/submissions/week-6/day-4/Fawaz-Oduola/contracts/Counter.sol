// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract LootBox {
    enum Reward {
        ERC20,
        ERC721,
        ERC1155
    }
    Reward[] private rewards = [Reward.ERC20, Reward.ERC721, Reward.ERC1155];
    mapping(Reward => int) RewardWeight;
    int immutable TOTAL_WEIGHT;

    constructor(int weightERC20, int weightERC721, int weightERC1155) {
        RewardWeight[Reward.ERC20] = weightERC20;
        RewardWeight[Reward.ERC721] = weightERC721;
        RewardWeight[Reward.ERC1155] = weightERC1155;
        TOTAL_WEIGHT =
            RewardWeight[Reward.ERC20] +
            RewardWeight[Reward.ERC721] +
            RewardWeight[Reward.ERC1155];
    }

    function openBox() external payable {
        if (msg.value < 1e17) {
            revert("pay at least 0.1 ETH");
        }
    }

    function getReward(int256 random) external view returns (string memory){
      return _pickWeightedRandom(random);
    }

    function _pickWeightedRandom(int256 random) internal view returns (string memory reward) {
      
      for (uint256 i; i < rewards.length; i++){
          random = random- RewardWeight[rewards[i]];
          if (random <=0){
            if(rewards[i]==Reward.ERC20){
              return "ERC20";
            }
            if(rewards[i]==Reward.ERC721){
              return "ERC721";
            }
            if(rewards[i]==Reward.ERC1155){
              return "ERC1155";
            }
            return "rewards[i]";
          }
      }
    }


    function _generateRandomNumber() internal returns(uint256){

    }
}