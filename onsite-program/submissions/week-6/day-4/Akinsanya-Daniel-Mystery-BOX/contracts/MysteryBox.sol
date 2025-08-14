// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;
import "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "../contracts/RewardNft.sol";
import "../contracts/RewardToken.sol";

contract MysteryBox is VRFConsumerBaseV2{
   error NOT_ADMIN(); 
   error INSUFFICIENT_FUNDS();


   struct Reward{
    uint256 id;
    RewardType rewardType;
    uint256 tokenId;
    uint256 amount;
    address tokenAddress;
    uint256 weight;
 }

   enum RewardType{
         NFT,
         Token,
         Item
   }

    struct Request{
        address requester;
        uint256 requestId;
        bool fulfilled;
    }

    uint64  subscriptionId;
    bytes32  keyHash;
    uint32  numWords = 1;
    uint256  boxFee;
    uint32   callbackGasLimit = 100000;
    uint16  requestConfirmations = 3;

    uint256 totalWeight;
    uint256 uuid;
    address admin;
    VRFCoordinatorV2Interface  immutable COORDINATOR;
    mapping(uint256 => Request)  pendingRequests;
    mapping(uint256 => Reward) rewards;
    Reward[] rewardList;

    RewardToken rewardToken;
    RewardNft rewardNft;

    constructor(address _vrfCoordinator,uint64 _subscriptionId,bytes32 _keyHash,uint256 _boxFee, address _token, address _nft) VRFConsumerBaseV2(_vrfCoordinator){
        COORDINATOR = VRFCoordinatorV2Interface(_vrfCoordinator);
        subscriptionId = _subscriptionId;
        keyHash = _keyHash;
        boxFee = _boxFee;
        admin = msg.sender;
        rewardToken = RewardToken(_token);
        rewardNft = RewardNft(_nft);

    }

    modifier onlyAdmin(){
        require(admin == msg.sender,NOT_ADMIN());
        _;
    }

    function addReward(RewardType _type,uint256 _tokenId, uint256 _amount,address _tokenAddress, uint256 _weight)external onlyAdmin(){
        Reward memory newReward;
        newReward.id = uuid +1;
        newReward.rewardType = _type;
        newReward.tokenId = _tokenId;
        newReward.amount = _amount;
        newReward.tokenAddress = _tokenAddress;
        newReward.weight = _weight;
        rewards[newReward.id] = newReward;
        rewardList.push(newReward);
        totalWeight += _weight;
        uuid++;
    }

    function getReward(uint256 rewardId) external view returns (Reward memory) {
        return rewards[rewardId];
    }

    function getAllRewards() external view returns (Reward[] memory) {
        return rewardList;
    }
    

    function updateRewardWeight(uint256 rewardId,uint256 newWeight)external onlyAdmin(){
        Reward storage reward = rewards[rewardId];
        totalWeight = totalWeight - reward.weight + newWeight;
        reward.weight = newWeight;
    }

    function setBoxFee(uint256 _boxFee)external onlyAdmin(){
        boxFee = _boxFee;
    }

    function openBox()external payable{
        require(msg.value >= boxFee, INSUFFICIENT_FUNDS());
        uint256 _requestId = COORDINATOR.requestRandomWords( keyHash, subscriptionId,requestConfirmations,callbackGasLimit,numWords);
        pendingRequests[_requestId] = Request({requester: msg.sender,requestId:_requestId,fulfilled: false});
    }


    
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override virtual{
        Request memory request = pendingRequests[requestId];
        require(!request.fulfilled, "Request already fulfilled");
        uint256 randomNumber = randomWords[0];
        uint256 weightedRandomNumber = randomNumber % totalWeight;
        Reward memory selectedReward;
        uint256 cumulativeWeight;
        for(uint256 i = 0; i < rewardList.length;i++){
            cumulativeWeight += rewardList[i].weight;
            if(weightedRandomNumber < cumulativeWeight){
                selectedReward = rewardList[i];
                break;
            }
        }

        if(selectedReward.rewardType == RewardType.Token ){
            rewardToken.transfer(request.requester, selectedReward.amount);

        }else if(selectedReward.rewardType == RewardType.NFT){
            rewardNft.mintRewards(request.requester, "https://example.com/tokenURI");
        }
          
        // }else if(selectedReward.rewardType == RewardType.Item){
        //     // Transfer Item logic
        // }
        request.fulfilled = true;
        pendingRequests[requestId] = request;

    }

    

    
    

}