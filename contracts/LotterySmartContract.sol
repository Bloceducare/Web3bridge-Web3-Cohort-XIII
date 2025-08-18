// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";


contract LotterySmartContract is Ownable, ReentrancyGuard {
    uint256 public constant ENTRY_FEE = 0.01 ether;
    uint256 public constant MAX_PLAYERS = 10;
    
    address[] public players;
    mapping(address => bool) public hasJoined;
    
    uint256 public lotteryRound;
    uint256 public totalPrizePool;
    address public lastWinner;
    uint256 public lastWinningAmount;
    
    bool public lotteryActive;
    
    
    event PlayerJoined(address indexed player, uint256 round);
    event WinnerSelected(address indexed winner, uint256 amount, uint256 round);
    event LotteryReset(uint256 newRound);
    event PrizePoolUpdated(uint256 newAmount);
    
    error LotteryNotActive();
    error IncorrectEntryFee();
    error PlayerAlreadyJoined();
    error LotteryFull();
    error NoPlayersInLottery();
    error LotteryStillActive();
    error OnlyOwnerCanCall();
    
    constructor() {
        lotteryActive = true;
        lotteryRound = 1;
    }
    
   
    function joinLottery() external payable nonReentrant {
        if (!lotteryActive) revert LotteryNotActive();
        if (msg.value != ENTRY_FEE) revert IncorrectEntryFee();
        if (hasJoined[msg.sender]) revert PlayerAlreadyJoined();
        if (players.length >= MAX_PLAYERS) revert LotteryFull();
        
        players.push(msg.sender);
        hasJoined[msg.sender] = true;
        totalPrizePool += msg.value;
        
        emit PlayerJoined(msg.sender, lotteryRound);
        emit PrizePoolUpdated(totalPrizePool);
        
        if (players.length == MAX_PLAYERS) {
            _selectWinner();
        }
    }
    
   
    function _selectWinner() internal {
        if (players.length == 0) revert NoPlayersInLottery();
        
        uint256 randomIndex = uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp,
                    block.prevrandao,
                    players.length,
                    blockhash(block.number - 1)
                )
            )
        ) % players.length;
        
        address winner = players[randomIndex];
        uint256 winningAmount = totalPrizePool;
        
        lastWinner = winner;
        lastWinningAmount = winningAmount;
        
        (bool success, ) = payable(winner).call{value: winningAmount}("");
        require(success, "Transfer to winner failed");
        
        emit WinnerSelected(winner, winningAmount, lotteryRound);
        
        _resetLottery();
    }
    
    
    function _resetLottery() internal {
        for (uint256 i = 0; i < players.length; i++) {
            hasJoined[players[i]] = false;
        }
        delete players;
        
        totalPrizePool = 0;
        lotteryRound++;
        
        emit LotteryReset(lotteryRound);
    }
    
 
    function selectWinnerManually() external onlyOwner nonReentrant {
        if (players.length == 0) revert NoPlayersInLottery();
        _selectWinner();
    }
    
   
    function toggleLottery() external onlyOwner {
        lotteryActive = !lotteryActive;
    }
    
   
    function getPlayers() external view returns (address[] memory) {
        return players;
    }
    
    function getPlayerCount() external view returns (uint256) {
        return players.length;
    }
    
    
    function hasPlayerJoined(address player) external view returns (bool) {
        return hasJoined[player];
    }
    
   
    function getLotteryInfo() external view returns (
        uint256 currentRound,
        uint256 playerCount,
        uint256 prizePool,
        bool isActive,
        address winner,
        uint256 lastPrize
    ) {
        return (
            lotteryRound,
            players.length,
            totalPrizePool,
            lotteryActive,
            lastWinner,
            lastWinningAmount
        );
    }
    
    
    function emergencyWithdraw() external onlyOwner nonReentrant {
        if (lotteryActive) revert LotteryStillActive();
        
        uint256 balance = address(this).balance;
        if (balance > 0) {
            (bool success, ) = payable(owner()).call{value: balance}("");
            require(success, "Emergency withdrawal failed");
        }
    }
    
   
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
