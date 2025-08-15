// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {RandomNumberGenerator} from "./RandomNumberGenerator.sol";
import {Test} from "forge-std/Test.sol";
import {console} from "forge-std/console.sol";
import "@chainlink/contracts/src/v0.8/vrf/mocks/VRFCoordinatorV2Mock.sol";

// Solidity tests are compatible with foundry, so they
// use the same syntax and offer the same functionality.

contract RandomNumberGeneratorTest is Test {
  RandomNumberGenerator generator;
  VRFCoordinatorV2Mock mockCoordinator;
  
  function setUp() public {
    mockCoordinator = new VRFCoordinatorV2Mock(0.1 ether, 1e9);
    uint64 subId = mockCoordinator.createSubscription();
    mockCoordinator.fundSubscription(subId, 10 ether);
    generator = new RandomNumberGenerator(address(mockCoordinator));
    mockCoordinator.addConsumer(subId, address(generator));
  }

  function testRandomness() public {
      uint256 requestId = generator.requestRandomNumber();
      mockCoordinator.fulfillRandomWords(requestId, address(generator));
      uint randomNumber =  generator.randomResult();
      assert(randomNumber != 0);
      console.log('random number = ',randomNumber);
  }

}
