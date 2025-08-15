// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// Import OpenZeppelin contracts for tokens
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";

contract LootBox is VRFConsumerBaseV2 {
    
    VRFCoordinatorV2Interface COORDINATOR;
    uint64 subscriptionId; // Your Chainlink VRF subscription ID
    address vrfCoordinator = 0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B;
    bytes32 keyHash = 0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae;
    uint32 callbackGasLimit = 40000;
    uint16 requestConfirmations = 3;
    uint32 numWords =  1;


    // Reward token contracts (set these to your deployed token addresses)
    IERC20 public erc20Token; // ERC20 token contract
    IERC721 public erc721Token; // ERC721 NFT contract
    IERC1155 public erc1155Token; // ERC1155 item contract

    // Loot box price (in wei, e.g., 0.01 ETH)
    uint256 public boxPrice = 0.01 ether;

    // Weighted reward chances (out of 100)
    uint256[] public rewardWeights = [50, 30, 20]; // 50% ERC20, 30% ERC1155, 20% ERC721
    uint256 public constant TOTAL_WEIGHT = 100;

    // Store pending requests
    mapping(uint256 => address) public requestToSender;

    // Events to log actions
    event BoxOpened(address indexed user, uint256 requestId);
    event RewardAssigned(address indexed user, string rewardType, uint256 amount);
    event FundsWithdrawn(address indexed owner, uint256 amount);

    // Owner of the contract
    address public owner;

    constructor(
        uint64 _subscriptionId,
        address _erc20Token,
        address _erc721Token,
        address _erc1155Token
    ) VRFConsumerBaseV2(vrfCoordinator) {
        COORDINATOR = VRFCoordinatorV2Interface(vrfCoordinator);
        subscriptionId = _subscriptionId;
        erc20Token = IERC20(_erc20Token);
        erc721Token = IERC721(_erc721Token);
        erc1155Token = IERC1155(_erc1155Token);
        owner = msg.sender;
    }

    // User opens a loot box by paying the box price
    function openBox() external payable {
        require(msg.value >= boxPrice, "Insufficient payment");
        uint256 requestId = COORDINATOR.requestRandomWords(
            keyHash,
            subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            numWords
        );
        requestToSender[requestId] = msg.sender;
        emit BoxOpened(msg.sender, requestId);
    }

    // Chainlink VRF calls this function with the random number
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        address user = requestToSender[requestId];
        require(user != address(0), "Request not found");

        // Pick reward based on random number and weights
        uint256 randomValue = randomWords[0] % TOTAL_WEIGHT;
        uint256 cumulativeWeight = 0;
        string memory rewardType;
        uint256 amount;

        for (uint256 i = 0; i < rewardWeights.length; i++) {
            cumulativeWeight += rewardWeights[i];
            if (randomValue < cumulativeWeight) {
                if (i == 0) {
                    // ERC20 reward (100 tokens)
                    rewardType = "ERC20";
                    amount = 100 * 10 ** 18; // Assuming 18 decimals
                    erc20Token.transfer(user, amount);
                } else if (i == 1) {
                    // ERC1155 reward (5 items, token ID 1)
                    rewardType = "ERC1155";
                    amount = 5;
                    erc1155Token.safeTransferFrom(address(this), user, 1, amount, "");
                } else {
                    // ERC721 reward (NFT with token ID = random number % 100)
                    rewardType = "ERC721";
                    amount = 1;
                    uint256 tokenId = randomWords[0] % 100;
                    erc721Token.safeTransferFrom(address(this), user, tokenId);
                }
                break;
            }
        }

        emit RewardAssigned(user, rewardType, amount);
        delete requestToSender[requestId];
    }

    // Owner can withdraw collected fees
    function withdraw() external {
        require(msg.sender == owner, "Not owner");
        uint256 amount = address(this).balance;
        payable(owner).transfer(amount);
        emit FundsWithdrawn(owner, amount);
    }

    // Fallback function to accept ETH
    receive() external payable {}
}