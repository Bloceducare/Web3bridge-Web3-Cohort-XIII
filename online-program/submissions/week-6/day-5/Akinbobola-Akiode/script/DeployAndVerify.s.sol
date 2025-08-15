// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/SVG_NFT.sol";

contract DeployAndVerify is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        SVG_NFT svgNFT = new SVG_NFT();
        
        console.log("SVG_NFT deployed at:", address(svgNFT));
        
        vm.stopBroadcast();
        
        console.log("Deployment completed. Waiting for confirmation...");
        
        console.log("Verifying contract on Etherscan...");
        string memory command = string.concat(
            "forge verify-contract ",
            vm.toString(address(svgNFT)),
            " src/SVG_NFT.sol:SVG_NFT ",
            "--chain sepolia ",
            "--etherscan-api-key $ETHERSCAN_API_KEY ",
            "--compiler-version 0.8.28"
        );
        
        console.log("Run this command to verify:");
        console.log(command);
    }
}
