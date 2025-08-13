// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test} from "forge-std/Test.sol";
import {IPermitToken} from "../src/IPermitToken.sol";
import {Swap} from "../src/Swap.sol";
contract CounterTest is Test {
    IPermitToken public token;
    Swap public swap;
    function setUp() public {
        token = new IPermitToken();
        address tokenAddress = address(token);
        swap = new Swap(tokenAddress);
    }

    function mintAndSwap(uint256 x) public {
       address user = vm.addr(0xA11CE); 
       address tokenAddress = address(token);
       token.mintTo(user, 100_000_000);
       uint deadline= 1_000;
       bytes32 public constant EIP712_DOMAIN_TYPEHASH = keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");
       bytes32 DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                EIP712_DOMAIN_TYPEHASH,
                keccak256(bytes("MyToken")),
                keccak256(bytes("1")),
                1,
                address(this)
            )
      );
       bytes32 digest = keccak256(abi.encodePacked("\x19\x01");)
    }
}
