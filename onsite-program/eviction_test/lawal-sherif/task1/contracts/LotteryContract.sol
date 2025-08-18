// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract Lottery {
    struct Participant {
        uint256 id;
        address account;
        string name;
    }
    
    address public owner;
    uint256 public currentRound;
    uint256 public playerCount;
    uint256 constant ENTRY_FEE = 0.01 ether;
    uint256 constant MAX_PLAYERS = 10;
    
    mapping(uint256 => Participant) public participants;
    mapping(address => bool) public hasJoinedCurrentRound;
    
    event PlayerJoined(address indexed player, string name, uint256 round, uint256 playerNumber);
    event WinnerSelected(address indexed winner, uint256 prizeAmount, uint256 round);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier validEntry() {
        require(msg.value == ENTRY_FEE, "Must pay exactly 0.01 ETH to enter");
        require(playerCount < MAX_PLAYERS, "Maximum players reached");
        require(!hasJoinedCurrentRound[msg.sender], "Cannot join twice in the same round");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        currentRound = 1;
        playerCount = 0;
    }
    function register(string memory _name) external payable validEntry {
        participants[playerCount] = Participant({
            id: playerCount,
            account: msg.sender,
            name: _name
        });
        
        hasJoinedCurrentRound[msg.sender] = true;
        playerCount++;
        
        emit PlayerJoined(msg.sender, _name, currentRound, playerCount);
        if (playerCount == MAX_PLAYERS) {
            _selectWinnerInternal();
        }
    }
    function getAllParticipants() external view returns (Participant[] memory) {
        Participant[] memory allParticipants = new Participant[](playerCount);
        
        for (uint256 i = 0; i < playerCount; i++) {
            allParticipants[i] = participants[i];
        }
        
        return allParticipants;
    }
    
    function selectWinner() external onlyOwner {
        require(playerCount == MAX_PLAYERS, "Need exactly 10 players to select winner");
        _selectWinnerInternal();
    }
    
    function resetLottery() external onlyOwner {
        for (uint256 i = 0; i < playerCount; i++) {
            hasJoinedCurrentRound[participants[i].account] = false;
            delete participants[i];
        }
        
        playerCount = 0;
        currentRound++;
    }
    
    function _selectWinnerInternal() internal {
        require(playerCount > 0, "No participants in current round");
        
        uint256 randomIndex = uint256(keccak256(abi.encodePacked(
            block.difficulty,
            currentRound,
            playerCount
        ))) % playerCount;
        
        address winner = participants[randomIndex].account;
        uint256 prizeAmount = address(this).balance;
        
        emit WinnerSelected(winner, prizeAmount, currentRound);
        
        payable(winner).transfer(prizeAmount);
        
        for (uint256 i = 0; i < playerCount; i++) {
            hasJoinedCurrentRound[participants[i].account] = false;
            delete participants[i];
        }
        
        playerCount = 0;
        currentRound++;
    }
}