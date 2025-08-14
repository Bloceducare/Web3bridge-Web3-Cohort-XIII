// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/interfaces.sol";

contract LootBox is Ownable {
    uint256 public constant FEE = 0.1 ether;
    address public immutable rewardERC20Address;
    address public immutable rewardERC721Address;
    address public immutable rewardERC1155Address;
    uint256 public constant ERC20_AMOUNT = 100 * 10 ** 18; // Adjusted for ERC20 decimals
    uint256 public constant ERC1155_ID = 1;
    uint256 public constant ERC1155_AMOUNT = 1;
    uint256[] public WEIGHTS = [50, 30, 20];
    uint256 public constant TOTAL_WEIGHT = 100;
    uint256 private nonce;

    enum RewardType {
        ERC20,
        ERC721,
        ERC1155
    }

    struct UserReward {
        uint256 randomNumber;
        RewardType rewardType;
        uint256 rewardValue; // amount for ERC20/ERC1155, 0 for ERC721
    }

    mapping(address => UserReward) public userRewards;

    event BoxOpened(address indexed user, uint256 fee);
    event RandomNumberGenerated(address indexed user, uint256 randomNumber);
    event RewardIssued(
        address indexed user,
        RewardType rewardType,
        uint256 rewardValue
    );
    event Withdraw(address indexed owner, uint256 amount);

    constructor(
        address _rewardERC20,
        address _rewardERC721,
        address _rewardERC1155
    ) Ownable(msg.sender) {
        rewardERC20Address = _rewardERC20;
        rewardERC721Address = _rewardERC721;
        rewardERC1155Address = _rewardERC1155;
        nonce = 0;
    }

    function openBox() external payable {
        require(msg.value == FEE, "Incorrect fee");

        // Transfer fee to contract
        (bool sent, ) = address(this).call{value: FEE}("");
        require(sent, "Fee transfer failed");

        emit BoxOpened(msg.sender, FEE);

        nonce = nonce + 1;
        uint256 random = _getPseudoRandom();
        emit RandomNumberGenerated(msg.sender, random);

        uint256 weightedRandom = random % TOTAL_WEIGHT;

        uint256 cumulative = 0;
        RewardType selectedType;
        uint256 selectedValue = 0;

        for (uint256 i = 0; i < 3; i++) {
            cumulative += WEIGHTS[i];
            if (weightedRandom < cumulative) {
                selectedType = RewardType(i);
                break;
            }
        }

        if (selectedType == RewardType.ERC20) {
            IRewardERC20(rewardERC20Address).transferToWinner(
                msg.sender,
                ERC20_AMOUNT
            );
            selectedValue = ERC20_AMOUNT;
        } else if (selectedType == RewardType.ERC721) {
            IRewardERC721(rewardERC721Address).safeMint(msg.sender);
            selectedValue = 0; // No specific value for ERC721
        } else if (selectedType == RewardType.ERC1155) {
            IRewardERC1155(rewardERC1155Address).transferToWinner(
                msg.sender,
                ERC1155_ID,
                ERC1155_AMOUNT,
                ""
            );
            selectedValue = ERC1155_AMOUNT;
        }

        userRewards[msg.sender] = UserReward({
            randomNumber: random,
            rewardType: selectedType,
            rewardValue: selectedValue
        });

        emit RewardIssued(msg.sender, selectedType, selectedValue);
    }

    function _getPseudoRandom() internal view returns (uint256) {
        return
            uint256(
                keccak256(
                    abi.encodePacked(
                        block.timestamp,
                        block.prevrandao,
                        msg.sender,
                        nonce
                    )
                )
            );
    }

    function withdraw() external onlyOwner {
        uint256 amount = address(this).balance;
        require(amount > 0, "No funds to withdraw");
        payable(owner()).transfer(amount);
        emit Withdraw(owner(), amount);
    }
}
