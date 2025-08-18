// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

event PlayerJoined(string);
event WinnerEvent(address, string);

error LotteryIsNotActive();
error EntryFeeMustBeExactly001_ETH();
error YouHaveAlreadyJoinedThisAround();
error NotEnoughPlayersToSelectAWinner();

contract LotteryGame {
    address[] participants;
    uint8 playersCount;
    uint256 lotteryPrice;
    address private winner;
    bool private lotteryActive;

    constructor(uint256 _lottery_price) {
        lotteryPrice = _lottery_price;
        lotteryActive = true;
    }

    function enterLottery() public payable {
        if (!lotteryActive) revert LotteryIsNotActive();
        if (msg.value != lotteryPrice) revert EntryFeeMustBeExactly001_ETH();
        if (isParticipant(msg.sender)) revert YouHaveAlreadyJoinedThisAround();

        participants.push(msg.sender);
        playersCount++;
        emit PlayerJoined(
            string(abi.encodePacked("Player ", msg.sender, " joined"))
        );

        if (playersCount == 10) {
            selectWinner();
        }
    }

    function selectWinner() private {
        if (playersCount != 10) revert NotEnoughPlayersToSelectAWinner();
        if (!lotteryActive) revert LotteryIsNotActive();

        uint256 winnerIndex = block.timestamp % participants.length;
        winner = participants[winnerIndex];
        payable(winner).transfer(address(this).balance);
        emit WinnerEvent(winner, "Winner selected");

        resetLottery();
    }

    function isParticipant(address _participant) private view returns (bool) {
        for (uint i = 0; i < participants.length; i++) {
            if (participants[i] == _participant) {
                return true;
            }
        }
        return false;
    }

    function resetLottery() private {
        lotteryActive = false;
        delete participants;
        playersCount = 0;
        lotteryActive = true;
    }

    receive() external payable {}

    fallback() external payable {}
}
