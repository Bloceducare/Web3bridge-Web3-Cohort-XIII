// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Lottery {
    event PlayerJoined(address indexed player, uint256 playerId);
    event WinnerPaid(address indexed winner, uint256 amount);
    event LotteryReset(uint256 newLotteryId);

    struct User {
        string name;
        uint256 id;
        bool hasJoined;
    }

    mapping(address => User) public users;
    address public manager;
    address payable[] public players;
    uint256 public lotteryId;
    uint256 public prizePool;
    uint256 private playerId;
    uint256 public ticketPrice = 0.1 ether;
    uint256 public maxPlayers = 10;

    modifier onlyManager() {
        require(msg.sender == manager, "Not authorized");
        _;
    }

    constructor() {
        manager = msg.sender;
        lotteryId = 1;
        playerId = 0;
    }

    function joinLottery(string memory _name) external payable {
        require(msg.value == ticketPrice, "Must send exactly 0.1 ether");
        require(players.length < maxPlayers, "Lottery is full");
        require(!users[msg.sender].hasJoined, "Already joined");

        playerId += 1;
        users[msg.sender] = User(_name, playerId, true);
        players.push(payable(msg.sender));
        prizePool += msg.value;

        emit PlayerJoined(msg.sender, playerId);

        if (players.length == maxPlayers) {
            payWinner();
        }
    }

    function payWinner() private {
        require(players.length == maxPlayers, "Lottery not full");

        uint256 randomIndex = getRandomNumber() % players.length;
        address payable winner = players[randomIndex];
        winner.transfer(prizePool);

        emit WinnerPaid(winner, prizePool);

        resetLottery();
    }

    function resetLottery() private {
        delete players;
        prizePool = 0;
        lotteryId += 1;
        emit LotteryReset(lotteryId);
    }

    function emergencyReset() external onlyManager {
        for (uint256 i = 0; i < players.length; i++) {
            users[players[i]].hasJoined = false;
        }
        resetLottery();
    }

    function getRandomNumber() private view returns (uint256) {
        // Replace with Chainlink VRF for production
        return uint256(
            keccak256(abi.encodePacked(block.timestamp, block.prevrandao, msg.sender))
        );
    }

    receive() external payable {}
    fallback() external payable {}
}
