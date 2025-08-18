// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

contract Lottery {
    event joinedLottery(address player, uint256 amount);
    event winner(address winner, uint256 prize);

    mapping(address => bool) public participant;
    address[] public players;
    uint256 public entryFee = 0.01 ether;

    function joinLottery() external payable {
        require(players.length < 10, "Lottery round complete, wait for next round");
        require(msg.value == entryFee, "amount to join is 0.01 ETH");
        require(!participant[msg.sender], "You have already joined the lottery");
        participant[msg.sender] = true;
        players.push(msg.sender);
        emit joinedLottery(msg.sender, msg.value);
        if (players.length == 10) {
            selectWinner();
        }
    }

    function selectWinner() private {
        uint256 rand = uint256(
            keccak256(
                abi.encodePacked(block.timestamp, block.difficulty, players)
            )
        ) % players.length;
        address winnerAddress = players[rand];
        uint256 prize = address(this).balance;
        (bool sent, ) = winnerAddress.call{value: prize}("");
        require(sent, "Transfer to winner failed");
        emit winner(winnerAddress, prize);
        // Reset for next round
        for (uint256 i = 0; i < players.length; i++) {
            participant[players[i]] = false;
        }
        delete players;
    }

    receive() external payable {}
    fallback() external payable {}
}