// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {LootBox} from "./Counter.sol";
import {SubscriptionConsumer} from "./VRF.sol";
import {Test, console} from "forge-std/Test.sol";

// Solidity tests are compatible with foundry, so they
// use the same syntax and offer the same functionality.

interface ISubscriptionConsumer{
 function requestRandomWords(bool enableNativePayment) external returns (uint256 requestId);
 function getRequestStatus(uint256 _requestId) external view returns (bool fulfilled, uint256[] memory randomWords);
}

contract CounterTest is Test {
  LootBox lootBox;
  ISubscriptionConsumer subscriptionConsumer;

  function setUp() public {
    // lootBox = new LootBox(10, 20,70);
    subscriptionConsumer = ISubscriptionConsumer(0x6992D337A23cC91E4c8084D18AF85c8574B07a50);
    console.log(address(subscriptionConsumer));
  }

  function test_InitialValue() public returns (uint256){
    // console.log(lootBox.getReward(90));
    subscriptionConsumer.getRequestStatus(12388994650989067484251420769458841557859742120017249360924884638985641500734);
    
  }

  // function testFuzz_Inc(uint8 x) public {
  //   for (uint8 i = 0; i < x; i++) {
  //     counter.inc();
  //   }
  //   require(counter.x() == x, "Value after calling inc x times should be x");
  // }

  // function test_IncByZero() public {
  //   vm.expectRevert();
  //   counter.incBy(0);
  // }
}
