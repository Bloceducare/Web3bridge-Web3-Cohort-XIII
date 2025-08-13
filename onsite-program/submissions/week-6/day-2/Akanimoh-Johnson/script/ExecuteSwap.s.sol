// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/SwapHelper.sol";


contract ExecuteSwap is Script {
    function run() external {
        vm.startBroadcast();

        address permit2 = 0x000000000022D473030F116dDEE9F6B43aC78BA3;
        address tokenIn = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48; 
        address tokenOut = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
        address swapHelperAddress = address(); 
        address whaleAddress = 0x55FE002aeFF02F77364de339a1292923A15844B8; 
        uint256 amountIn = 1000 * 10**6;
        uint256 minAmountOut = 0; 
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;
        address recipient = msg.sender; 
        uint256 deadline = block.timestamp + 3600;
        uint256 nonce = type(uint256).max; 

        uint256 privateKey = 0xabc123abc123abc123abc123abc123abc123abc123abc123abc123abc123abc1; 
        address owner = vm.addr(privateKey);

        vm.deal(owner, 10 ether);

        IERC20 usdc = IERC20(tokenIn);
        vm.prank(whaleAddress);
        usdc.transfer(owner, amountIn);


        bytes32 domainSeparator = keccak256(abi.encode(
            keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
            keccak256(bytes("Permit2")),
            keccak256(bytes("1")),
            block.chainid,
            permit2
        ));


        bytes32 tokenPermissionsTypehash = keccak256("TokenPermissions(address token,uint256 amount)");
        bytes32 permitTransferFromTypehash = keccak256(
            "PermitTransferFrom(TokenPermissions permitted,uint256 nonce,uint256 deadline)TokenPermissions(address token,uint256 amount)"
        );


        bytes32 permittedHash = keccak256(abi.encode(
            tokenPermissionsTypehash,
            tokenIn,
            amountIn
        ));

        bytes32 structHash = keccak256(abi.encode(
            permitTransferFromTypehash,
            permittedHash,
            nonce,
            deadline
        ));


        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));


        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        console.logBytes(signature); 

        IPermit2.PermitTransferFrom memory permit = IPermit2.PermitTransferFrom({
            permitted: IPermit2.TokenPermissions({
                token: tokenIn,
                amount: amountIn
            }),
            nonce: nonce,
            deadline: deadline
        });


        SwapHelper swapHelper = SwapHelper(swapHelperAddress);
        vm.prank(owner); 
        swapHelper.permitAndSwap(
            owner,
            permit,
            amountIn,
            minAmountOut,
            path,
            recipient,
            deadline,
            signature
        );

        console.log("Swap executed!");

        vm.stopBroadcast();
    }
}