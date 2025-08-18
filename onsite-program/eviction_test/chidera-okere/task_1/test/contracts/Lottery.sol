// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @title Lottery Contract
 * @dev A simple lottery contract where 10 players can join and a winner is selected randomly
 */
contract Lottery {
  // Events
  event PlayerJoined(address indexed player, string message);
  event WinnerEvent(address indexed winner, string message);
  
  // Custom errors
  error Lottery_is_not_active();
  error Entry_fee_must_be_exactly_001_ETH();
  error You_have_already_joined_this_round();
  error Not_enough_players_to_select_a_winner();

  // State variables
  address[] public participants;
  uint8 public playersCount;
  uint256 public immutable lotteryPrice; 
  address private winner;
  bool public lotteryActive;
  mapping(address => bool) private hasJoined;
  
  /**
   * @dev Constructor sets the lottery price and activates the lottery
   * @param _lottery_price The price to join the lottery
   */
  constructor(uint256 _lottery_price) {
    lotteryPrice = _lottery_price;
    lotteryActive = true;
  }

  /**
   * @dev Allows a user to join the lottery by paying the exact fee
   */
  function joinLottery() public payable {
      if(!lotteryActive) revert Lottery_is_not_active();
      if(msg.value != lotteryPrice) revert Entry_fee_must_be_exactly_001_ETH();
      if(hasJoined[msg.sender]) revert You_have_already_joined_this_round();

      participants.push(msg.sender);
      hasJoined[msg.sender] = true;
      playersCount++;
      emit PlayerJoined(msg.sender, "Player joined");

      if (playersCount == 10) {
        selectWinner();
      }
  }

  /**
   * @dev Selects a winner when 10 players have joined
   */
  function selectWinner() private {
      if(playersCount != 10) revert Not_enough_players_to_select_a_winner();
      if(!lotteryActive) revert Lottery_is_not_active();

      uint256 winnerIndex = block.timestamp % participants.length;
      winner = participants[winnerIndex];
      payable(winner).transfer(address(this).balance);
      emit WinnerEvent(winner, "Winner selected");
      
      resetLottery();
  }

  /**
   * @dev Checks if an address is already a participant
   * @param _participant The address to check
   * @return bool True if the address is a participant, false otherwise
   */
  function isParticipant(address _participant) public view returns (bool) {
    return hasJoined[_participant];
  }

  /**
   * @dev Resets the lottery for the next round
   */
  function resetLottery() private {
      lotteryActive = false;
      
      // Clear the hasJoined mapping for all participants before deleting the array
      for (uint i = 0; i < participants.length; i++) {
          hasJoined[participants[i]] = false;
      }
      
      delete participants;
      playersCount = 0;
      lotteryActive = true;
  }

  /**
   * @dev Returns the current number of participants
   * @return uint8 The number of participants
   */
  function getParticipantsCount() public view returns (uint8) {
      return playersCount;
  }

  receive() external payable {}

  fallback() external payable {}
}
