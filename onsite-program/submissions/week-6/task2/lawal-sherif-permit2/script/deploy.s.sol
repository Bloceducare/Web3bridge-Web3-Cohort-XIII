// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/PermitSwapEIP712.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address uniswapRouter = vm.envAddress("UNISWAP_ROUTER");
        
        vm.startBroadcast(deployerPrivateKey);
        
        PermitSwapEIP712 permitSwap = new PermitSwapEIP712(uniswapRouter);
        
        console.log("PermitSwapEIP712 deployed to:", address(permitSwap));
        
        vm.stopBroadcast();
    }
}