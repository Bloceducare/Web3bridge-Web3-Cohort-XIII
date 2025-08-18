// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

contract LotteryContract {
    uint256 public constant ENTRY_FEE = 0.0001 ether;
    uint256 public constant MAX_PLAYERS = 10;
    address[] public players;
    bool public isActive;
    
    event PlayerEntered(address indexed player, uint256 amount);
    event WinnerSelected(address indexed winner, uint256 amount);

    constructor() {
        isActive = true;
    }

    function enter() external payable {
        require(isActive, "Lottery is not active");
        require(msg.value == ENTRY_FEE, "Incorrect entry fee");
        require(players.length < MAX_PLAYERS, "Lottery is full");
        require(!isPlayer(msg.sender), "Already entered this round");

        players.push(msg.sender);
        emit PlayerEntered(msg.sender, msg.value);

        if (players.length == MAX_PLAYERS) {
            selectWinner();
        }
    }

    function selectWinner() private {
        require(players.length == MAX_PLAYERS, "Not enough players");
        
        uint256 random = uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, players.length)));
        uint256 winnerIndex = random % MAX_PLAYERS;
        address payable winner = payable(players[winnerIndex]);
        
        uint256 prize = address(this).balance;
        winner.transfer(prize);
        emit WinnerSelected(winner, prize);
 
        delete players;
        isActive = true;
    }

    function isPlayer(address _player) private view returns (bool) {
        for (uint256 i = 0; i < players.length; i++) {
            if (players[i] == _player) return true;
        }
        return false;
    }

    function getPlayers() external view returns (address[] memory) {
        return players;
    }
}