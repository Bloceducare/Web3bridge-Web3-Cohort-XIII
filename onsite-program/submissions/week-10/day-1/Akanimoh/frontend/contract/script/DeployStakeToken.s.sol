// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/StakingToken.sol";

contract DeployStakeToken is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy StakeToken with the following parameters:
        string memory name = "Stake Token";
        string memory symbol = "STK";
        uint256 initialSupply = 1000000; // 1 million tokens (will be multiplied by 10^18)

        StakeToken stakeToken = new StakeToken(name, symbol, initialSupply);

        console.log("StakeToken deployed to:", address(stakeToken));
        console.log("Token Name:", name);
        console.log("Token Symbol:", symbol);
        console.log("Initial Supply:", initialSupply * 10**18);
        console.log("Deployer:", vm.addr(deployerPrivateKey));

        vm.stopBroadcast();
    }
}
