// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

event PlayerJoined(string);
event WinnerEvent(address, string);

error Lottery_is_not_active();
error Entry_fee_must_be_exactly_001_ETH();
error You_have_already_joined_this_round();
error Not_enough_players_to_select_a_winner();

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

  function joinLottery() public payable {
      if(!lotteryActive) revert Lottery_is_not_active();
      if(msg.value != lotteryPrice) revert Entry_fee_must_be_exactly_001_ETH();
      if(isParticipant(msg.sender)) revert You_have_already_joined_this_round();

      participants.push(msg.sender);
      playersCount++;
      emit PlayerJoined(string(abi.encodePacked("Player ", msg.sender, " joined")));

      if (playersCount == 10) {
        selectWinner();
      }
  }

  function selectWinner() private {
      if(playersCount != 10) revert Not_enough_players_to_select_a_winner();
      if(!lotteryActive) revert Lottery_is_not_active();

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