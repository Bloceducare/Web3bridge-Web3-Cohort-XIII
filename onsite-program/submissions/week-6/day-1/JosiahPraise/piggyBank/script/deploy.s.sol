// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Script} from "forge-std/Script.sol";
import {Bank} from "../src/Bank.sol";

contract DeployBank is Script {
    
    function run() external returns (Bank) {
       
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        Bank bank = new Bank();

        vm.stopBroadcast();
        
        return bank;
    }
}