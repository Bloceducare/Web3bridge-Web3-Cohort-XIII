// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import "../src/PermitSwap.sol";
import {WolfToken} from "../src/Token.sol";

contract PermitSwapScript is Script {
    PermitSwap permitSwap;
    WolfToken wtk;

    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerKey);

        // Deploy WolfToken
        wtk = new WolfToken();
        console.log("WolfToken deployed at:", address(wtk));

        address deployer = msg.sender;
        address assetHolder = 0x1Ff9eA9F062C31cfF19Ade558E34894f07Cf7817;

        uint256 amountIn = 471000 ether; // 471,000 WTK

        // Transfer tokens to assetHolder if needed
        if (wtk.balanceOf(assetHolder) < amountIn) {
            bool success = wtk.transfer(assetHolder, amountIn);
            require(success, "Transfer failed");
            console.log("Transferred", amountIn / 1e18, "WTK to assetHolder");
        }

        // Deploy PermitSwap
        permitSwap = new PermitSwap();
        console.log("PermitSwap deployed at:", address(permitSwap));

        vm.stopBroadcast();

        // ===

        // You must provide a valid permit signature here
        // These will come from off-chain signing (ethers.js example below)
        uint8 v = uint8(vm.envUint("PERMIT_V"));
        bytes32 r = bytes32(vm.envBytes32("PERMIT_R"));
        bytes32 s = bytes32(vm.envBytes32("PERMIT_S"));

        vm.startPrank(assetHolder);

        uint256 minAmountOut = 0;
        address recipient = assetHolder;
        uint256 deadline = block.timestamp + 60 * 10;

        permitSwap.permitAndSwap(
            assetHolder,
            address(wtk),
            amountIn,
            0x10Eaad26A74F78B78018Db68D47d6683E32D105d, // tokenOut (Lisk Sepolia)
            minAmountOut,
            recipient,
            deadline,
            v,
            r,
            s
        );

        vm.stopPrank();
    }
}
