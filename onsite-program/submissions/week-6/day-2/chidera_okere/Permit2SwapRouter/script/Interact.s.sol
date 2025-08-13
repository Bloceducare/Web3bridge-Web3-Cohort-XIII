// SPDX-License-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script} from "forge-std/Script.sol";
import {PermitSwapV3} from "../src/PermitSwapV3.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ISignatureTransfer} from "permit2/src/interfaces/ISignatureTransfer.sol";
import "forge-std/console.sol";

contract Interact is Script {
    address constant PERMIT2_ADDRESS = 0x000000000022D473030F116dDEE9F6B43aC78BA3;
    address constant DAI_ADDRESS = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    address constant USDC_ADDRESS = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address constant USER_ADDRESS = 0x28C6c06298d514Db089934071355E5743bf21d60;

    function run(address contractAddress, bytes memory signature) external {
        PermitSwapV3 permitSwap = PermitSwapV3(contractAddress);
        IERC20 dai = IERC20(DAI_ADDRESS);

        vm.startPrank(USER_ADDRESS);
        console.log("User DAI balance:", dai.balanceOf(USER_ADDRESS) / 1e18);

        ISignatureTransfer.PermitTransferFrom memory permit = ISignatureTransfer.PermitTransferFrom({
            permitted: ISignatureTransfer.TokenPermissions({
                token: DAI_ADDRESS,
                amount: 100 ether
            }),
            nonce: 0,
            deadline: block.timestamp + 1 hours
        });

        uint256 amountOut = permitSwap.permitAndSwap(
            permit,
            signature,
            DAI_ADDRESS,
            USDC_ADDRESS,
            3000,
            0,
            USER_ADDRESS,
            block.timestamp + 1 hours,
            0
        );

        console.log("Swap executed. Amount out:", amountOut / 1e6);
        vm.stopPrank();
    }
}