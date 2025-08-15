// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {TimeSVGNFT} from "../src/TimeSVGNFT.sol";

contract DeployTimeSVGNFT is Script {
    function run() external {
        // Get deployer's address
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy the contract
        TimeSVGNFT timeNFT = new TimeSVGNFT();
        
        // Log the deployed contract address
        console.log("TimeSVGNFT deployed to:", address(timeNFT));
        
        vm.stopBroadcast();
    }
}
