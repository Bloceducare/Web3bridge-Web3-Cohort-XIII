// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/UniswapPermit.sol";

contract DeployPermitSwap is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Get the appropriate router address based on the network
        address uniswapRouter = getRouterForNetwork();
        
        console.log("Deploying on chain ID:", block.chainid);
        console.log("Using router address:", uniswapRouter);
        
        // Deploy the contract
        UniswapPermit permitSwap = new UniswapPermit(uniswapRouter);
        
        console.log("UniswapPermit deployed to:", address(permitSwap));
        console.log("Router used:", uniswapRouter);
        
        vm.stopBroadcast();
    }
    
}  