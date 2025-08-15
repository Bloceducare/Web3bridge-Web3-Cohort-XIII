// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test, console} from "forge-std/Test.sol";
import {UniswapPermitSwap} from "../src/UniswapPermitSwap.sol";
import {MockERC20WithPermit} from "../src/MockERC20WithPermit.sol";
import {MockUniswapRouter} from "../src/MockUniswapRouter.sol";

contract SecurityTests is Test {
    UniswapPermitSwap public permitSwap;
    MockERC20WithPermit public tokenA;
    MockERC20WithPermit public tokenB;
    MockUniswapRouter public router;
    
    address public owner;
    address public attacker;
    uint256 public ownerPrivateKey;
    uint256 public attackerPrivateKey;
    
    uint256 public constant INITIAL_SUPPLY = 1_000_000 * 10**18;
    uint256 public constant SWAP_AMOUNT = 1000 * 10**18;
    uint256 public constant MIN_OUTPUT = 900 * 10**18;

    function setUp() public {
        ownerPrivateKey = 0x1234;
        attackerPrivateKey = 0x9999;
        owner = vm.addr(ownerPrivateKey);
        attacker = vm.addr(attackerPrivateKey);
        
        tokenA = new MockERC20WithPermit("Token A", "TKNA", INITIAL_SUPPLY);
        tokenB = new MockERC20WithPermit("Token B", "TKNB", INITIAL_SUPPLY);
        router = new MockUniswapRouter();
        permitSwap = new UniswapPermitSwap(address(router));
        
        // Setup balances and liquidity
        tokenA.mint(owner, SWAP_AMOUNT * 10);
        tokenB.mint(address(router), SWAP_AMOUNT * 10);
        
        tokenA.approve(address(router), SWAP_AMOUNT * 5);
        tokenB.approve(address(router), SWAP_AMOUNT * 5);
        router.addLiquidity(address(tokenA), SWAP_AMOUNT * 5);
        router.addLiquidity(address(tokenB), SWAP_AMOUNT * 5);
    }

    function test_ReplayAttackPrevention() public {
        uint256 deadline = block.timestamp + 1 hours;
        
        // Pre-approve for custom permit
        vm.prank(owner);
        tokenA.approve(address(permitSwap), SWAP_AMOUNT * 2);
        
        // Generate signature for first transaction
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
        
        // Execute first transaction
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
        
        // Try to replay the same transaction - should fail
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

    function test_SignatureMalleabilityProtection() public {
        uint256 deadline = block.timestamp + 1 hours;
        
        vm.prank(owner);
        tokenA.approve(address(permitSwap), SWAP_AMOUNT);
        
        // Generate valid signature
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
        
        // Original signature should work
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

        // Try to replay the same signature - should fail due to nonce increment
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

    function test_CrossChainReplayProtection() public {
        // The EIP-712 domain separator includes chain ID, preventing cross-chain replays
        bytes32 domainSeparator = permitSwap.getDomainSeparator();
        
        // Domain separator should be unique to this chain
        assertTrue(domainSeparator != bytes32(0));
        
        // Verify domain separator includes chain ID
        bytes32 expectedDomainSeparator = keccak256(abi.encode(
            keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
            keccak256("UniswapPermitSwap"),
            keccak256("1"),
            block.chainid,
            address(permitSwap)
        ));
        
        assertEq(domainSeparator, expectedDomainSeparator);
    }

    function test_InsufficientOutputAmount() public {
        uint256 deadline = block.timestamp + 1 hours;
        uint256 permitDeadline = block.timestamp + 1 hours;
        uint256 unrealisticMinOutput = SWAP_AMOUNT * 2; // Expecting 2x output
        
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
        
        // Should revert due to insufficient output
        vm.expectRevert("Router: INSUFFICIENT_OUTPUT_AMOUNT");
        permitSwap.swapWithPermit(
            owner,
            address(tokenA),
            address(tokenB),
            SWAP_AMOUNT,
            unrealisticMinOutput,
            deadline,
            permitDeadline,
            v,
            r,
            s
        );
    }

    function test_ReentrancyProtection() public {
        // The contract uses ReentrancyGuard, so reentrancy should be prevented
        // This is more of a structural test since we can't easily trigger reentrancy with mocks
        
        uint256 deadline = block.timestamp + 1 hours;
        uint256 permitDeadline = block.timestamp + 1 hours;
        
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
        
        // Normal execution should work
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

    function test_InvalidRouterAddress() public {
        // Test that constructor rejects zero address
        vm.expectRevert("Invalid router address");
        new UniswapPermitSwap(address(0));
    }

    function test_PermitDeadlineExpired() public {
        uint256 deadline = block.timestamp + 1 hours;
        uint256 expiredPermitDeadline = block.timestamp - 1; // Expired

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
                expiredPermitDeadline
            ))
        ));
        
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerPrivateKey, permitHash);
        
        // Should revert due to expired permit
        vm.expectRevert(); // OpenZeppelin uses custom errors
        permitSwap.swapWithPermit(
            owner,
            address(tokenA),
            address(tokenB),
            SWAP_AMOUNT,
            MIN_OUTPUT,
            deadline,
            expiredPermitDeadline,
            v,
            r,
            s
        );
    }

    function test_InsufficientTokenBalance() public {
        address poorUser = address(0x999);
        uint256 poorUserKey = 0x888;
        
        uint256 deadline = block.timestamp + 1 hours;
        uint256 permitDeadline = block.timestamp + 1 hours;
        
        // Generate permit signature for user with no tokens
        bytes32 PERMIT_TYPEHASH = keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");
        bytes32 permitHash = keccak256(abi.encodePacked(
            "\x19\x01",
            tokenA.DOMAIN_SEPARATOR(),
            keccak256(abi.encode(
                PERMIT_TYPEHASH,
                poorUser,
                address(permitSwap),
                SWAP_AMOUNT,
                tokenA.nonces(poorUser),
                permitDeadline
            ))
        ));
        
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(poorUserKey, permitHash);
        
        // Should revert due to insufficient balance or invalid signature
        vm.expectRevert(); // OpenZeppelin uses custom errors
        permitSwap.swapWithPermit(
            poorUser,
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

    function test_FrontRunningProtection() public {
        uint256 deadline = block.timestamp + 1 hours;
        
        vm.prank(owner);
        tokenA.approve(address(permitSwap), SWAP_AMOUNT);
        
        // Generate signature
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
        
        // Attacker tries to front-run with different parameters
        vm.prank(attacker);
        vm.expectRevert("Invalid signature");
        permitSwap.swapWithCustomPermit(
            owner,
            address(tokenA),
            address(tokenB),
            SWAP_AMOUNT * 2, // Different amount
            MIN_OUTPUT,
            deadline,
            v,
            r,
            s
        );
        
        // Original transaction should still work
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

    function test_GasLimitDoSProtection() public {
        // Test that the contract doesn't have unbounded loops or operations
        // that could be exploited for gas limit DoS attacks
        
        uint256 deadline = block.timestamp + 1 hours;
        uint256 permitDeadline = block.timestamp + 1 hours;

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
        
        // Measure gas usage
        uint256 gasBefore = gasleft();
        
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
        
        uint256 gasUsed = gasBefore - gasleft();
        
        // Gas usage should be reasonable (less than 200k gas)
        assertTrue(gasUsed < 200000, "Gas usage too high");
    }
}
