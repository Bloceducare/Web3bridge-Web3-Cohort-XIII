// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

contract Lottery {
    address public owner;
    address public winner;
    enum PlayerStatus {Paid, NotPaid}
    
    struct Player {
        string name;
        PlayerStatus status;
        address playerAddress;
    }
    mapping(uint256 => address) numPlayers;
    uint256 public playerCount;
    uint256 public prize;
    uint256 public lotteryfee = 0.1 ETH;
    Player[] public players;

    
    event FeePaid(address indexed player);
    event PlayerCreated(string name, uint256 age);
    event PaidWinner(address indexed winner);

    constructor(){
        owner = _owner;
    }

    modifier onlyOwner(){
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    function payFeeandCreatePlayer(string memory name) external payable{
        require(msg.value >= lotteryfee, 'Incorrect amount has been paid' );
        if (msg.value > lotteryFee) {
            uint256 excess = msg.value - lotteryFee;
            payable(msg.sender).transfer(excess);
        }
        players.push(Player(
            name: _name,
            PlayerStatus:PlayerStatus.Paid.
            playerAddress: msg.sender
        ))
        playerCount++
        emit FeePaid(msg.sender)
        emit PlayerCreated(name, age)
    }
    function playLottery() external  returns(address) onlyOwner {
         uint256 currentCount = playerCount;
         require(currentCount = 10, "There needs to be ten players to play this");
         if (currentCount ==  10){
            uint256 winnerIndex = random() % currentCount;
            winner = players[winnerIndex].playerAddress;
            return winner;
         }
         _resetLottery();
         
    }

    function _resetLottery() internal {
        playerCount = 0;
    }
    function payWinner() external payable{
         address winner = playLottery();
         uint256 prize = (address(this).balance * 90) / 100;
         (payable(winner)).transfer(prize);
         emit PaidWinner (msg.sender);
    }

     function getPlayers() external view returns (Player[] memory) {
        return players;
    }
   
}