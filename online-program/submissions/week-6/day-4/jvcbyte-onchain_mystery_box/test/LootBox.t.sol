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
        vrfCoordinator.createSubscription();
        vrfCoordinator.fundSubscription{value: 1 ether}(VRF_SUBSCRIPTION_ID);
        
        // Deploy test tokens first
        erc20Token = new ERC20Mock();
        erc721Token = new ERC721Mock();
        erc1155Token = new ERC1155Mock();
        
        // Deploy LootBox with empty tokens for now - will be populated in individual tests
        LootBox.Token[] memory emptyTokens = new LootBox.Token[](0);
        uint256[] memory emptyAmounts = new uint256[](0);
        
        lootBox = new LootBox(
            emptyTokens,
            emptyAmounts,
            FEE_PER_OPEN,
            1, // amountDistributedPerOpen
            uint64(block.timestamp), // openStartTimestamp
            VRF_KEY_HASH,
            address(vrfCoordinator),
            VRF_SUBSCRIPTION_ID
        );
        
        // Add LootBox as a consumer
        vrfCoordinator.addConsumer(VRF_SUBSCRIPTION_ID, address(lootBox));
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
        uint256 lootboxId = lootBox.deploy(
            tokens,
            perUnitAmounts,
            FEE_PER_OPEN,
            amountDistributedPerOpen,
            uint64(block.timestamp) // Start time (now)
        );
        
        vm.stopPrank();
        return lootboxId;
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
        lootBox.deploy(
            tokens,
            perUnitAmounts,
            FEE_PER_OPEN,
            1, // amountDistributedPerOpen
            uint64(block.timestamp) // Start time
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
        lootBox.deploy(
            tokens,
            perUnitAmounts,
            FEE_PER_OPEN,
            2, // amountDistributedPerOpen
            uint64(block.timestamp) // Start time
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
        lootBox.deploy(
            tokens,
            perUnitAmounts,
            FEE_PER_OPEN,
            1, // amountDistributedPerOpen
            uint64(block.timestamp) // Start time
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
        lootBox.deploy(
            tokens,
            perUnitAmounts,
            FEE_PER_OPEN,
            1, // amountDistributedPerOpen
            uint64(block.timestamp) // Start time
        );
        
        vm.stopPrank();
    }
    
    function test_Deploy_RevertIfERC721AmountNotOne() public {
        // Mint an ERC721 token
        erc721Token.mint(owner, 1);
        
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
        lootBox.deploy(
            tokens,
            perUnitAmounts,
            FEE_PER_OPEN,
            1, // amountDistributedPerOpen
            uint64(block.timestamp) // Start time
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
        lootBox.deploy(
            tokens,
            perUnitAmounts,
            FEE_PER_OPEN,
            3, // amountDistributedPerOpen (not a divisor of totalRewardUnits)
            uint64(block.timestamp) // Start time
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
        lootBox.deploy(
            tokens,
            perUnitAmounts,
            FEE_PER_OPEN,
            1, // amountDistributedPerOpen
            uint64(block.timestamp) // Start time
        );
    }
    
    function test_Deploy_RevertIfNotApprovedForERC721() public {
        // Mint an ERC721 token but don't approve
        erc721Token.mint(owner, 1);
        
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
        lootBox.deploy(
            tokens,
            perUnitAmounts,
            FEE_PER_OPEN,
            1, // amountDistributedPerOpen
            uint64(block.timestamp) // Start time
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
        lootBox.deploy(
            tokens,
            perUnitAmounts,
            FEE_PER_OPEN,
            1, // amountDistributedPerOpen
            uint64(block.timestamp) // Start time
        );
    }
    
    function test_Deploy_TransferTokensWhenApproved() public {
        // Test ERC20 token transfer
        LootBox.Token[] memory tokens = new LootBox.Token[](1);
        tokens[0] = LootBox.Token({
            tokenType: LootBox.TokenType.ERC20,
            tokenAddress: address(erc20Token),
            tokenId: 0,
            amount: 100,
            perUnitAmount: 10
        });
        
        // Mint and approve tokens
        erc20Token.mint(owner, 100);
        erc20Token.approve(address(lootBox), 100);
        
        uint256 balanceBefore = erc20Token.balanceOf(address(lootBox));
        
        // Deploy should succeed
        uint256 lootboxId = lootBox.deploy(
            tokens,
            1, // amountDistributedPerOpen
            address(0), // No whitelist
            block.timestamp, // Start time
            block.timestamp + 1 days // End time
        );
        
        uint256 balanceAfter = erc20Token.balanceOf(address(lootBox));
        
        // Verify tokens were transferred
        assertEq(balanceAfter - balanceBefore, 100, "Tokens were not transferred to the lootbox");
        assertEq(erc20Token.balanceOf(owner), 0, "Owner should have no tokens left");
        
        // Verify lootbox record was created
        (,,,uint256 totalRewardUnits,) = lootBox.lootboxes(lootboxId);
        assertEq(totalRewardUnits, 10, "Incorrect number of reward units");
    }
    
    function test_Deploy_CreateRecordForLootbox() public {
        LootBox.Token[] memory tokens = new LootBox.Token[](2);
        tokens[0] = LootBox.Token({
            tokenType: LootBox.TokenType.ERC20,
            tokenAddress: address(erc20Token),
            tokenId: 0,
            amount: 100,
            perUnitAmount: 10
        });
        tokens[1] = LootBox.Token({
            tokenType: LootBox.TokenType.ERC1155,
            tokenAddress: address(erc1155Token),
            tokenId: 1,
            amount: 50,
            perUnitAmount: 5
        });
        
        // Mint and approve tokens
        erc20Token.mint(owner, 100);
        erc20Token.approve(address(lootBox), 100);
        erc1155Token.mint(owner, 1, 50, "");
        erc1155Token.setApprovalForAll(address(lootBox), true);
        
        // Deploy should succeed
        uint256 lootboxId = lootBox.deploy(
            tokens,
            2, // amountDistributedPerOpen
            address(0), // No whitelist
            block.timestamp, // Start time
            block.timestamp + 1 days // End time
        );
        
        // Verify lootbox record was created correctly
        (address creator, uint256 startTime, uint256 endTime, uint256 totalRewardUnits, uint256 amountDistributedPerOpen) = 
            lootBox.lootboxes(lootboxId);
            
        assertEq(creator, owner, "Incorrect creator");
        assertEq(startTime, block.timestamp, "Incorrect start time");
        assertEq(endTime, block.timestamp + 1 days, "Incorrect end time");
        assertEq(totalRewardUnits, 20, "Incorrect total reward units"); // 100/10 + 50/5 = 10 + 10 = 20
        assertEq(amountDistributedPerOpen, 2, "Incorrect amount distributed per open");
        
        // Verify tokens were added to the lootbox
        (LootBox.TokenType tokenType, address tokenAddress, uint256 tokenId, uint256 amount, uint256 perUnit) = 
            lootBox.lootboxTokens(lootboxId, 0);
            
        assertEq(uint256(tokenType), uint256(LootBox.TokenType.ERC20), "Incorrect token type for first token");
        assertEq(tokenAddress, address(erc20Token), "Incorrect token address for first token");
        assertEq(amount, 100, "Incorrect amount for first token");
        assertEq(perUnit, 10, "Incorrect per unit amount for first token");
        
        (tokenType, tokenAddress, tokenId, amount, perUnit) = lootBox.lootboxTokens(lootboxId, 1);
        assertEq(uint256(tokenType), uint256(LootBox.TokenType.ERC1155), "Incorrect token type for second token");
        assertEq(tokenAddress, address(erc1155Token), "Incorrect token address for second token");
        assertEq(amount, 50, "Incorrect amount for second token");
        assertEq(perUnit, 5, "Incorrect per unit amount for second token");
    }
    
    function test_Deploy_EnablePrivateOpenWithWhitelist() public {
        LootBox.Token[] memory tokens = new LootBox.Token[](1);
        tokens[0] = LootBox.Token({
            tokenType: LootBox.TokenType.ERC20,
            tokenAddress: address(erc20Token),
            tokenId: 0,
            amount: 100,
            perUnitAmount: 10
        });
        
        // Mint and approve tokens
        erc20Token.mint(owner, 100);
        erc20Token.approve(address(lootBox), 100);
        
        // Deploy with whitelist
        address whitelist = address(0x1234); // Mock whitelist contract
        
        // Expect the LootBoxDeployed event
        vm.expectEmit(true, true, false, true);
        emit LootBoxDeployed(1, owner);
        
        uint256 lootboxId = lootBox.deploy(
            tokens,
            1, // amountDistributedPerOpen
            whitelist, // Whitelist address
            block.timestamp, // Start time
            block.timestamp + 1 days // End time
        );
        
        // Verify the lootbox is private
        (,,, uint256 totalRewardUnits, ) = lootBox.lootboxes(lootboxId);
        assertEq(totalRewardUnits, 10, "Incorrect total reward units");
        
        // Verify the whitelist was set
        assertEq(lootBox.whitelistHashes(lootboxId), whitelist, "Whitelist hash not set correctly");
    }
}

