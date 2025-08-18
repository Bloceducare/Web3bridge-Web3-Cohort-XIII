// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;


contract Lottery {

    error INCORRECT_ENTRY_FEE();
    error ALREADY_ENTERED_THIS_ROUND();
    error NO_PLAYERS_FOUND();
    error ONLY_OWNER();
    error NEED_10_PLAYERS();


    event LotteryCreated(address indexed owner, uint256 entryFee);
    event PlayerEntered(address indexed player, uint256 amount);
    event WinnerPicked(address indexed winner, uint256 amount, uint256 round);


    address public owner;
    uint256 public entryFee;

    address[] public players;
    mapping(address => bool) public hasEntered;

    uint256 public constant MAX_PLAYERS = 10;
    uint256 public round;




    modifier onlyOwner() {
        if (msg.sender != owner) revert ONLY_OWNER();
        _;
    }



    constructor() {
        owner = msg.sender;
        entryFee = 0.1 ether;
        emit LotteryCreated(owner, entryFee);
    }


    function enter() external payable {
        if (msg.value != entryFee) revert INCORRECT_ENTRY_FEE();
        if (hasEntered[msg.sender]) revert ALREADY_ENTERED_THIS_ROUND();

        players.push(msg.sender);
        hasEntered[msg.sender] = true;
        emit PlayerEntered(msg.sender, msg.value);

        if (players.length == MAX_PLAYERS) {
           this._pickWinner;
        }
    }





    function getPlayer(uint256 index) external view returns (address) {
        return players[index];
    }


    function playersCount() external view returns (uint256) {
        return players.length;
    }

    function prizePool() external view returns (uint256) {
        return address(this).balance;
    }


    function _pickWinner() external {
        if (players.length == 0) revert NO_PLAYERS_FOUND();


        uint256 randomIndex = _generateRandomNumber() % players.length;
        address winner = players[randomIndex];

        uint256 prize = address(this).balance;

        (bool success, ) = payable(winner).call{value: prize}("");


        uint256 currentRound = round;
        emit WinnerPicked(winner, prize, currentRound);

        for (uint256 i = 0; i < players.length; i++) {
            hasEntered[players[i]] = false;
        }
        delete players;


        round = currentRound + 1;
    }

    function _generateRandomNumber() internal view returns (uint256) {
        return uint256(
            keccak256(
                abi.encodePacked(block.timestamp, block.prevrandao, players.length, msg.sender)
            )
        );
    }
}