// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {IAllowanceTransfer, IPermit2} from "@uniswap/permit2/src/interfaces/IPermit2.sol";
import {PermitHash} from "@uniswap/permit2/src/libraries/PermitHash.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IUniversalRouter {
    function execute(bytes calldata commands, bytes[] calldata inputs, uint256 deadline) external;
}

contract CounterScript is Script {
    address constant PERMIT2 = 0x000000000022D473030F116dDEE9F6B43aC78BA3;
    address constant UNIVERSAL_ROUTER = 0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD;
    address constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address constant DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    address constant ASSET_HOLDER = 0xf584F8728B874a6a5c7A8d4d387C9aae9172D621;

    IPermit2 public permit2 = IPermit2(PERMIT2);
    IUniversalRouter public universalRouter = IUniversalRouter(UNIVERSAL_ROUTER);
    IERC20 public usdc = IERC20(USDC);
    IERC20 public dai = IERC20(DAI);

    function setUp() public {}

    function createPermitSingle(address testHolder, uint256 amountIn)
        internal
        view
        returns (IAllowanceTransfer.PermitSingle memory permitSingle)
    {
        (, , uint48 nonce) = permit2.allowance(testHolder, USDC, UNIVERSAL_ROUTER);
        IAllowanceTransfer.PermitDetails memory details = IAllowanceTransfer.PermitDetails({
            token: USDC,
            amount: uint160(amountIn),
            expiration: uint48(block.timestamp + 1 days),
            nonce: nonce
        });
        permitSingle = IAllowanceTransfer.PermitSingle({
            details: details,
            spender: UNIVERSAL_ROUTER,
            sigDeadline: block.timestamp + 30 minutes
        });
    }

    function generateSignature(uint256 testPrivateKey, IAllowanceTransfer.PermitSingle memory permitSingle)
        internal
        view
        returns (bytes memory signature)
    {
        bytes32 hashStruct = PermitHash.hash(permitSingle);
        bytes32 domainSeparator = permit2.DOMAIN_SEPARATOR();
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", domainSeparator, hashStruct));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(testPrivateKey, digest);
        signature = abi.encodePacked(r, s, v);
    }

    function createRouterInputs(
        address testHolder,
        uint256 amountIn,
        IAllowanceTransfer.PermitSingle memory permitSingle,
        bytes memory signature
    ) internal pure returns (bytes memory commands, bytes[] memory inputs) {
        commands = abi.encodePacked(bytes1(0x0a), bytes1(0x00));
        inputs = new bytes[](2);
        inputs[0] = abi.encode(permitSingle, signature);
        inputs[1] = abi.encode(
            testHolder,
            amountIn,
            0,
            abi.encodePacked(USDC, uint24(3000), DAI),
            false
        );
    }

    function run() public {
        vm.startBroadcast();

        uint256 testPrivateKey = 0xabc123def456abc123def456abc123def456abc123def456abc123def456abc1;
        address testHolder = vm.addr(testPrivateKey);

        uint256 amountIn = 100 * 10**6;
        vm.prank(ASSET_HOLDER);
        usdc.transfer(testHolder, amountIn);

        IAllowanceTransfer.PermitSingle memory permitSingle = createPermitSingle(testHolder, amountIn);

        bytes memory signature = generateSignature(testPrivateKey, permitSingle);

        (bytes memory commands, bytes[] memory inputs) = createRouterInputs(testHolder, amountIn, permitSingle, signature);

        uint256 deadline = block.timestamp + 15 minutes;
        vm.prank(testHolder);
        universalRouter.execute(commands, inputs, deadline);

        uint256 daiBalance = dai.balanceOf(testHolder);
        console.log("Test Holder received DAI:", daiBalance);

        vm.stopBroadcast();
    }
}
