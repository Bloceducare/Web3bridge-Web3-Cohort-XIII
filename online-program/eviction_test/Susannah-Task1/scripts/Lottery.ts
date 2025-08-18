// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/Lottery.sol"; 

contract LotteryScript is Script {
    Lottery public lottery;

    uint256 constant lotteryfee = 0.1 ether;

    uint256[10] private privKeys = [
        0xA11CE,
        0xB0B,
        0xC0DE,
        0xD00D,
        0xE123,
        0xF456,
        0x12345,
        0x67890,
        0xABCDE,
        0xFEDCB
    ];

    function run() external {
        vm.startBroadcast();

        lottery = new Lottery();
        console.log("Lottery deployed at:", address(lottery));

        for (uint256 i = 0; i < privKeys.length; i++) {
            address player = vm.addr(privKeys[i]);
            vm.deal(player, 0.7 ether);
            vm.prank(player);
            lottery.payFeeandCreatePlayer{value: lotteryfee}(
                string(abi.encodePacked("Player", vm.toString(i+1))),
            );
        }

        lottery.playLottery();
        address winner = lottery.winner();
        console.log("Winner's address is:", winner);
        console.log("Winner's balance is:", winner.balance);

        vm.stopBroadcast();

        vm.startBroadcast();
        lottery.playLottery(); 
        console.log("Player count of new lottery game is:", lottery.getPlayers().length);
        vm.stopBroadcast();
    }
}
