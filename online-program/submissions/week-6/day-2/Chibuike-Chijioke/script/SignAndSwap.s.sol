// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "contracts/Permit2SwapAndExecute.sol";
import "interfaces/IUniswapRouter.sol";
import "interfaces/IERC20.sol";
import {ISignatureTransfer} from "../lib/permit2/src/interfaces/ISignatureTransfer.sol";
import {IPermit2} from "../lib/permit2/src/interfaces/IPermit2.sol";


contract SignAndSwapScript is Script {
    function run() external {
        uint256 userPrivateKey = vm.envUint("USER_PRIVATE_KEY");

        // This set up variables for address
        address tokenIn  = vm.envAddress("TOKEN_IN");
        address tokenOut = vm.envAddress("TOKEN_OUT");
        address permit2  = vm.envAddress("PERMIT2");
        address router   = vm.envAddress("ROUTER");  

        // This deploy the swapExecutor contract
        vm.startBroadcast();
        Permit2SwapAndExecute swapExecutor = new Permit2SwapAndExecute(permit2, router);
        vm.stopBroadcast();

        uint256 amount = 1e18;
        uint256 nonce = 0;
        uint256 deadline = block.timestamp + 3600;

        // This construct permit and transfer details
        ISignatureTransfer.PermitTransferFrom memory permit = ISignatureTransfer.PermitTransferFrom({
            permitted: ISignatureTransfer.TokenPermissions({
                token: tokenIn,
                amount: amount
            }),
            nonce: nonce,
            deadline: deadline
        });

        ISignatureTransfer.SignatureTransferDetails memory details = ISignatureTransfer.SignatureTransferDetails({
            to: address(swapExecutor),
            requestedAmount: amount
        });

        // This construct EIP-712 digest manually
        bytes32 permitTypeHash = keccak256("PermitTransferFrom(TokenPermissions permitted,address spender,uint256 nonce,uint256 deadline)TokenPermissions(address token,uint256 amount)");
        bytes32 tokenPermissionsHash = keccak256(abi.encode(
            keccak256("TokenPermissions(address token,uint256 amount)"),
            tokenIn,
            amount
        ));

        bytes32 digest = keccak256(abi.encode(
            permitTypeHash,
            tokenPermissionsHash,
            address(swapExecutor),
            nonce,
            deadline
        ));

        // This sign the digest
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(userPrivateKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        // This define swap path
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;

        // Thise broadcast the transaction
        vm.startBroadcast(userPrivateKey);
        swapExecutor.permitAndSwap(permit, details, signature, path, 1e18);
        vm.stopBroadcast();
    }
}