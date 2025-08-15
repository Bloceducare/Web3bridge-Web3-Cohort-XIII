// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test, console} from "forge-std/Test.sol";
import {UniswapPermitSwap} from "../src/UniswapPermitSwap.sol";
import {MockERC20WithPermit} from "../src/MockERC20WithPermit.sol";
import {MockUniswapRouter} from "../src/MockUniswapRouter.sol";

contract UniswapPermitSwapTest is Test {
    UniswapPermitSwap public permitSwap;
    MockERC20WithPermit public tokenA;
    MockERC20WithPermit public tokenB;
    MockUniswapRouter public router;
    
    address public owner;
    address public relayer;
    uint256 public ownerPrivateKey;
    uint256 public relayerPrivateKey;
    
    uint256 public constant INITIAL_SUPPLY = 1_000_000 * 10**18;
    uint256 public constant SWAP_AMOUNT = 1000 * 10**18;
    uint256 public constant MIN_OUTPUT = 900 * 10**18;
    
    event SwapExecuted(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );
    
    event PermitUsed(
        address indexed owner,
        address indexed spender,
        uint256 value,
        uint256 deadline,
        uint256 nonce
    );

    function setUp() public {
        // Create test accounts
        ownerPrivateKey = 0x1234;
        relayerPrivateKey = 0x5678;
        owner = vm.addr(ownerPrivateKey);
        relayer = vm.addr(relayerPrivateKey);
        
        // Deploy mock contracts
        tokenA = new MockERC20WithPermit("Token A", "TKNA", INITIAL_SUPPLY);
        tokenB = new MockERC20WithPermit("Token B", "TKNB", INITIAL_SUPPLY);
        router = new MockUniswapRouter();
        
        // Deploy main contract
        permitSwap = new UniswapPermitSwap(address(router));
        
        // Setup initial balances
        tokenA.mint(owner, SWAP_AMOUNT * 10);
        tokenB.mint(address(router), SWAP_AMOUNT * 10); // Router needs tokens for swaps
        
        // Add liquidity to router
        tokenA.approve(address(router), SWAP_AMOUNT * 5);
        tokenB.approve(address(router), SWAP_AMOUNT * 5);
        router.addLiquidity(address(tokenA), SWAP_AMOUNT * 5);
        router.addLiquidity(address(tokenB), SWAP_AMOUNT * 5);
    }

    function test_InitialSetup() public {
        assertEq(tokenA.balanceOf(owner), SWAP_AMOUNT * 10);
        assertEq(tokenB.balanceOf(address(router)), SWAP_AMOUNT * 15); // Router has initial 10 + 5 added as liquidity
        assertEq(address(permitSwap.uniswapRouter()), address(router));
    }

    function test_SwapWithStandardPermit() public {
        uint256 deadline = block.timestamp + 1 hours;
        uint256 permitDeadline = block.timestamp + 1 hours;
        
        // Generate permit signature
        bytes32 PERMIT_TYPEHASH = keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");
        bytes32 permitHash = keccak256(abi.encodePacked(
            "\x19\x01",
            tokenA.DOMAIN_SEPARATOR(),
            keccak256(abi.encode(
                PERMIT_TYPEHASH,
                owner,
                address(permitSwap),
                SWAP_AMOUNT,
                tokenA.nonces(owner),
                permitDeadline
            ))
        ));
        
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerPrivateKey, permitHash);
        
        // Record initial balances
        uint256 initialTokenABalance = tokenA.balanceOf(owner);
        uint256 initialTokenBBalance = tokenB.balanceOf(owner);
        
        // Execute swap with permit
        vm.prank(relayer);
        permitSwap.swapWithPermit(
            owner,
            address(tokenA),
            address(tokenB),
            SWAP_AMOUNT,
            MIN_OUTPUT,
            deadline,
            permitDeadline,
            v,
            r,
            s
        );
        
        // Verify balances changed correctly
        assertEq(tokenA.balanceOf(owner), initialTokenABalance - SWAP_AMOUNT);
        assertEq(tokenB.balanceOf(owner), initialTokenBBalance + SWAP_AMOUNT); // 1:1 ratio in mock
    }

    function test_SwapWithCustomPermit() public {
        uint256 deadline = block.timestamp + 1 hours;
        
        // Pre-approve for custom permit (since it's not fully implemented)
        vm.prank(owner);
        tokenA.approve(address(permitSwap), SWAP_AMOUNT);
        
        // Generate custom permit signature
        bytes32 structHash = keccak256(abi.encode(
            permitSwap.getSwapWithPermitTypeHash(),
            owner,
            address(tokenA),
            address(tokenB),
            SWAP_AMOUNT,
            MIN_OUTPUT,
            deadline,
            permitSwap.getNonce(owner)
        ));
        
        bytes32 hash = keccak256(abi.encodePacked(
            "\x19\x01",
            permitSwap.getDomainSeparator(),
            structHash
        ));
        
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerPrivateKey, hash);
        
        // Record initial balances
        uint256 initialTokenABalance = tokenA.balanceOf(owner);
        uint256 initialTokenBBalance = tokenB.balanceOf(owner);
        uint256 initialNonce = permitSwap.getNonce(owner);
        
        // Execute swap with custom permit
        vm.prank(relayer);
        permitSwap.swapWithCustomPermit(
            owner,
            address(tokenA),
            address(tokenB),
            SWAP_AMOUNT,
            MIN_OUTPUT,
            deadline,
            v,
            r,
            s
        );
        
        // Verify balances and nonce
        assertEq(tokenA.balanceOf(owner), initialTokenABalance - SWAP_AMOUNT);
        assertEq(tokenB.balanceOf(owner), initialTokenBBalance + SWAP_AMOUNT);
        assertEq(permitSwap.getNonce(owner), initialNonce + 1);
    }

    function test_RevertOnExpiredDeadline() public {
        uint256 expiredDeadline = block.timestamp - 1;
        uint256 permitDeadline = block.timestamp + 1 hours;
        
        // Generate permit signature
        bytes32 PERMIT_TYPEHASH = keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");
        bytes32 permitHash = keccak256(abi.encodePacked(
            "\x19\x01",
            tokenA.DOMAIN_SEPARATOR(),
            keccak256(abi.encode(
                PERMIT_TYPEHASH,
                owner,
                address(permitSwap),
                SWAP_AMOUNT,
                tokenA.nonces(owner),
                permitDeadline
            ))
        ));
        
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerPrivateKey, permitHash);
        
        vm.expectRevert("Swap deadline expired");
        permitSwap.swapWithPermit(
            owner,
            address(tokenA),
            address(tokenB),
            SWAP_AMOUNT,
            MIN_OUTPUT,
            expiredDeadline,
            permitDeadline,
            v,
            r,
            s
        );
    }

    function test_RevertOnInvalidSignature() public {
        uint256 deadline = block.timestamp + 1 hours;
        
        // Generate signature with wrong private key
        bytes32 structHash = keccak256(abi.encode(
            permitSwap.getSwapWithPermitTypeHash(),
            owner,
            address(tokenA),
            address(tokenB),
            SWAP_AMOUNT,
            MIN_OUTPUT,
            deadline,
            permitSwap.getNonce(owner)
        ));
        
        bytes32 hash = keccak256(abi.encodePacked(
            "\x19\x01",
            permitSwap.getDomainSeparator(),
            structHash
        ));
        
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(relayerPrivateKey, hash); // Wrong key
        
        vm.expectRevert("Invalid signature");
        permitSwap.swapWithCustomPermit(
            owner,
            address(tokenA),
            address(tokenB),
            SWAP_AMOUNT,
            MIN_OUTPUT,
            deadline,
            v,
            r,
            s
        );
    }

    function test_RevertOnZeroAmount() public {
        uint256 deadline = block.timestamp + 1 hours;
        uint256 permitDeadline = block.timestamp + 1 hours;
        
        vm.expectRevert("Amount must be greater than 0");
        permitSwap.swapWithPermit(
            owner,
            address(tokenA),
            address(tokenB),
            0, // Zero amount
            MIN_OUTPUT,
            deadline,
            permitDeadline,
            0, 0, 0 // Dummy signature values
        );
    }

    function test_RevertOnZeroAddresses() public {
        uint256 deadline = block.timestamp + 1 hours;
        uint256 permitDeadline = block.timestamp + 1 hours;
        
        vm.expectRevert("Invalid owner address");
        permitSwap.swapWithPermit(
            address(0), // Zero owner
            address(tokenA),
            address(tokenB),
            SWAP_AMOUNT,
            MIN_OUTPUT,
            deadline,
            permitDeadline,
            0, 0, 0
        );
        
        vm.expectRevert("Invalid tokenIn address");
        permitSwap.swapWithPermit(
            owner,
            address(0), // Zero tokenIn
            address(tokenB),
            SWAP_AMOUNT,
            MIN_OUTPUT,
            deadline,
            permitDeadline,
            0, 0, 0
        );
    }

    function test_NonceIncrement() public {
        uint256 initialNonce = permitSwap.getNonce(owner);
        
        // Pre-approve for custom permit
        vm.prank(owner);
        tokenA.approve(address(permitSwap), SWAP_AMOUNT);
        
        uint256 deadline = block.timestamp + 1 hours;
        
        // Generate and execute first swap
        bytes32 structHash = keccak256(abi.encode(
            permitSwap.getSwapWithPermitTypeHash(),
            owner,
            address(tokenA),
            address(tokenB),
            SWAP_AMOUNT,
            MIN_OUTPUT,
            deadline,
            initialNonce
        ));
        
        bytes32 hash = keccak256(abi.encodePacked(
            "\x19\x01",
            permitSwap.getDomainSeparator(),
            structHash
        ));
        
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerPrivateKey, hash);
        
        permitSwap.swapWithCustomPermit(
            owner,
            address(tokenA),
            address(tokenB),
            SWAP_AMOUNT,
            MIN_OUTPUT,
            deadline,
            v,
            r,
            s
        );
        
        // Verify nonce incremented
        assertEq(permitSwap.getNonce(owner), initialNonce + 1);
    }

    function test_EventEmission() public {
        uint256 deadline = block.timestamp + 1 hours;
        uint256 permitDeadline = block.timestamp + 1 hours;
        
        // Generate permit signature
        bytes32 PERMIT_TYPEHASH = keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");
        bytes32 permitHash = keccak256(abi.encodePacked(
            "\x19\x01",
            tokenA.DOMAIN_SEPARATOR(),
            keccak256(abi.encode(
                PERMIT_TYPEHASH,
                owner,
                address(permitSwap),
                SWAP_AMOUNT,
                tokenA.nonces(owner),
                permitDeadline
            ))
        ));
        
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerPrivateKey, permitHash);
        
        // Expect events
        vm.expectEmit(true, true, true, true);
        emit PermitUsed(owner, address(permitSwap), SWAP_AMOUNT, permitDeadline, 0);
        
        vm.expectEmit(true, true, true, true);
        emit SwapExecuted(owner, address(tokenA), address(tokenB), SWAP_AMOUNT, SWAP_AMOUNT);
        
        permitSwap.swapWithPermit(
            owner,
            address(tokenA),
            address(tokenB),
            SWAP_AMOUNT,
            MIN_OUTPUT,
            deadline,
            permitDeadline,
            v,
            r,
            s
        );
    }
}
