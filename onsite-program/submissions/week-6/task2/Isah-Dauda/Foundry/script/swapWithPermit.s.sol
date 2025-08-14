// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/Uniswapv2Permit.sol";

contract SwapWithPermitScript is Script {
    function run() external {
        // Hardcoded private key for signer (replace with your own)
        uint256 privateKey = "";
        address signer = vm.addr(privateKey);

        console.log("%%%% Using signer:", signer);

        // Start broadcasting txs signed by privateKey
        vm.startBroadcast(privateKey);

        // Deploy swap contract
        console.log("%%%% Deploying UniswapV2SwapWithPermit contract...");
        UniswapV2SwapWithPermit swapContract = new UniswapV2SwapWithPermit();
        console.log("%%%% Contract deployed at:", address(swapContract));

        // Stop broadcast for non-signer impersonations
        vm.stopBroadcast();

        // Token addresses
        address USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
        address DAI  = 0x6B175474E89094C44Da98b954EedeAC495271d0F;

        uint256 amountIn = 100e6;        
        uint256 amountOutMin = 80e18;    
        address[] memory path = new address[](2);
        path[0] = USDC;
        path[1] = DAI;
        uint256 deadline = block.timestamp + 10 minutes;
        uint256 permitDeadline = deadline;

        IERC20Permit usdc = IERC20Permit(USDC);

        // Impersonate the HOLDER to transfer USDC to signer
        address HOLDER = 0x5069A64BC6616dEC1584eE0500B7813A9B680F7E;

        // Start prank as HOLDER
        vm.startPrank(HOLDER);
        bool sent = usdc.transfer(signer, 200e6);
        require(sent, "USDC transfer failed");
        vm.stopPrank();

        console.log("%%%% Transferred 200 USDC from HOLDER to signer");

        console.log("Balance Now before Permit Work: ", usdc.balanceOf(signer));

        // Fund signer with ETH for gas
        vm.deal(signer, 1 ether);
        console.log("%%%% Sent 1 ETH to signer for gas");

        // Get nonce for permit
        uint256 nonce = usdc.nonces(signer);

        // Build EIP-712 domain separator
        bytes32 DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("USD Coin")),
                keccak256(bytes("2")),
                block.chainid,
                USDC
            )
        );

        bytes32 PERMIT_TYPEHASH = keccak256(
            "Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"
        );

        bytes32 structHash = keccak256(
            abi.encode(
                PERMIT_TYPEHASH,
                signer,
                address(swapContract),
                amountIn,
                nonce,
                permitDeadline
            )
        );

        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash));

        // Sign the digest with private key (off-chain permit signature)
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, digest);

        console.log("%%%% Permit signed off-chain");

        // Now broadcast the swapWithPermit tx as signer
        vm.startBroadcast(privateKey);

        // Call swapWithPermit on the contract
        (bool success, bytes memory data) = address(swapContract).call(
            abi.encodeWithSelector(
                swapContract.swapWithPermit.selector,
                USDC,
                amountIn,
                amountOutMin,
                path,
                signer,
                deadline,
                permitDeadline,
                v,
                r,
                s
            )
        );
        require(success, "swapWithPermit call failed");

        console.log("%%%% swapWithPermit transaction sent");

        // Check final DAI balance
        IERC20Permit dai = IERC20Permit(DAI);
        uint256 daiBalance = dai.balanceOf(signer);
        console.log("%%%% Final DAI balance:", daiBalance / 1e18, "DAI");

        vm.stopBroadcast();
    }
}