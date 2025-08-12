// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import "../src/UniswapV2SwapWithPermit2.sol";
import "../src/Permit2EIP712Helper.sol";

interface IERC20 {
    function balanceOf(address) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
}

contract Permit2SwapTest is Test {
    address constant PERMIT2 = 0x000000000022d473030F116dDEE9F6B43aC78BA3;
    address constant UNISWAP_ROUTER = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;

    address constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address constant DAI  = 0x6B175474E89094C44Da98b954EedeAC495271d0F;

    address constant MAINNET_USDC_HOLDER = 0x5069A64BC6616dEC1584eE0500B7813A9B680F7E;

    UniswapV2SwapWithPermit2 swapContract;
    Permit2EIP712Helper helper;

    function setUp() public {
        string memory rpc = vm.envString("MAINNET_RPC_URL");
        vm.createSelectFork(rpc);

        helper = new Permit2EIP712Helper();
        swapContract = new UniswapV2SwapWithPermit2(PERMIT2, UNISWAP_ROUTER);
    }

    function test_swapWithPermit2_flow() public {
        uint256 privateKey = 0xA11CE; 
        address walletAddr = vm.addr(privateKey);

        vm.startPrank(MAINNET_USDC_HOLDER);
        IERC20(USDC).transfer(walletAddr, 200 * 10**6);
        vm.stopPrank();

        uint256 bal = IERC20(USDC).balanceOf(walletAddr);
        emit log_named_decimal_uint("wallet USDC initial", bal, 6);
        assert(bal >= 200 * 10**6);

        uint160 amount = uint160(100 * 10**6); 
        uint48 expiration = 0; 
        uint48 nonce = 0; 
        address spender = address(swapContract);
        uint256 sigDeadline = block.timestamp + 3600;

        uint256 chainId = block.chainid;
        bytes32 digest = helper.getPermitSingleDigest(
            USDC,
            amount,
            expiration,
            nonce,
            spender,
            sigDeadline,
            chainId,
            PERMIT2
        );

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        IPermit2.PermitSingle memory permitSingle = IPermit2.PermitSingle({
            token: USDC,
            amount: amount,
            expiration: expiration,
            nonce: nonce,
            spender: spender,
            sigDeadline: sigDeadline
        });

 
        address ;
        path[0] = USDC;
        path[1] = DAI;

        uint amountOutMin = 1; 
        uint deadline = block.timestamp + 600;

     
        vm.startPrank(walletAddr);
        swapContract.swapWithPermit2(
            permitSingle,
            walletAddr,
            signature,
            amountOutMin,
            path,
            deadline
        );
        vm.stopPrank();

        uint256 usdcAfter = IERC20(USDC).balanceOf(walletAddr);
        uint256 daiAfter = IERC20(DAI).balanceOf(walletAddr);

        emit log_named_decimal_uint("wallet USDC after", usdcAfter, 6);
        emit log_named_decimal_uint("wallet DAI after", daiAfter, 18);

        assert(usdcAfter < bal); 
        assert(daiAfter > 0); 
    }
}
