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

contract Lottery is VRFConsumerBaseV2, ERC721Holder, ERC1155Holder, Ownable {
    uint playerId;
    // Minimum age for lottery
    uint age = 18;
    bool lotteryStatus;

    bool lotteryEnded;

    
    uint constant MAX_PATICIPANTS = 100;
    uint constant TICKET_PRICE = 1 ether;

    address lotteryAdmin;


    Participant[] participants;

    struct Participant {
    uint timeAdded;
    uint lotteryCard;
    address playerAddress;
    }

    event ParticipantAdded(address participant);

    event LotteryStarted(bool status, uint timeStart);
    event RequestSent(uint256 requestId, uint32 numWords);
    event RequestFulfilled(uint256 requestId, uint256[] randomWords);

    //Request status
    struct RequestStatus {
            bool fulfilled;
            bool exists; 
            uint256[] randomWords;
        }
        
    VRFCoordinatorV2Interface immutable COORDINATOR;

    // VRF variables 
    uint64 immutable s_subscriptionId;
    bytes32 immutable s_keyHash;
    uint32 constant CALLBACK_GAS_LIMIT = 2500000;
    uint16 constant REQUEST_CONFIRMATIONS = 3;
    uint32 constant NUM_WORDS = 2;
    uint256 public lastRequestId;
    mapping(uint256 => RequestStatus) private s_requests;

    error UNAUTHORIZED();
    error PARTICIPANTS_NOT_ENOUGH_TO_START();
    error LOTTERY_HAS_ENDED(); 
    error LOTTERY_ALREADY_ACTIVE();
    error MAXIMUM_PARTICIPANTS_REACHED();
    error LOTTERY_HAS_STARTED_ALREADY();
    error UNDER_18_NOT_ALLOWED();
    error MINIMUM_TICKET_PRICE_IS_ZERO_POINT_ONE(); 
    error LOTTERY_GAME_NOT_YET_ACTIVE(); 
    error UNAUTHORIZED_ACCESS();


    // Constructor with all the paremeter needed for Chainlink VRF
    constructor() VRFConsumerBaseV2(0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D){
            COORDINATOR = VRFCoordinatorV2Interface(0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D);
            s_keyHash = 0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15;
            lotteryAdmin = msg.sender;
            s_subscriptionId = 110480411800820891056131360445572987550901839224631202975750477337957201679626;
    }

    function startLottery() external {
        if (msg.sender != lotteryAdmin) revert UNAUTHORIZED();
        if (lotteryStatus) revert LOTTERY_ALREADY_ACTIVE();
        if (lotteryEnded) revert LOTTERY_HAS_ENDED(); 
        if (participants.length < 10) revert PARTICIPANTS_NOT_ENOUGH_TO_START();
        lotteryStatus = true;
    }

    function endLottery() external {
        require(msg.sender == lotteryAdmin, "Unauthorized");
        require(lotteryStatus, "Lottery Game hasn't started");
        require(!lotteryEnded, "Lottery already ended");
        lotteryEnded = true;
        playerId = 0;
    }

    function participate(uint _age) external payable {
    if (msg.value != TICKET_PRICE) revert MINIMUM_TICKET_PRICE_IS_ZERO_POINT_ONE(); 
    if (age < _age) revert UNDER_18_NOT_ALLOWED();
    if (lotteryStatus != false) revert LOTTERY_HAS_STARTED_ALREADY();
    if (participants.length > 100) revert MAXIMUM_PARTICIPANTS_REACHED();
    
    playerId++;

    Participant memory _participant;
    _participant.timeAdded = block.timestamp;
    _participant.lotteryCard = playerId;
    _participant.playerAddress = msg.sender;

    participants.push(_participant);

    //emit an event that player has been added
    emit ParticipantAdded(msg.sender);
    }

    //Request for random value
    function requestRandomWords() external returns (uint256 requestId) {
        requestId = COORDINATOR.requestRandomWords(
            s_keyHash,
            s_subscriptionId,
            REQUEST_CONFIRMATIONS,
            CALLBACK_GAS_LIMIT,
            NUM_WORDS
        );
         s_requests[requestId] = RequestStatus({
            randomWords: new uint256[](0),
            exists: true,
            fulfilled: false
        });

        lastRequestId = requestId;
        emit RequestSent(requestId, NUM_WORDS);
        return requestId;
    }

    function fulfillRandomWords(
        uint256 _requestId,
        uint256[] memory _randomWords
    ) internal override {
        require(s_requests[_requestId].exists, "request not found");
        s_requests[_requestId].fulfilled = true;
        s_requests[_requestId].randomWords = _randomWords;
        emit RequestFulfilled(_requestId, _randomWords);
    }

    function getRequestStatus(
        uint256 _requestId
    ) external view returns (bool fulfilled, uint256[] memory randomWords) {
        require(s_requests[_requestId].exists, "request not found");
        RequestStatus memory request = s_requests[_requestId];
        return (request.fulfilled, request.randomWords);
    }

    function pickWinner() external payable returns (Participant memory winner) {
        if (lotteryStatus) revert LOTTERY_GAME_NOT_YET_ACTIVE(); 
        if (msg.sender != lotteryAdmin) revert UNAUTHORIZED_ACCESS(); 


        RequestStatus memory _request = s_requests[lastRequestId];
        uint randomWinner = _request.randomWords[0] % participants.length;

        winner = participants[randomWinner];
    }

}