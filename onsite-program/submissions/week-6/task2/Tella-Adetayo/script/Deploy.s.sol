// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {UniswapPermit2Swap} from "../src/UniswapPermit2Swap.sol";

contract DeployScript is Script {
    UniswapPermit2Swap public uniswapPermit;

    function run() public {
        
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

       
        uniswapPermit = new UniswapPermit2Swap();

        vm.stopBroadcast();
    }
}
