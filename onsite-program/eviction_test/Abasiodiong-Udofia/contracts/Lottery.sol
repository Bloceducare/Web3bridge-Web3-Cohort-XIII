// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/ILottery.sol";
import "./interfaces/IVRFCoordinatorV2.sol";
import "./libraries/Errors.sol";

contract Lottery is ReentrancyGuard, Ownable, ILottery {
    uint256 public constant MAX_PLAYERS = 10;
    uint256 public immutable entryFee;
    address[] public players;
    address public winner;
    bool public isRandomnessPending;

    IVRFCoordinatorV2 public vrfCoordinator;
    bytes32 public keyHash;
    uint64 public subscriptionId;

    mapping(uint256 => bool) public requestFulfilled;

    constructor(
        address _vrfCoordinator,
        uint64 _subscriptionId,
        bytes32 _keyHash,
        uint256 _entryFee
    ) Ownable(msg.sender) {
        vrfCoordinator = IVRFCoordinatorV2(_vrfCoordinator);
        subscriptionId = _subscriptionId;
        keyHash = _keyHash;
        entryFee = _entryFee;
    }

    function join() external payable override nonReentrant {
        if (msg.value != entryFee) revert Errors.IncorrectFee(entryFee, msg.value);
        if (players.length >= MAX_PLAYERS) revert Errors.LotteryClosed();
        if (isRandomnessPending) revert Errors.RandomnessPending();

        for (uint256 i = 0; i < players.length; i++) {
            if (players[i] == msg.sender) revert Errors.AlreadyEntered();
        }

        players.push(msg.sender);
        emit PlayerJoined(msg.sender);

        if (players.length == MAX_PLAYERS) {
            _requestRandomness();
        }
    }

    function _requestRandomness() internal {
        isRandomnessPending = true;
        uint256 requestId = vrfCoordinator.requestRandomWords(
            keyHash,
            subscriptionId,
            3, 
            200000,
            1 
        );
        requestFulfilled[requestId] = false;
    }

    function rawFulfillRandomWords(uint256 requestId, uint256[] memory randomWords) external {
        if (msg.sender != address(vrfCoordinator)) revert Errors.OnlyAdmin(); 
        if (requestFulfilled[requestId]) revert Errors.RandomnessPending(); 

        requestFulfilled[requestId] = true;
        isRandomnessPending = false;

        uint256 random = randomWords[0] % MAX_PLAYERS;
        winner = players[random];

        uint256 prize = address(this).balance;
        (bool success, ) = winner.call{value: prize}("");
        if (!success) revert Errors.TransferFailed();

        emit WinnerSelected(winner, prize);

        
        delete players;
        winner = address(0);
    }

    function getPlayers() external view override returns (address[] memory) {
        return players;
    }

    function getWinner() external view override returns (address) {
        return winner;
    }

    function getPrizePool() external view override returns (uint256) {
        return address(this).balance;
    }

    function getEntryFee() external view override returns (uint256) {
        return entryFee;
    }

    function getPlayerCount() external view override returns (uint256) {
        return players.length;
    }
}