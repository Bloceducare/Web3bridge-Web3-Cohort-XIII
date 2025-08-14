//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IERC1155.sol";
import {VRFConsumerBaseV2Plus} from "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import {VRFV2PlusClient} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";

contract MysteryBox is VRFConsumerBaseV2Plus{
    IERC1155 public erc1155;
    IERC721 public erc721;
    IERC20 public erc20;

    uint256 public openFee;
    address public operator;

    uint256 s_subscriptionId;
    address vrfCoordinator = 0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B;
    bytes32 s_keyHash = 0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae;
    uint32 callbackGasLimit = 40000;
    uint16 requestConfirmations = 3;
    uint32 numWords =  1;
    uint256 private constant SHUFFLE_IN_PROGRESS = 42;

    constructor(uint256 _openFee,
     address _erc1155, 
     address _erc721,
     address _erc20,
     uint256 subscriptionId) VRFConsumerBaseV2Plus(vrfCoordinator){
        erc1155 = IERC1155(_erc1155);
        erc721 = IERC721(_erc721);
        erc20 = IERC20(_erc20);

        openFee = _openFee;
        operator = msg.sender;
        s_subscriptionId = subscriptionId;    
    }

    mapping(address => bool) isOpen;
    mapping(uint256 => address) private participantRequestId;
    mapping(address => uint256) private participantResult;

    event rewardShuffle (uint256 indexed requestId, address indexed participant);
    event rewardResult (uint256 indexed requestId, uint256 indexed result);


    error NotAuthorized();
    error NotFound();


    function OpenBox (address participant) public payable{
        require(openFee == msg.value, "Not the right amount to open a box");

        isOpen[participant] = true;
        payable(operator).transfer(msg.value);
    }


    function generateReward(address participant) public onlyOwner returns (uint256 requestId) {
        require(participantResult[participant] == 0, "Already requested");
        require(isOpen[participant] == true, "You need to make payment first");

       requestId = s_vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: s_keyHash,
                subId: s_subscriptionId,
                requestConfirmations: requestConfirmations,
                callbackGasLimit: callbackGasLimit,
                numWords: numWords,
                extraArgs: VRFV2PlusClient._argsToBytes(VRFV2PlusClient.ExtraArgsV1({nativePayment: true}))
            })
        );

        participantRequestId[requestId] = participant;
        participantResult[participant] = SHUFFLE_IN_PROGRESS;
        emit rewardShuffle(requestId, participant);
    }


    function fulfillRandomWords(uint256 requestId, uint256[] calldata randomWords) internal override {
        uint256 value;
        uint256 random = randomWords[0] % 100;
        if(random < 50) value = 1; 
        else if(random < 80) value = 2; 
        else value = 3; 

        participantResult[participantRequestId[requestId]] = value;

        emit rewardResult(requestId, value);
    }

    function reward(address participant) public view returns (string memory) {
        require(participantResult[participant] != 0, "No request made to open box");

        require(participantResult[participant] != SHUFFLE_IN_PROGRESS, "shuffling in progress");

        return getRewardWeight(participantResult[participant]);
    }

    function getRewardWeight(uint256 id) private pure returns (string memory) {
        string[3] memory rewardWeight = [
           "GOLD",
           "SILVER",
           "DIAMOND"    
        ];
        return rewardWeight[id - 1];
    }

     function safeTransferFrom(address _operator, address participant, uint256 _id, uint256 _value, bytes calldata _data) public payable {
        if(_operator != operator ){
            revert NotAuthorized();
        }
        if(participantRequestId[_id] == address(0)){
            revert NotFound();
        }

        uint256 resultType = participantResult[participant];

        if (resultType == 1) {
            erc20.transfer(participant, _value);

        } else if (resultType == 2) {
            erc721.safeTransferFrom(address(this), participant, _id);

        } else if (resultType == 3) {
            erc1155.safeTransferFrom(address(this), participant, _id, _value, _data);

        } else {
            revert("Invalid result type");
        }
    }

    receive() external payable {}
}