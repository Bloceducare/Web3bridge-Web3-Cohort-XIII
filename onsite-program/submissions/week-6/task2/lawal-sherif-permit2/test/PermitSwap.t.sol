// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/PermitSwapEIP712.sol";
import "../src/mocks/ERC20Mock.sol";
import "../src/mocks/UniswapRouterMock.sol";

contract PermitSwapEIP712Test is Test {
    ERC20Mock tokenA;
    ERC20Mock tokenB;
    UniswapRouterMock router;
    PermitSwapEIP712 permitSwap;

    address user = address(0x123);

    function setUp() public {
        tokenA = new ERC20Mock("TokenA", "TKA");
        tokenB = new ERC20Mock("TokenB", "TKB");

        router = new UniswapRouterMock();
        permitSwap = new PermitSwapEIP712(address(router));
    }

    function testPermitAndSwap() public {
        uint256 userPrivateKey = 0xA11CE;
        address userAddr = vm.addr(userPrivateKey);

        tokenA.mint(userAddr, 1000 ether);

        uint256 nonce = tokenA.nonces(userAddr);
        uint256 deadline = block.timestamp + 1 days;

        bytes32 permitTypehash = keccak256(
            "Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"
        );

        bytes32 structHash = keccak256(
            abi.encode(
                permitTypehash,
                userAddr,
                address(permitSwap),
                500 ether,
                nonce,
                deadline
            )
        );

        bytes32 domainSeparator = tokenA.DOMAIN_SEPARATOR();

        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", domainSeparator, structHash)
        );

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(userPrivateKey, digest);

        vm.prank(userAddr);
        permitSwap.permitAndSwapSimple(
            address(tokenA),
            address(tokenB),
            500 ether,
            400 ether,
            deadline,
            v, r, s
        );

        assertEq(tokenA.balanceOf(userAddr), 500 ether, "TokenA balance should decrease");
        assertEq(tokenB.balanceOf(userAddr), 400 ether, "TokenB balance should increase");
    }
}