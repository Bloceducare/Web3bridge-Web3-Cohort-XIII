// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/LootteryBox.sol";
import "../src/BoxToken.sol";
import "../src/BoxNFT.sol";
import "../src/SemiBoxToken.sol";

contract LootteryBoxTest is Test {
    LootteryBox public lootBox;
    address public owner;
    address public creator;
    address public player;
    address public vrfCoordinator;
    
    uint256 constant SUBSCRIPTION_ID = 1;
    bytes32 constant KEY_HASH = 0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae;
    
    string constant BOX_NAME = "Mystery Box 1";
    uint256 constant TOTAL_BOXES = 100;
    uint256 constant OPENING_FEE = 0.01 ether;
    string constant NFT_URI = "https://emerald-tropical-pinniped-712.mypinata.cloud/ipfs/bafkreic7ty3mmq26yncese7q6skvzhjllsj5vp5nvnzfhpu5p5lpol4uaq";
    string constant SNFT_URI = "https://emerald-tropical-pinniped-712.mypinata.cloud/ipfs/bafkreic7ty3mmq26yncese7q6skvzhjllsj5vp5nvnzfhpu5p5lpol4uaq";
    
    function setUp() public {
        owner = address(this);
        creator = makeAddr("creator");
        player = makeAddr("player");
        vrfCoordinator = makeAddr("vrfCoordinator");
        
        vm.deal(player, 10 ether);
        vm.deal(creator, 5 ether);
        
        lootBox = new LootteryBox(
            owner,
            SUBSCRIPTION_ID,
            vrfCoordinator,
            KEY_HASH
        );
        
        console.log("LootBox deployed at:", address(lootBox));
        console.log("Owner:", lootBox.owner());
    }
    
    function testInitialState() public view {
        assertEq(lootBox.boxCount(), 0);
        assertEq(lootBox.owner(), owner);
    }
    
    function testCreateBox() public {
        vm.prank(creator);
        (address tokenAddr, address nftAddr, address itemsAddr) = lootBox.createBox(
            BOX_NAME,
            TOTAL_BOXES,
            OPENING_FEE,
            NFT_URI,
            SNFT_URI
        );
        
        assertEq(lootBox.boxCount(), 1);
        
        LootteryBox.Box memory box = lootBox.getBox(0);
        assertEq(box.boxName, BOX_NAME);
        assertEq(box.boxTokenAddress, tokenAddr);
        assertEq(box.boxNFTAddress, nftAddr);
        assertEq(box.boxItemsAddress, itemsAddr);
        assertEq(box.openingFee, OPENING_FEE);
        assertEq(box.totalBoxContent, TOTAL_BOXES);
        assertEq(box.remainingContent, TOTAL_BOXES);
        assertTrue(box.isActive);
        
        BoxToken token = BoxToken(tokenAddr);
        uint256 expectedSupply = (TOTAL_BOXES * 70 / 100) * 1e18;
        assertEq(token.balanceOf(address(lootBox)), expectedSupply);
        
        BoxNFT nft = BoxNFT(nftAddr);
        assertEq(nft.owner(), address(lootBox));
        
        SemiBoxToken semiToken = SemiBoxToken(itemsAddr);
        assertEq(semiToken.owner(), address(lootBox));
        
        console.log("Box created successfully!");
        console.log("Token Address:", tokenAddr);
        console.log("NFT Address:", nftAddr);
        console.log("Items Address:", itemsAddr);
    }
    
    function testCreateBoxWithZeroContent() public {
        vm.expectRevert(LootteryBox.TOTAL_BOXES_IS_NEEDED.selector);
        vm.prank(creator);
        lootBox.createBox(
            BOX_NAME,
            0,
            OPENING_FEE,
            NFT_URI,
            SNFT_URI
        );
    }
    
    function testOpenBoxSuccessfully() public {
        vm.prank(creator);
        lootBox.createBox(
            BOX_NAME,
            TOTAL_BOXES,
            OPENING_FEE,
            NFT_URI,
            SNFT_URI
        );
        
        uint256 initialBalance = address(lootBox).balance;
        
        vm.mockCall(
            vrfCoordinator,
            abi.encodeWithSelector(bytes4(keccak256("requestRandomWords(tuple)"))),
            abi.encode(uint256(123))
        );
        
        vm.prank(player);
        lootBox.openBox{value: OPENING_FEE}(0);
        
        LootteryBox.Box memory box = lootBox.getBox(0);
        assertEq(box.remainingContent, TOTAL_BOXES - 1);
        
        console.log("Box opened successfully!");
        console.log("Remaining content:", box.remainingContent);
    }
    
    function testOpenBoxInsufficientPayment() public {
        vm.prank(creator);
        lootBox.createBox(
            BOX_NAME,
            TOTAL_BOXES,
            OPENING_FEE,
            NFT_URI,
            SNFT_URI
        );
        
        vm.expectRevert(LootteryBox.INSUFFICIENT_FUND.selector);
        vm.prank(player);
        lootBox.openBox{value: OPENING_FEE - 1}(0);
    }
    
    function testOpenBoxWhenInactive() public {
        vm.prank(creator);
        lootBox.createBox(
            BOX_NAME,
            1,
            OPENING_FEE,
            NFT_URI,
            SNFT_URI
        );
        
        vm.mockCall(
            vrfCoordinator,
            abi.encodeWithSelector(bytes4(keccak256("requestRandomWords(tuple)"))),
            abi.encode(uint256(123))
        );
        
        vm.prank(player);
        lootBox.openBox{value: OPENING_FEE}(0);
        
        vm.expectRevert(LootteryBox.BOX_CLOSED.selector);
        vm.prank(player);
        lootBox.openBox{value: OPENING_FEE}(0);
    }
    
    function testOpenBoxWhenSoldOut() public {
        vm.prank(creator);
        lootBox.createBox(
            BOX_NAME,
            1,
            OPENING_FEE,
            NFT_URI,
            SNFT_URI
        );
        
        vm.mockCall(
            vrfCoordinator,
            abi.encodeWithSelector(bytes4(keccak256("requestRandomWords(tuple)"))),
            abi.encode(uint256(123))
        );
        
        vm.prank(player);
        lootBox.openBox{value: OPENING_FEE}(0);
        
        vm.expectRevert(LootteryBox.LEVEL_COMPLETED.selector);
        vm.prank(player);
        lootBox.openBox{value: OPENING_FEE}(0);
    }
    
    function testOpenNonExistentBox() public {
        vm.expectRevert(LootteryBox.BOX_NOT_FOUND.selector);
        vm.prank(player);
        lootBox.openBox{value: OPENING_FEE}(999);
    }
    
    function testRewardWeights() public {
        vm.prank(creator);
        lootBox.createBox(
            BOX_NAME,
            TOTAL_BOXES,
            OPENING_FEE,
            NFT_URI,
            SNFT_URI
        );
        
        LootteryBox.RewardWeights memory weights = lootBox.getRewardWeights(0);
        assertEq(weights.tokenWeight, 7000);
        assertEq(weights.nftWeight, 2000);
        assertEq(weights.semiWeight, 1000);
        assertEq(weights.totalWeight, 10000);
        
        console.log("Reward weights verified!");
    }
    
    function testIsBoxActive() public {
        vm.prank(creator);
        lootBox.createBox(
            BOX_NAME,
            TOTAL_BOXES,
            OPENING_FEE,
            NFT_URI,
            SNFT_URI
        );
        
        assertTrue(lootBox.isBoxActive(0));
        assertFalse(lootBox.isBoxActive(999));
        
        console.log("Box active status verified!");
    }
    
    function testMultipleBoxes() public {
        for (uint i = 0; i < 3; i++) {
            vm.prank(creator);
            lootBox.createBox(
                string(abi.encodePacked("Box ", vm.toString(i))),
                TOTAL_BOXES + i * 10,
                OPENING_FEE + i * 0.001 ether,
                NFT_URI,
                SNFT_URI
            );
        }
        
        assertEq(lootBox.boxCount(), 3);
        
        for (uint i = 0; i < 3; i++) {
            LootteryBox.Box memory box = lootBox.getBox(i);
            assertEq(box.boxName, string(abi.encodePacked("Box ", vm.toString(i))));
            assertEq(box.totalBoxContent, TOTAL_BOXES + i * 10);
            assertEq(box.openingFee, OPENING_FEE + i * 0.001 ether);
            assertTrue(box.isActive);
        }
        
        console.log("Multiple boxes created successfully!");
    }
    
    function testEmergencyWithdraw() public {
        vm.deal(address(lootBox), 1 ether);
        
        uint256 ownerBalanceBefore = owner.balance;
        uint256 contractBalanceBefore = address(lootBox).balance;
        
        lootBox.emergencyWithdraw();
        
        assertEq(address(lootBox).balance, 0);
        assertEq(owner.balance, ownerBalanceBefore + contractBalanceBefore);
        
        console.log("Emergency withdraw successful!");
    }
    
    function testEmergencyWithdrawNonOwner() public {
        vm.expectRevert();
        vm.prank(player);
        lootBox.emergencyWithdraw();
    }
    
    function testGetBoxNonExistent() public {
        vm.expectRevert(LootteryBox.BOX_NOT_FOUND.selector);
        lootBox.getBox(0);
    }
    
    function testGetRewardWeightsNonExistent() public {
        vm.expectRevert(LootteryBox.BOX_NOT_FOUND.selector);
        lootBox.getRewardWeights(0);
    }
    
    function testReceiveEther() public {
        uint256 amount = 1 ether;
        vm.deal(player, amount);
        
        vm.prank(player);
        (bool success,) = address(lootBox).call{value: amount}("");
        assertTrue(success);
        assertEq(address(lootBox).balance, amount);
        
        console.log("Contract can receive Ether!");
    }
    
    function testFallbackFunction() public {
        uint256 amount = 0.5 ether;
        vm.deal(player, amount);
        
        vm.prank(player);
        (bool success,) = address(lootBox).call{value: amount}("nonexistentfunction()");
        assertTrue(success);
        assertEq(address(lootBox).balance, amount);
        
        console.log("Fallback function works!");
    }
}