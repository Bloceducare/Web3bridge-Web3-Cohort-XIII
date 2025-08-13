// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "contracts/Permit2SwapAndExecute.sol";
import "mocks/MockERC20.sol";
import "mocks/MockPermit2.sol";
import "mocks/MockUniswapRouter.sol";
import {ISignatureTransfer} from "../lib/permit2/src/interfaces/ISignatureTransfer.sol";

contract Permit2SwapAndExecuteTest is Test {
    event PermitUsed(address from, address to, uint256 amount);

    Permit2SwapAndExecute public swapExecutor;
    MockPermit2 public permit2;
    MockERC20 public token;
    MockUniswapRouter public router;

    address public user = address(0xABCD);

    function setUp() public {
        permit2 = new MockPermit2();
        router = new MockUniswapRouter();
        token = new MockERC20();

        swapExecutor = new Permit2SwapAndExecute(address(permit2), address(router));

        token.mint(user, 1e18);
        vm.prank(user);
        token.approve(address(swapExecutor), 1e18);
    }

    function testConstructor() public view {
        assertEq(address(swapExecutor.permit2()), address(permit2));
        assertEq(address(swapExecutor.uniswapRouter()), address(router));
    }

    function testPermitAndSwap() public {
        ISignatureTransfer.PermitTransferFrom memory permit = ISignatureTransfer.PermitTransferFrom({
            permitted: ISignatureTransfer.TokenPermissions({
                token: address(token),
                amount: 1e18
            }),
            nonce: 0,
            deadline: block.timestamp + 3600
        });

        ISignatureTransfer.SignatureTransferDetails memory details = ISignatureTransfer.SignatureTransferDetails({
            to: address(swapExecutor),
            requestedAmount: 1e18
        });

        address[] memory path = new address[](2);
        path[0] = address(token);
        path[1] = address(0xDEAD);

        bytes memory dummySig = hex"deadbeef";

        vm.expectEmit(true, true, true, true);
        emit PermitUsed(user, address(swapExecutor), 1e18);

        vm.expectEmit(true, true, true, true);
        emit MockUniswapRouter.SwapExecuted(1e18, 1e18, path, user);

        vm.prank(user);
        swapExecutor.permitAndSwap(permit, details, dummySig, path, 1e18);

    }


}