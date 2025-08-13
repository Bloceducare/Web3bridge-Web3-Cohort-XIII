// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/interfaces/IERC20.sol";
import "../src/interfaces/Permit2.sol";

interface IUniswapV2Factory {
    function getPair(address tokenA, address tokenB) external view returns (address);
}

contract UniswapAddLiquidityScript is Script {
    address assetHolder      = 0xf584F8728B874a6a5c7A8d4d387C9aae9172D621;
    address USDCAddress      = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address DAIAddress       = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    address UNISWAPROUTER    = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D; // V2 router (example)
    address UNISWAPV2FACTORY = 0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f;
    address PERMIT2_ADDR     = 0x000000000022D473030F116dDEE9F6B43aC78BA3; // Uniswap Permit2

    bytes32 constant EIP712_DOMAIN_TYPEHASH =
    keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");
    bytes32 constant NAME_HASH    = keccak256("Permit2");
    bytes32 constant VERSION_HASH = keccak256("1");


    bytes32 constant TOKEN_PERMISSIONS_TYPEHASH =
    keccak256("TokenPermissions(address token,uint256 amount)");
    bytes32 constant PERMIT_TRANSFER_FROM_TYPEHASH =
    keccak256(
        "PermitTransferFrom(TokenPermissions permitted,uint256 nonce,uint256 deadline)"
        "TokenPermissions(address token,uint256 amount)"
    );

    function run() external {
        vm.startBroadcast(assetHolder);
        uint256 usdcBal = IERC20(USDCAddress).balanceOf(assetHolder);
        console.log("USDC balance (assetHolder):", usdcBal);
        vm.stopBroadcast();


        uint256 permitAmount   = 1_000 * 1e6;
        uint256 nonce          = 1;
        uint256 deadline       = block.timestamp + 1 days;

        // Build structs
        Permit2.TokenPermissions memory perm = Permit2.TokenPermissions({
            token: USDCAddress,
            amount: permitAmount
        });

        Permit2.PermitTransferFrom memory permit = Permit2.PermitTransferFrom({
            permitted: perm,
            nonce: nonce,
            deadline: deadline
        });

        Permit2.SignatureTransferDetails memory details = Permit2.SignatureTransferDetails({
            to: UNISWAPROUTER,
            requestedAmount: requestedSpend
        });

        bytes32 tokenPermsHash = keccak256(
            abi.encode(
                TOKEN_PERMISSIONS_TYPEHASH,
                perm.token,
                perm.amount
            )
        );

        bytes32 structHash = keccak256(
            abi.encode(
                PERMIT_TRANSFER_FROM_TYPEHASH,
                tokenPermsHash,
                permit.nonce,
                permit.deadline
            )
        );

        bytes32 domainSeparator = keccak256(
            abi.encode(
                EIP712_DOMAIN_TYPEHASH,
                NAME_HASH,
                VERSION_HASH,
                block.chainid,
                PERMIT2_ADDR
            )
        );

        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));

        uint256 ownerPk = vm.envUint("OWNER_PRIVATE_KEY");
        address owner   = vm.addr(ownerPk);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerPk, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        vm.startBroadcast(owner);
        Permit2(PERMIT2_ADDR).permitTransferFrom(
            permit,
            details,
            owner,
            signature
        );
        vm.stopBroadcast();

        console.log("Permit2 permitTransferFrom executed.");
    }
}
