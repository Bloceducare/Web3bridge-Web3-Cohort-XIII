// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {VRFConsumerBaseV2Plus} from "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import {VRFV2PlusClient} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";

contract Lottery is VRFConsumerBaseV2Plus {
    uint256 public entryFee;
    address public operator;
    uint256 public playerCount;

    uint256 s_subscriptionId;
    address vrfCoordinator = 0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B;
    bytes32 s_keyHash = 0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae;
    uint32 callbackGasLimit = 40000;
    uint16 requestConfirmations = 3;
    uint32 numWords =  1;
    uint256 private constant SHUFFLE_IN_PROGRESS = 42;

    address[] public playersList;
    mapping(address => bool) private hasEntered; 
    address public winner;

    mapping(uint256 => bool) private requestInProgress;

    event PlayerJoined(address indexed player, uint256 indexed roundIndex);
    event WinnerPicked(address indexed winner, uint256 prize);

    error NotAuthorized();
    error AlreadyEntered();
    error WrongFee();
    error LotteryNotFull();

    constructor(uint256 _entryFee, uint256 subscriptionId) VRFConsumerBaseV2Plus(vrfCoordinator) {
        entryFee = _entryFee;
        operator = msg.sender;
        s_subscriptionId = subscriptionId;
    }

    function enterLottery() public payable {
        if (msg.value != entryFee) revert WrongFee();
        if (hasEntered[msg.sender]) revert AlreadyEntered();

        playersList.push(msg.sender);
        hasEntered[msg.sender] = true;
        playerCount++;

        emit PlayerJoined(msg.sender, playerCount);

        if (playerCount == 10) {
            _requestRandomWinner();
        }
    }

    function _requestRandomWinner() internal {
        uint256 requestId = s_vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: s_keyHash,
                subId: s_subscriptionId,
                requestConfirmations: requestConfirmations,
                callbackGasLimit: callbackGasLimit,
                numWords: numWords,
                extraArgs: VRFV2PlusClient._argsToBytes(
                    VRFV2PlusClient.ExtraArgsV1({nativePayment: true})
                )
            })
        );
        requestInProgress[requestId] = true;
    }

    function fulfillRandomWords(uint256 requestId, uint256[] calldata randomWords) internal override {
        require(requestInProgress[requestId], "No such request");

        uint256 winnerIndex = randomWords[0] % playersList.length;
        winner = playersList[winnerIndex];

        uint256 prize = address(this).balance;

        
        (bool sent, ) = payable(winner).call{value: prize}("");
        require(sent, "Transfer failed");

        emit WinnerPicked(winner, prize);

        resetLottery();
    }

    function resetLottery() internal {
        for (uint256 i = 0; i < playersList.length; i++) {
            hasEntered[playersList[i]] = false;
        }
        delete playersList;
        playerCount = 0;
        winner = address(0);
    }
}
