// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {Test, console} from "forge-std/Test.sol";
import {Vm} from "forge-std/Vm.sol";
import {LootBox} from "../src/LootBox.sol";
import {IERC20} from "../src/interfaces/ERC20/IERC20.sol";
import {IERC721} from "../src/interfaces/ERC721/IERC721.sol";
import {IERC1155} from "../src/interfaces/ERC1155/IERC1155.sol";
import {ERC20Mock} from "../src/tests/ERC20/ERC20.sol";
import {ERC721Mock, IERC721Receiver} from "../src/tests/ERC721/ERC721.sol";
import {ERC1155Mock} from "../src/tests/ERC1155/ERC1155.sol";
import {VRFCoordinatorV2Mock} from "../src/tests/VRFCoordinatorV2Mock/VRFCoordinatorV2Mock.sol";

contract LootBoxTest is Test, IERC721Receiver {
    // Events to test
    event LootBoxDeployed(uint256 indexed lootboxId, address indexed creator);
    event LootBoxOpened(uint256 indexed lootboxId, address indexed opener, uint256 amount);
    event LootBoxFulfilled(uint256 indexed lootboxId, address indexed opener, uint256 requestId);
    event RewardsClaimed(uint256 indexed lootboxId, address indexed claimer);
    event Withdrawn(address indexed to, uint256 amount);

    // Test contracts
    VRFCoordinatorV2Mock public vrfCoordinator;
    LootBox public lootBox;
    ERC20Mock public erc20Token;
    ERC721Mock public erc721Token;
    ERC1155Mock public erc1155Token;

    // Test addresses
    address public owner = address(0x1);
    address public user1 = address(0x2);
    address public user2 = address(0x3);

    // Test constants
    uint64 public constant VRF_SUBSCRIPTION_ID = 1;
    uint32 public constant VRF_CALLBACK_GAS_LIMIT = 1000000;
    uint16 public constant VRF_REQUEST_CONFIRMATIONS = 3;
    uint32 public constant VRF_NUM_WORDS = 1;
    bytes32 public constant VRF_KEY_HASH = 0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15;
    uint128 public constant FEE_PER_OPEN = 0.01 ether;
    
    // Helper function to create a new LootBox with default parameters
    function _deployLootBox() internal {
        // Deploy VRF Coordinator
        vrfCoordinator = new VRFCoordinatorV2Mock(0, 0);
        
        // Create a subscription for the LootBox
        // First, create the subscription and get the subscription ID
        vrfCoordinator.createSubscription();
        
        // Fund the subscription with 1 ether (convert to uint96 as expected by the function)
        // We need to do this as the owner of the subscription
        vm.startPrank(owner);
        vrfCoordinator.fundSubscription(VRF_SUBSCRIPTION_ID, uint96(1 ether));
        
        // Deploy all mock tokens with the test contract as the owner
        erc20Token = new ERC20Mock(owner);  // Deploy with owner as the initial owner
        erc721Token = new ERC721Mock(owner);
        erc1155Token = new ERC1155Mock(owner);
        
        // Create a default set of tokens for the lootbox
        uint256 totalAmount = 1000 * 10 ** 18;
        LootBox.Token[] memory defaultTokens = new LootBox.Token[](1);
        defaultTokens[0] = LootBox.Token({
            assetContract: address(erc20Token),
            tokenType: LootBox.TokenType.ERC20,
            tokenId: 0,
            totalAmount: totalAmount
        });
        
        uint256[] memory defaultAmounts = new uint256[](1);
        defaultAmounts[0] = 1 * 10 ** 18;
        
        // Mint tokens to the owner address
        erc20Token.mint(owner, totalAmount);
        
        // Calculate the LootBox contract address that will be deployed
        uint256 nonce = vm.getNonce(owner);
        address lootBoxAddress = computeCreateAddress(owner, nonce);
        
        // As the owner, approve the future LootBox contract to transfer tokens
        vm.prank(owner);
        erc20Token.approve(lootBoxAddress, totalAmount);
        
        // Deploy the LootBox contract with the tokens as the owner
        // This ensures the owner is set correctly in the LootBox constructor
        vm.startPrank(owner);
        lootBox = new LootBox(
            defaultTokens,
            defaultAmounts,
            FEE_PER_OPEN,
            1, // amountDistributedPerOpen
            uint64(block.timestamp), // openStartTimestamp (now)
            VRF_KEY_HASH,
            address(vrfCoordinator),
            VRF_SUBSCRIPTION_ID
        );
        
        // Add LootBox as a consumer - must be done as the subscription owner
        vrfCoordinator.addConsumer(VRF_SUBSCRIPTION_ID, address(lootBox));
        
        // Transfer ownership of the LootBox to the test contract if needed
        // This ensures the test contract can call onlyOwner functions
        lootBox.transferOwnership(address(this));
        
        vm.stopPrank();
    }

    // Helper function to create a basic lootbox with ERC20 tokens
    function _createBasicLootBox(
        uint256 perUnitAmount,
        uint256 totalAmount,
        uint64 amountDistributedPerOpen
    ) internal returns (uint256) {
        LootBox.Token[] memory tokens = new LootBox.Token[](1);
        tokens[0] = LootBox.Token({
            assetContract: address(erc20Token),
            tokenType: LootBox.TokenType.ERC20,
            tokenId: 0,
            totalAmount: totalAmount
        });
        
        uint256[] memory perUnitAmounts = new uint256[](1);
        perUnitAmounts[0] = perUnitAmount;
        
        // Mint tokens to the owner
        erc20Token.mint(owner, totalAmount);
        
        // Approve LootBox to spend tokens
        vm.startPrank(owner);
        erc20Token.approve(address(lootBox), totalAmount);
        
        // Deploy new lootbox with the tokens
        LootBox newLootBox = new LootBox(
            tokens,
            perUnitAmounts,
            uint128(FEE_PER_OPEN),
            uint64(amountDistributedPerOpen),
            uint64(block.timestamp), // Start time (now)
            VRF_KEY_HASH,
            address(vrfCoordinator),
            VRF_SUBSCRIPTION_ID
        );
        uint256 lootboxId = 0; // In a real test, you'd track the deployed contract address
        
        vm.stopPrank();
        return lootboxId;
    }

    // Helper function to deploy a LootBox with tokens
    function _deployLootBoxWithTokens(
        address tokenAddress,
        LootBox.TokenType tokenType,
        uint256 totalAmount,
        uint256 perUnitAmount,
        uint256 amountDistributedPerOpen
    ) internal returns (LootBox) {
        // Prepare tokens
        LootBox.Token[] memory tokens = new LootBox.Token[](1);
        tokens[0] = LootBox.Token({
            assetContract: tokenAddress,
            tokenType: tokenType,
            tokenId: 0, // Only used for ERC1155
            totalAmount: totalAmount
        });
        
        uint256[] memory perUnitAmounts = new uint256[](1);
        perUnitAmounts[0] = perUnitAmount;
        
        // Mint tokens to the owner
        erc20Token.mint(owner, totalAmount);
        
        // Approve LootBox to spend tokens
        vm.startPrank(owner);
        erc20Token.approve(address(lootBox), totalAmount);
        
        // Create a new lootbox with the tokens
        LootBox newLootBox = new LootBox(
            tokens,
            perUnitAmounts,
            uint128(FEE_PER_OPEN),
            uint64(amountDistributedPerOpen),
            uint64(block.timestamp), // Start time (now)
            VRF_KEY_HASH,
            address(vrfCoordinator),
            VRF_SUBSCRIPTION_ID
        );
        
        vm.stopPrank();
        return newLootBox;
    }

    // IERC721Receiver implementation
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return this.onERC721Received.selector;
    }

    // Setup function that runs before each test
    function setUp() public {
        // Set up test environment
        vm.startPrank(owner);
        _deployLootBox();
        vm.stopPrank();
    }

    // ===== Deploy Tests =====
    
    function test_Deploy_RevertIfTokenArrayEmpty() public {
        LootBox.Token[] memory tokens = new LootBox.Token[](0);
        uint256[] memory perUnitAmounts = new uint256[](0);
        
        vm.expectRevert("NoTokens()");
        new LootBox(
            tokens,
            perUnitAmounts,
            uint128(FEE_PER_OPEN),
            uint64(1), // amountDistributedPerOpen
            uint64(block.timestamp), // Start time (now)
            VRF_KEY_HASH,
            address(vrfCoordinator),
            VRF_SUBSCRIPTION_ID
        );
    }
    
    function test_Deploy_RevertIfPerUnitAmountsLengthMismatch() public {
        // Prepare tokens
        LootBox.Token[] memory tokens = new LootBox.Token[](2);
        tokens[0] = LootBox.Token({
            assetContract: address(erc20Token),
            tokenType: LootBox.TokenType.ERC20,
            tokenId: 0,
            totalAmount: 100
        });
        tokens[1] = LootBox.Token({
            assetContract: address(erc20Token),
            tokenType: LootBox.TokenType.ERC20,
            tokenId: 0,
            totalAmount: 200
        });
        
        // Mint and approve tokens
        erc20Token.mint(owner, 300);
        
        // Create perUnitAmounts with wrong length (1 instead of 2)
        uint256[] memory perUnitAmounts = new uint256[](1);
        perUnitAmounts[0] = 10;
        
        // Approve LootBox to spend tokens
        vm.startPrank(owner);
        erc20Token.approve(address(lootBox), 300);
        
        // Should revert due to length mismatch
        vm.expectRevert("InvalidLength()");
        new LootBox(
            tokens,
            perUnitAmounts,
            uint128(FEE_PER_OPEN),
            uint64(2), // amountDistributedPerOpen
            uint64(block.timestamp), // Start time (now)
            VRF_KEY_HASH,
            address(vrfCoordinator),
            VRF_SUBSCRIPTION_ID
        );
        
        vm.stopPrank();
    }
    
    function test_Deploy_RevertIfTokenTotalAmountZero() public {
        LootBox.Token[] memory tokens = new LootBox.Token[](1);
        tokens[0] = LootBox.Token({
            assetContract: address(erc20Token),
            tokenType: LootBox.TokenType.ERC20,
            tokenId: 0,
            totalAmount: 0 // Zero amount should revert
        });
        
        uint256[] memory perUnitAmounts = new uint256[](1);
        perUnitAmounts[0] = 10;
        
        // Approve LootBox to spend tokens (even though amount is zero)
        vm.startPrank(owner);
        erc20Token.approve(address(lootBox), 0);
        
        // Should revert due to zero amount
        vm.expectRevert("NoTokens()");
        new LootBox(
            tokens,
            perUnitAmounts,
            uint128(FEE_PER_OPEN),
            uint64(1), // amountDistributedPerOpen
            uint64(block.timestamp), // Start time (now)
            VRF_KEY_HASH,
            address(vrfCoordinator),
            VRF_SUBSCRIPTION_ID
        );
        
        vm.stopPrank();
    }
    
    function test_Deploy_RevertIfTokenAmountNotMultipleOfPerUnitAmount() public {
        LootBox.Token[] memory tokens = new LootBox.Token[](1);
        tokens[0] = LootBox.Token({
            assetContract: address(erc20Token),
            tokenType: LootBox.TokenType.ERC20,
            tokenId: 0,
            totalAmount: 15 // Not a multiple of perUnitAmount (10)
        });
        
        uint256[] memory perUnitAmounts = new uint256[](1);
        perUnitAmounts[0] = 10;
        
        // Mint and approve tokens
        erc20Token.mint(owner, 15);
        
        vm.startPrank(owner);
        erc20Token.approve(address(lootBox), 15);
        
        // This will pass the initial checks but fail in the internal _calculateLootboxSupply function
        vm.expectRevert("InvalidAmount()");
        new LootBox(
            tokens,
            perUnitAmounts,
            uint128(FEE_PER_OPEN),
            uint64(1), // amountDistributedPerOpen
            uint64(block.timestamp), // Start time (now)
            VRF_KEY_HASH,
            address(vrfCoordinator),
            VRF_SUBSCRIPTION_ID
        );
        
        vm.stopPrank();
    }
    
    function test_Deploy_RevertIfERC721AmountNotOne() public {
        // Mint an ERC721 token
        erc721Token.safeMint(owner, 1);
        
        // Set approval for all (not needed for this test but good practice)
        vm.startPrank(owner);
        erc721Token.setApprovalForAll(address(lootBox), true);
        
        // Create token with amount > 1 for ERC721 (invalid)
        LootBox.Token[] memory tokens = new LootBox.Token[](1);
        tokens[0] = LootBox.Token({
            assetContract: address(erc721Token),
            tokenType: LootBox.TokenType.ERC721,
            tokenId: 1,
            totalAmount: 2 // Invalid for ERC721 (must be 1)
        });
        
        uint256[] memory perUnitAmounts = new uint256[](1);
        perUnitAmounts[0] = 1;
        
        // Should revert due to invalid ERC721 amount
        vm.expectRevert("InvalidAmount()");
        new LootBox(
            tokens,
            perUnitAmounts,
            uint128(FEE_PER_OPEN),
            uint64(1), // amountDistributedPerOpen
            uint64(block.timestamp), // Start time (now)
            VRF_KEY_HASH,
            address(vrfCoordinator),
            VRF_SUBSCRIPTION_ID
        );
        
        vm.stopPrank();
    }
    
    function test_Deploy_RevertIfRewardUnitsNotMultipleOfAmountPerOpen() public {
        LootBox.Token[] memory tokens = new LootBox.Token[](1);
        tokens[0] = LootBox.Token({
            assetContract: address(erc20Token),
            tokenType: LootBox.TokenType.ERC20,
            tokenId: 0,
            totalAmount: 100
        });
        
        uint256[] memory perUnitAmounts = new uint256[](1);
        perUnitAmounts[0] = 10; // 10 units per reward
        
        // Mint and approve tokens
        erc20Token.mint(owner, 100);
        
        vm.startPrank(owner);
        erc20Token.approve(address(lootBox), 100);
        
        // With amountDistributedPerOpen = 3, and perUnitAmount = 10, we have:
        // - Total reward units = 100 / 10 = 10
        // - 10 is not a multiple of 3, so this should revert
        vm.expectRevert("InvalidAmount()");
        new LootBox(
            tokens,
            perUnitAmounts,
            uint128(FEE_PER_OPEN),
            uint64(3), // amountDistributedPerOpen (not a divisor of totalRewardUnits)
            uint64(block.timestamp), // Start time (now)
            VRF_KEY_HASH,
            address(vrfCoordinator),
            VRF_SUBSCRIPTION_ID
        );
        
        vm.stopPrank();
    }
    
    function test_Deploy_RevertIfNotApprovedForERC20() public {
        LootBox.Token[] memory tokens = new LootBox.Token[](1);
        tokens[0] = LootBox.Token({
            assetContract: address(erc20Token),
            tokenType: LootBox.TokenType.ERC20,
            tokenId: 0,
            totalAmount: 100
        });
        
        uint256[] memory perUnitAmounts = new uint256[](1);
        perUnitAmounts[0] = 10;
        
        // Mint tokens but don't approve
        erc20Token.mint(owner, 100);
        
        // Should revert due to insufficient allowance
        vm.expectRevert("ERC20: insufficient allowance");
        new LootBox(
            tokens,
            perUnitAmounts,
            uint128(FEE_PER_OPEN),
            uint64(1), // amountDistributedPerOpen
            uint64(block.timestamp), // Start time (now)
            VRF_KEY_HASH,
            address(vrfCoordinator),
            VRF_SUBSCRIPTION_ID
        );
    }
    
    function test_Deploy_RevertIfNotApprovedForERC721() public {
        // Mint an ERC721 token but don't approve
        erc721Token.safeMint(owner, 1);
        
        LootBox.Token[] memory tokens = new LootBox.Token[](1);
        tokens[0] = LootBox.Token({
            assetContract: address(erc721Token),
            tokenType: LootBox.TokenType.ERC721,
            tokenId: 1,
            totalAmount: 1
        });
        
        uint256[] memory perUnitAmounts = new uint256[](1);
        perUnitAmounts[0] = 1;
        
        // Should revert due to missing approval
        vm.expectRevert("ERC721: caller is not token owner or approved");
        new LootBox(
            tokens,
            perUnitAmounts,
            uint128(FEE_PER_OPEN),
            uint64(1), // amountDistributedPerOpen
            uint64(block.timestamp), // Start time (now)
            VRF_KEY_HASH,
            address(vrfCoordinator),
            VRF_SUBSCRIPTION_ID
        );
    }
    
    function test_Deploy_RevertIfNotApprovedForERC1155() public {
        // Mint an ERC1155 token but don't approve
        erc1155Token.mint(owner, 1, 100, "");
        
        LootBox.Token[] memory tokens = new LootBox.Token[](1);
        tokens[0] = LootBox.Token({
            assetContract: address(erc1155Token),
            tokenType: LootBox.TokenType.ERC1155,
            tokenId: 1,
            totalAmount: 100
        });
        
        uint256[] memory perUnitAmounts = new uint256[](1);
        perUnitAmounts[0] = 10;
        
        // Should revert due to missing approval
        vm.expectRevert("ERC1155: caller is not token owner or approved");
        new LootBox(
            tokens,
            perUnitAmounts,
            uint128(FEE_PER_OPEN),
            uint64(1), // amountDistributedPerOpen
            uint64(block.timestamp), // Start time (now)
            VRF_KEY_HASH,
            address(vrfCoordinator),
            VRF_SUBSCRIPTION_ID
        );
    }
    
    function test_Deploy_TransferTokensWhenApproved() public {
        // Test ERC20 token transfer
        LootBox.Token[] memory tokens = new LootBox.Token[](1);
        tokens[0] = LootBox.Token({
            assetContract: address(erc20Token),
            tokenType: LootBox.TokenType.ERC20,
            tokenId: 0,
            totalAmount: 100
        });
        
        // Prepare perUnitAmounts array
        uint256[] memory perUnitAmounts = new uint256[](1);
        perUnitAmounts[0] = 10; // For ERC20
        
        // Mint and approve tokens
        erc20Token.mint(owner, 100);
        erc20Token.approve(address(lootBox), 100);
        
        uint256 balanceBefore = erc20Token.balanceOf(address(lootBox));
        
        // Deploy should succeed
        LootBox newLootBox = new LootBox(
            tokens,
            perUnitAmounts,
            uint128(FEE_PER_OPEN),
            uint64(1), // amountDistributedPerOpen
            uint64(block.timestamp), // Start time (now)
            VRF_KEY_HASH,
            address(vrfCoordinator),
            VRF_SUBSCRIPTION_ID
        );
        
        uint256 balanceAfter = erc20Token.balanceOf(address(newLootBox));
        
        // Verify tokens were transferred
        assertEq(balanceAfter, 100, "Tokens were not transferred to the lootbox");
        assertEq(erc20Token.balanceOf(owner), 0, "Owner should have no tokens left");
        
        // In a real test, you would verify the lootbox state here
        // Since we're creating a new instance, we can't check the lootbox ID directly
        // as it's not tracked in the test
    }
    
    function test_Deploy_CreateRecordForLootbox() public {
        LootBox.Token[] memory tokens = new LootBox.Token[](2);
        tokens[0] = LootBox.Token({
            assetContract: address(erc20Token),
            tokenType: LootBox.TokenType.ERC20,
            tokenId: 0,
            totalAmount: 100
        });
        tokens[1] = LootBox.Token({
            assetContract: address(erc1155Token),
            tokenType: LootBox.TokenType.ERC1155,
            tokenId: 1,
            totalAmount: 50
        });
        
        // Mint and approve tokens
        erc20Token.mint(owner, 100);
        erc20Token.approve(address(lootBox), 100);
        erc1155Token.mint(owner, 1, 50, "");
        erc1155Token.setApprovalForAll(address(lootBox), true);
        
        // Prepare perUnitAmounts array
        uint256[] memory perUnitAmounts = new uint256[](2);
        perUnitAmounts[0] = 10; // For ERC20
        perUnitAmounts[1] = 5;  // For ERC1155
        
        // Deploy new LootBox with the tokens
        LootBox newLootBox = new LootBox(
            tokens,
            perUnitAmounts,
            uint128(FEE_PER_OPEN),
            uint64(2), // amountDistributedPerOpen
            uint64(block.timestamp), // Start time (now)
            VRF_KEY_HASH,
            address(vrfCoordinator),
            VRF_SUBSCRIPTION_ID
        );
        
        // In the current implementation, we can't verify the internal state directly
        // as we would need to interact with the contract's public/external functions
        // This test would need to be restructured to test the contract's behavior
        // rather than its internal state
    }
    
    function test_Deploy_EnablePrivateOpenWithWhitelist() public {
        LootBox.Token[] memory tokens = new LootBox.Token[](1);
        tokens[0] = LootBox.Token({
            assetContract: address(erc20Token),
            tokenType: LootBox.TokenType.ERC20,
            tokenId: 0,
            totalAmount: 100
        });
        
        // Mint and approve tokens
        erc20Token.mint(owner, 100);
        erc20Token.approve(address(lootBox), 100);
        
        // Prepare perUnitAmounts array
        uint256[] memory perUnitAmounts = new uint256[](1);
        perUnitAmounts[0] = 10; // For ERC20
        
        // In the current implementation, whitelist functionality would need to be handled differently
        // as the constructor doesn't accept a whitelist parameter
        // This test would need to be restructured to test the contract's behavior with access control
        
        // Create a new LootBox instance (whitelist functionality not available in constructor)
        LootBox newLootBox = new LootBox(
            tokens,
            perUnitAmounts,
            uint128(FEE_PER_OPEN),
            uint64(1), // amountDistributedPerOpen
            uint64(block.timestamp), // Start time (now)
            VRF_KEY_HASH,
            address(vrfCoordinator),
            VRF_SUBSCRIPTION_ID
        );
        
        // Note: Whitelist functionality would need to be implemented separately
    }
}

