// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Lottery {
    uint256 public constant ENTRY_FEE = 0.01 ether;
    uint256 public constant MAX_PLAYERS = 10;
    
    address public owner;
    address[] public players;
    address public winner;
    uint256 public prizePool;
    uint256 public lotteryRound;
    bool public lotteryActive;
    
    event PlayerJoined(address indexed player, uint256 round, uint256 playerCount);
    event WinnerSelected(address indexed winner, uint256 amount, uint256 round);
    event LotteryReset(uint256 newRound);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier lotteryIsActive() {
        require(lotteryActive, "Lottery is not active");
        _;
    }
    
    modifier correctEntryFee() {
        require(msg.value == ENTRY_FEE, "Entry fee must be exactly 0.01 ETH");
        _;
    }
    
    modifier canJoin() {
        require(players.length < MAX_PLAYERS, "Lottery is full");
        require(!hasPlayerJoined(msg.sender), "Player already joined this round");
        _;
    }
    
    modifier canSelectWinner() {
        require(players.length == MAX_PLAYERS, "Need exactly 10 players to select winner");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        lotteryRound = 1;
        lotteryActive = true;
    }
    
    function joinLottery() 
        external 
        payable 
        lotteryIsActive 
        correctEntryFee 
        canJoin 
    {
        players.push(msg.sender);
        prizePool += msg.value;
        emit PlayerJoined(msg.sender, lotteryRound, players.length);
        
        if (players.length == MAX_PLAYERS) {
            _selectWinner();
        }
    }
    
    function _selectWinner() internal canSelectWinner {
        require(players.length == MAX_PLAYERS, "Need exactly 10 players");
        
        uint256 randomIndex = _generateRandomNumber() % players.length;
        winner = players[randomIndex];
        uint256 winnings = prizePool;
        prizePool = 0;
        
        (bool success, ) = payable(winner).call{value: winnings}("");
        require(success, "Failed to transfer winnings to winner");
        
        emit WinnerSelected(winner, winnings, lotteryRound);
        _resetLottery();
    }
    
    function _generateRandomNumber() private view returns (uint256) {
        return uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp,
                    block.prevrandao,
                    block.number,
                    players.length,
                    players[0],
                    players[players.length - 1]
                )
            )
        );
    }
    
    function _resetLottery() internal {
        delete players;
        winner = address(0);
        lotteryRound++;
        emit LotteryReset(lotteryRound);
    }
    
    function hasPlayerJoined(address player) public view returns (bool) {
        for (uint256 i = 0; i < players.length; i++) {
            if (players[i] == player) {
                return true;
            }
        }
        return false;
    }
    
    function getPlayers() external view returns (address[] memory) {
        return players;
    }
    
    function getPlayerCount() external view returns (uint256) {
        return players.length;
    }
    
    function getPrizePool() external view returns (uint256) {
        return prizePool;
    }
    
    function getLotteryInfo() external view returns (
        uint256 playerCount,
        uint256 currentPrizePool,
        uint256 currentRound,
        bool isActive,
        address currentWinner
    ) {
        return (
            players.length,
            prizePool,
            lotteryRound,
            lotteryActive,
            winner
        );
    }
    
    function setLotteryActive(bool _active) external onlyOwner {
        lotteryActive = _active;
    }
    
    function emergencyWithdraw() external onlyOwner {
        require(!lotteryActive, "Cannot withdraw while lottery is active");
        
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner).call{value: balance}("");
        require(success, "Emergency withdrawal failed");
    }
    
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    receive() external payable {
        revert("Use joinLottery() function to participate");
    }
    
    fallback() external payable {
        revert("Function does not exist");
    }
}
