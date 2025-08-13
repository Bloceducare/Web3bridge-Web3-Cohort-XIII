// SPDX-License-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {PermitSwapV3} from "../src/PermitSwapV3.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ISignatureTransfer} from "permit2/src/interfaces/ISignatureTransfer.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "forge-std/console.sol";

contract PermitSwapV3Test is Test {
    using ECDSA for bytes32;

    PermitSwapV3 public permitSwap;
    IERC20 public dai;
    IERC20 public usdc;
    ISignatureTransfer public permit2;
    address public user;
    uint256 private userPrivateKey;

    address constant PERMIT2_ADDRESS = 0x000000000022D473030F116dDEE9F6B43aC78BA3;
    address constant SWAP_ROUTER = 0xE592427A0AEce92De3Edee1F18E0157C05861564;
    address constant DAI_ADDRESS = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    address constant USDC_ADDRESS = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;

    ISignatureTransfer.PermitTransferFrom permit;
    bytes signature;

    function setUp() public {
        // Set block timestamp to avoid underflow
        vm.warp(1697059200); // Oct 12, 2023, 00:00:00 UTC

        // Use a test private key and derive address
        userPrivateKey = 0xA11CE;
        user = vm.addr(userPrivateKey);

        // Deploy contract
        permitSwap = new PermitSwapV3(PERMIT2_ADDRESS, SWAP_ROUTER);
        dai = IERC20(DAI_ADDRESS);
        usdc = IERC20(USDC_ADDRESS);
        permit2 = ISignatureTransfer(PERMIT2_ADDRESS);

        // Deal DAI to user
        vm.deal(user, 1 ether); // For gas
        deal(DAI_ADDRESS, user, 1000 ether);

        // Create permit
        permit = ISignatureTransfer.PermitTransferFrom({
            permitted: ISignatureTransfer.TokenPermissions({
                token: DAI_ADDRESS,
                amount: 100 ether
            }),
            nonce: 0,
            deadline: block.timestamp + 1 hours
        });

        // Generate signature for user
        signature = signPermit(userPrivateKey, permit);
    }

    function signPermit(
        uint256 pk,
        ISignatureTransfer.PermitTransferFrom memory _permit
    ) internal view returns (bytes memory) {
        bytes32 DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("Permit2")),
                keccak256(bytes("1")),
                block.chainid,
                PERMIT2_ADDRESS
            )
        );

        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("PermitTransferFrom(TokenPermissions permitted,uint256 nonce,uint256 deadline)TokenPermissions(address token,uint256 amount)"),
                _permit.permitted.token,
                _permit.permitted.amount,
                _permit.nonce,
                _permit.deadline
            )
        );

        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash)
        );

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(pk, digest);
        return abi.encodePacked(r, s, v);
    }

    function testPermitSignatureValid() public view {
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("PermitTransferFrom(TokenPermissions permitted,uint256 nonce,uint256 deadline)TokenPermissions(address token,uint256 amount)"),
                permit.permitted.token,
                permit.permitted.amount,
                permit.nonce,
                permit.deadline
            )
        );

        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                keccak256(
                    abi.encode(
                        keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                        keccak256(bytes("Permit2")),
                        keccak256(bytes("1")),
                        block.chainid,
                        PERMIT2_ADDRESS
                    )
                ),
                structHash
            )
        );

        address recovered = digest.recover(signature);
        console.log("Recovered signer:", recovered);
        console.log("Expected user:   ", user);
        assertEq(recovered, user, "Signature should be valid");
    }

    function testPermitAndSwap() public {
        vm.startPrank(user);

        uint256 usdcBalanceBefore = usdc.balanceOf(user);
        uint256 daiBalanceBefore = dai.balanceOf(user);

        // Execute swap and capture amountOut
        uint256 amountOut = permitSwap.permitAndSwap(
            permit,
            signature,
            DAI_ADDRESS,
            USDC_ADDRESS,
            3000,
            0,
            user,
            block.timestamp + 1 hours,
            0
        );

        uint256 usdcBalanceAfter = usdc.balanceOf(user);
        uint256 daiBalanceAfter = dai.balanceOf(user);

        // Check event emission
        vm.expectEmit(true, true, true, true);
        emit PermitSwapV3.SwapExecuted(user, DAI_ADDRESS, USDC_ADDRESS, 100 ether, amountOut);

        // Log balances for debugging
        console.log("USDC balance before:", usdcBalanceBefore / 1e6);
        console.log("USDC balance after:", usdcBalanceAfter / 1e6);
        console.log("DAI balance before:", daiBalanceBefore / 1e18);
        console.log("DAI balance after:", daiBalanceAfter / 1e18);
        console.log("Amount out:", amountOut / 1e6);

        assertGt(usdcBalanceAfter, usdcBalanceBefore, "USDC balance should increase");
        assertLt(daiBalanceAfter, daiBalanceBefore, "DAI balance should decrease");
        assertGt(amountOut, 0, "Swap should return non-zero output");

        vm.stopPrank();
    }

    function testRevertOnExpiredDeadline() public {
        vm.startPrank(user);

        ISignatureTransfer.PermitTransferFrom memory expiredPermit = ISignatureTransfer.PermitTransferFrom({
            permitted: ISignatureTransfer.TokenPermissions({
                token: DAI_ADDRESS,
                amount: 100 ether
            }),
            nonce: 0,
            deadline: block.timestamp - 1 hours
        });

        bytes memory expiredSignature = signPermit(userPrivateKey, expiredPermit);

        vm.expectRevert("Transaction expired");
        permitSwap.permitAndSwap(
            expiredPermit,
            expiredSignature,
            DAI_ADDRESS,
            USDC_ADDRESS,
            3000,
            0,
            user,
            block.timestamp - 1 hours,
            0
        );

        vm.stopPrank();
    }

    function testRevertOnTokenMismatch() public {
        vm.startPrank(user);

        ISignatureTransfer.PermitTransferFrom memory wrongPermit = ISignatureTransfer.PermitTransferFrom({
            permitted: ISignatureTransfer.TokenPermissions({
                token: USDC_ADDRESS,
                amount: 100 ether
            }),
            nonce: 0,
            deadline: block.timestamp + 1 hours
        });

        bytes memory wrongSignature = signPermit(userPrivateKey, wrongPermit);

        vm.expectRevert("Token mismatch");
        permitSwap.permitAndSwap(
            wrongPermit,
            wrongSignature,
            DAI_ADDRESS,
            USDC_ADDRESS,
            3000,
            0,
            user,
            block.timestamp + 1 hours,
            0
        );

        vm.stopPrank();
    }
}