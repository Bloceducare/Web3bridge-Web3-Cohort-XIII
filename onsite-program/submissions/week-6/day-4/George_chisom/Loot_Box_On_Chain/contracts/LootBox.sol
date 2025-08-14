// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

import "../libraries/Data.sol";
import "../interfaces/TokenInterfaces.sol";

contract LootBox {

  Data.Rewards[] public userRewards;

  Data.Users[] public userData;

  mapping (address => Data.Rewards[]) public allUsers;

  uint256 public boxOpenFee = 0.05 ether;

  uint256 public counter = 0;

  address private owner;

  address private admin;

  address  public user;

  constructor (address _extraAdmin) {
    owner = msg.sender;
    admin = _extraAdmin;
  }

  modifier onlyAdmins(address _admin) {
    if (msg.sender != owner || _admin != admin) {
        revert Data.Not_authorized();
    }
    _;
  }

    receive() external payable {}

    function add_rewards(uint256 initialWeight) external onlyAdmins(admin) {

        if (initialWeight < 0) {
            revert Data.INVALID_WEIGHT();
        }

        if (initialWeight > 100) {
            revert Data.INVALID_WEIGHT();
        }

        uint256 ERC20_WEIGHT_LIMIT = 40;
        uint256 ERC712_WEIGHT_LIMIT = 70;
        uint256 ERC1155_WEIGHT_LIMIT = 100;
            
            
        uint256[] memory weightsToProcess = new uint256[](3);
        weightsToProcess[0] = 25; 
        weightsToProcess[1] = 50;
        weightsToProcess[2] = 85; 

        address ERC20_TOKEN = 0x5FbDB2315678afecb367f032d93F642f64180aa3;
        address ERC721_TOKEN = 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512;
        address ERC1155_TOKEN = 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0;

        for (uint256 i = 0; i < weightsToProcess.length; i++) {

            uint256 currentWeight = weightsToProcess[i];
                
            counter++;

            if (currentWeight <= ERC20_WEIGHT_LIMIT) {
                Data.Rewards memory rewards = Data.Rewards(counter, currentWeight, Data.RewardType.ERC20, ERC20_TOKEN, 0, 100 );
                userRewards.push(rewards);
                emit Data.RewardAdded(currentWeight, rewards.reward_type, rewards.amount);
            } else if (currentWeight <= ERC712_WEIGHT_LIMIT) {
                Data.Rewards memory rewards = Data.Rewards(counter, currentWeight, Data.RewardType.ERC721, ERC721_TOKEN, counter, 1 );
                userRewards.push(rewards);
                emit Data.RewardAdded(currentWeight, rewards.reward_type, rewards.amount);
            } else if (currentWeight <= ERC1155_WEIGHT_LIMIT) {
                Data.Rewards memory rewards = Data.Rewards(counter, currentWeight, Data.RewardType.ERC1155, ERC1155_TOKEN, 1, 10 );
                userRewards.push(rewards);
                emit Data.RewardAdded(currentWeight, rewards.reward_type, rewards.amount);
            }
        }

        emit Data.RewardsHistory(weightsToProcess.length, counter);

    }

    function UpdateBoxOpenFee(uint256 newFee) external {
        if (msg.sender != owner) {
            revert Data.Only_Owner_Can_Perform_This_Action();
        }
        boxOpenFee = newFee;

        emit Data.LootBoxFeeChanged(msg.sender, newFee);
    }

    function PayForLootBox(address _user, uint256 _amount) external payable {

        counter++;

    
        if (_user == address(0)) {
            revert Data.InvalidAccountId();
        } else if (msg.value < boxOpenFee || _amount < boxOpenFee) {
            revert Data.Insufficient_Funds();
        }

        payable(owner).transfer(msg.value);

        uint256 rand = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, counter))) % 3;

        Data.Users memory newData = Data.Users(counter, 0, rand);

        userData.push(newData);
        
        emit Data.Deposited(msg.sender, msg.value);
    }

    function distributeReward(uint256 _rewardIndex, address payable _to) external onlyAdmins(admin) {
        // Check if reward index is valid
        if (_rewardIndex >= userRewards.length) {
            revert Data.Invalid_reward_parameters();
        }
        
        // Get the reward from userRewards array
        Data.Rewards memory reward = userRewards[_rewardIndex];
        
        if (reward.reward_type == Data.RewardType.ERC20) {
            IRewardERC20(reward.tokenAddress).transferReward(_to, reward.amount);
            emit Data.RewardDistributed(_to, reward.amount);
            
        } else if (reward.reward_type == Data.RewardType.ERC721) {
            IRewardERC721(reward.tokenAddress).safeMint(_to);
            emit Data.RewardDistributedNft(_to, 1, reward.tokenId);
            
        } else if (reward.reward_type == Data.RewardType.ERC1155) {
            IRewardERC1155(reward.tokenAddress).transferReward(
                _to,
                reward.tokenId,
                reward.amount,
                ""
            );
            emit Data.RewardDistributed1155(_to, reward.amount, reward.tokenId);
            
        } else {
            revert Data.Invalid_reward_parameters();
        }

        // Add reward to user's personal reward history
        allUsers[_to].push(reward);
    }

    // Alternative function to distribute multiple rewards at once
    function distributeMultipleRewards(uint256[] memory _rewardIndexes, address payable _to) external onlyAdmins(admin) {
        for (uint256 i = 0; i < _rewardIndexes.length; i++) {
            uint256 rewardIndex = _rewardIndexes[i];
            
            // Check if reward index is valid
            if (rewardIndex >= userRewards.length) {
                revert Data.Invalid_reward_parameters();
            }
            
        
            Data.Rewards memory reward = userRewards[rewardIndex];
            
            if (reward.reward_type == Data.RewardType.ERC20) {
                IRewardERC20(reward.tokenAddress).transferReward(_to, reward.amount);
                emit Data.RewardDistributed(_to, reward.amount);
                
            } else if (reward.reward_type == Data.RewardType.ERC721) {
                IRewardERC721(reward.tokenAddress).safeMint(_to);
                emit Data.RewardDistributedNft(_to, 1, reward.tokenId);
                
            } else if (reward.reward_type == Data.RewardType.ERC1155) {
                IRewardERC1155(reward.tokenAddress).transferReward(
                    _to,
                    reward.tokenId,
                    reward.amount,
                    ""
                );
                emit Data.RewardDistributed1155(_to, reward.amount, reward.tokenId);
            }

            
            allUsers[_to].push(reward);
        }
    }

    
    function getReward(uint256 _index) external view returns (Data.Rewards memory) {
        require(_index < userRewards.length, "Invalid reward index");
        return userRewards[_index];
    }

    
    function getTotalRewards() external view returns (uint256) {
        return userRewards.length;
    }

    
    function getUserRewards(address _user) external view returns (Data.Rewards[] memory) {
        return allUsers[_user];
    }
}