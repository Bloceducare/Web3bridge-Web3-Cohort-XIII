// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/interfaces/IERC20Permit.sol";
import "../src/interfaces/IERC20.sol";
import "../src/PermitSwap.sol";

contract SwapWithPermitScript is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);
        address PERMIT_SWAP = vm.envAddress("PERMIT_SWAP");
        address TOKEN = vm.envAddress("TOKEN");
        address OUTPUT = vm.envAddress("OUTPUT");

        uint256 amountIn = 1e18;
        uint256 amountOutMin = 0;
        address[] memory path = new address[](2);
        path[0] = TOKEN;
        path[1] = OUTPUT;
        uint256 swapDeadline = block.timestamp + 300;
        uint256 permitDeadline = block.timestamp + 300;

        // Hardcoded for now — replace with env vars later
        uint8 v = 27;
        bytes32 r = 0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa;
        bytes32 s = 0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb;

        vm.startBroadcast(pk);
        PermitSwap(PERMIT_SWAP).swapWithPermit(
            TOKEN,
            amountIn,
            amountOutMin,
            path,
            deployer,
            swapDeadline,
            permitDeadline,
            v,
            r,
            s
        );
        vm.stopBroadcast();
    }
}
