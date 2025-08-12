// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../script/PermitSwap.s.sol";

contract PermitSwapTest is Test {
    address constant UNISWAP_V2_ROUTER = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
    address constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address constant DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    address constant WETH_WHALE = 0x06920c9Fc643DE77B99cb7670a944AD31EaA6e53;
    
    PermitSwapScript permitSwapScript;
    
    function setUp() public {
        permitSwapScript = new PermitSwapScript();
        vm.warp(1640995200);
    }
    
        function testPermitSignatureGeneration() public view {
        uint256 privateKey = 0xA11CE;
        address owner = WETH_WHALE;
        address spender = address(0);
        uint256 value = 0.1 ether;
        uint256 nonce = 0;
        uint256 deadline = block.timestamp + 3600;

        bytes32 domainSeparator = permitSwapScript.getDomainSeparator(WETH);
        bytes32 structHash = permitSwapScript.getPermitHash(owner, spender, value, nonce, deadline);
        bytes32 hash = keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, hash);

        assertTrue(v > 0, "Signature v should be valid");
        assertTrue(r != bytes32(0), "Signature r should not be zero");
        assertTrue(s != bytes32(0), "Signature s should not be zero");
    }

    function testDomainSeparator() public view {
        bytes32 domainSeparator = permitSwapScript.getDomainSeparator(WETH);
        assertTrue(domainSeparator != bytes32(0), "Domain separator should not be zero");
    }

    function testPermitHash() public view {
        bytes32 permitHash = permitSwapScript.getPermitHash(
            address(0x123),
            address(0x456),
            1 ether,
            0,
            block.timestamp + 3600
        );
        assertTrue(permitHash != bytes32(0), "Permit hash should not be zero");
    }
}