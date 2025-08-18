// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;
import {VRFConsumerBaseV2Plus} from "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import {VRFV2PlusClient} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract Lottery is VRFConsumerBaseV2Plus {
    event RequestSent(uint256 requestId, uint32 numWords);
    event RequestFulfilled(uint256 requestId, uint256[] randomWords);

    struct RequestStatus {
        bool fulfilled;
        bool exists;
        uint256[] randomWords;
    }
    mapping(uint256 => RequestStatus) public s_requests;
    mapping(uint256 => address) randomWordsRequester;

    uint256 public s_subscriptionId= 29703966656442337173088917262431293237395885812298371556720325877494783664422;

    address[] players;
    mapping(address => bool) inGame;

    event PlayerJoined(address player);
    event Winner(address winner);

    bytes32 public keyHash =
        0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae;

    uint32 public callbackGasLimit = 200000;

    uint16 public requestConfirmations = 3;

    uint32 public numWords = 1;

    

    // Past request IDs.
    uint256[] public requestIds;
    uint256 public lastRequestId;
    
    constructor()
        VRFConsumerBaseV2Plus(0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B)
    {}

    function joinLottery() external payable {
        require(
            msg.value == 0.01 ether,
            "Pay exactly 0.01 ether to join lottery"
        );
        require(!inGame[msg.sender], "Already in game");
        players.push(msg.sender);
        inGame[msg.sender] = true;
        emit PlayerJoined(msg.sender);

        if (players.length >= 10) {
            requestRandomWords(true, msg.sender);
        }
    }

    function pickWinner(uint256 _random) private returns (address) {
        uint256 winnerIndex = _random % 10;
        emit Winner(msg.sender);
        return players[winnerIndex];
    }

    function requestRandomWords(
        bool enableNativePayment,
        address sender
    ) internal returns (uint256 requestId) {
        // Will revert if subscription is not set and funded.
        requestId = s_vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: keyHash,
                subId: s_subscriptionId,
                requestConfirmations: requestConfirmations,
                callbackGasLimit: callbackGasLimit,
                numWords: numWords,
                extraArgs: VRFV2PlusClient._argsToBytes(
                    VRFV2PlusClient.ExtraArgsV1({
                        nativePayment: enableNativePayment
                    })
                )
            })
        );
        s_requests[requestId] = RequestStatus({
            randomWords: new uint256[](0),
            exists: true,
            fulfilled: false
        });
        requestIds.push(requestId);
        lastRequestId = requestId;
        emit RequestSent(requestId, numWords);
        randomWordsRequester[requestId] = sender;
        return requestId;
    }

    function fulfillRandomWords(
        uint256 _requestId,
        uint256[] calldata _randomWords
    ) internal override {
        require(s_requests[_requestId].exists, "request not found");
        s_requests[_requestId].fulfilled = true;
        s_requests[_requestId].randomWords = _randomWords;
        pickWinner(_randomWords[0]);
        emit RequestFulfilled(_requestId, _randomWords);
    }

    function getRequestStatus(
        uint256 _requestId
    ) external view returns (bool fulfilled, uint256[] memory randomWords) {
        require(s_requests[_requestId].exists, "request not found");
        RequestStatus memory request = s_requests[_requestId];
        return (request.fulfilled, request.randomWords);
    }
}

