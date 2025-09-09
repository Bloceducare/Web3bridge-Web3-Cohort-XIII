pragma solidity ^0.8.19;

contract Lottery {
    uint256 public constant ENTRY_FEE = 0.01 ether;
    uint256 public constant MAX_PLAYERS = 10;
    
    address payable[] public players;
    mapping(address => bool) public hasEntered;
    uint256 public currentRound;
    address public lastWinner;
    uint256 public lastWinningAmount;
    
    event PlayerJoined(address indexed player, uint256 indexed round, uint256 totalPlayers);
    event WinnerSelected(address indexed winner, uint256 indexed round, uint256 prizeAmount);
    event LotteryReset(uint256 indexed newRound);
    
    constructor() {
        currentRound = 1;
    }
    
    function enterLottery() external payable {
        require(msg.value == ENTRY_FEE, "Exact entry fee of 0.01 ETH required");
        require(!hasEntered[msg.sender], "Player has already entered this round");
        require(players.length < MAX_PLAYERS, "Lottery round is full");
        
        players.push(payable(msg.sender));
        hasEntered[msg.sender] = true;
        
        emit PlayerJoined(msg.sender, currentRound, players.length);
        
        if (players.length == MAX_PLAYERS) {
            _selectWinner();
        }
    }
    
    function _selectWinner() private {
        require(players.length == MAX_PLAYERS, "Need exactly 10 players");
        
        uint256 randomIndex = uint256(
            keccak256(
                abi.encodePacked(
                    block.difficulty,
                    block.timestamp,
                    block.number,
                    players
                )
            )
        ) % players.length;
        
        address payable winner = players[randomIndex];
        uint256 prizeAmount = address(this).balance;
        
        lastWinner = winner;
        lastWinningAmount = prizeAmount;
        
        winner.transfer(prizeAmount);
        
        emit WinnerSelected(winner, currentRound, prizeAmount);
        
        _resetLottery();
    }
    
    function _resetLottery() private {
        for (uint256 i = 0; i < players.length; i++) {
            hasEntered[players[i]] = false;
        }
        delete players;
        
        currentRound++;
        
        emit LotteryReset(currentRound);
    }
    
    function getPlayersCount() external view returns (uint256) {
        return players.length;
    }
    
    function getPlayers() external view returns (address payable[] memory) {
        return players;
    }
    
    function getPrizePool() external view returns (uint256) {
        return address(this).balance;
    }
    
    function getLotteryInfo() external view returns (
        uint256 _currentRound,
        uint256 _playersCount,
        uint256 _prizePool,
        address _lastWinner,
        uint256 _lastWinningAmount
    ) {
        return (
            currentRound,
            players.length,
            address(this).balance,
            lastWinner,
            lastWinningAmount
        );
    }
    
    function hasPlayerEntered(address player) external view returns (bool) {
        return hasEntered[player];
    }
}
