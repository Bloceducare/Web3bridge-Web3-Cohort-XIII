// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { BoxToken } from "./BoxToken.sol";
import { BoxNFT } from "./BoxNFT.sol";
import { SemiBoxToken } from "./SemiBoxToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";

contract LootteryBox is Ownable, VRFConsumerBaseV2Plus {
    
    uint256 private immutable subId;
    bytes32 private immutable keyHash;
    uint32 private constant callbackGasLimit = 100000;
    uint16 private constant requestConfirmations = 3;
    uint32 private constant numWords = 1;
    
    address admin;

    constructor(
        address initialOwner,
        uint256 _subId,
        address _vrfCoordinator,
        bytes32 _keyHash
    ) Ownable(initialOwner) VRFConsumerBaseV2Plus(_vrfCoordinator) {
        subId = _subId;
        keyHash = _keyHash;
        admin = msg.sender;
    }

    struct Box {
        string boxName;
        address boxTokenAddress;
        address boxNFTAddress;
        address boxItemsAddress;
        uint256 openingFee;
        uint256 totalBoxContent;
        uint256 remainingContent;
        string nftURI;
        string snftURI;
        bool isActive;
    }

    struct RewardWeights {
        uint256 tokenWeight;
        uint256 nftWeight;
        uint256 semiWeight;
        uint256 totalWeight;
    }

    struct PendingBox {
        uint256 boxId;
        address opener;
    }

    error LEVEL_COMPLETED();
    error PAYMENT_FAILED();
    error ONLY_ORGANIZER_CAN_CALL();
    error BOX_CLOSED();
    error TOTAL_BOXES_IS_NEEDED();
    error INSUFFICIENT_FUND();
    error BOX_NOT_FOUND();
    error INVALID_WEIGHTS();

    uint256 public boxCount;
    mapping(uint256 => Box) public boxes;
    mapping(uint256 => RewardWeights) public rewardWeights;
    mapping(uint256 => PendingBox) public pendingBoxOpenings;

    event BoxCreated(
        uint256 indexed boxId, 
        address indexed organizer,
        address boxToken, 
        address boxNFT, 
        address boxItems,
        string boxName,
        uint256 totalBoxes,
        uint256 openingFee
    );
    event LevelCompleted(string boxName, uint256 indexed boxCount);
    event BoxOpened(uint256 indexed boxId, address opener, uint256 indexed requestId);
    event RewardDistributed(
        uint256 indexed boxId,
        address indexed recipient,
        uint8 rewardType,
        address rewardContract,
        uint256 amount,
        uint256 tokenId
    );
    
    function createBox(
        string memory _boxName, 
        uint256 _totalBoxContent, 
        uint256 _openingFee,
        string memory _nftURI,
        string memory _snftURI
    ) external returns (address boxTokenAddress, address boxNFTAddress, address boxItemsAddress) {
        if (_totalBoxContent == 0) revert TOTAL_BOXES_IS_NEEDED();

        uint256 tokenRewards = (_totalBoxContent * 70) / 100;

        BoxToken erc20 = new BoxToken(tokenRewards * 1e18, address(this));
        BoxNFT nft = new BoxNFT(address(this));
        SemiBoxToken semitoken = new SemiBoxToken(address(this));

        boxes[boxCount] = Box({
            boxName: _boxName,
            boxTokenAddress: address(erc20),
            boxNFTAddress: address(nft),
            boxItemsAddress: address(semitoken),
            openingFee: _openingFee,
            totalBoxContent: _totalBoxContent,
            remainingContent: _totalBoxContent,
            nftURI: _nftURI,
            snftURI: _snftURI,
            isActive: true
        });

        rewardWeights[boxCount] = RewardWeights({
            tokenWeight: 7000,
            nftWeight: 2000,
            semiWeight: 1000,
            totalWeight: 10000
        });

        boxTokenAddress = address(erc20);
        boxNFTAddress = address(nft);
        boxItemsAddress = address(semitoken);

        emit BoxCreated(
            boxCount,
            msg.sender,
            boxTokenAddress,
            boxNFTAddress,
            boxItemsAddress,
            _boxName,
            _totalBoxContent,
            _openingFee
        );

        boxCount++;
    }

    function openBox(uint256 _boxId) external payable {
        if (_boxId >= boxCount) revert BOX_NOT_FOUND();
        
        Box storage box = boxes[_boxId];
        if(!box.isActive) revert BOX_CLOSED();
        if (box.remainingContent == 0) revert LEVEL_COMPLETED();
        if (msg.value < box.openingFee) revert INSUFFICIENT_FUND();

        (bool success, ) = payable(admin).call{value: msg.value}("");
        if (!success) revert PAYMENT_FAILED();
        
        box.remainingContent--;

        if(box.remainingContent == 0) {
            box.isActive = false;
            emit LevelCompleted(box.boxName, _boxId);
        }

        uint256 requestId = s_vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: keyHash,
                subId: subId,
                requestConfirmations: requestConfirmations,
                callbackGasLimit: callbackGasLimit,
                numWords: numWords,
                extraArgs: VRFV2PlusClient._argsToBytes(
                    VRFV2PlusClient.ExtraArgsV1({nativePayment: true})
                )
            })
        );

        pendingBoxOpenings[requestId] = PendingBox({boxId: _boxId, opener: msg.sender});
        emit BoxOpened(_boxId, msg.sender, requestId);
    }

    function fulfillRandomWords(uint256 requestId, uint256[] calldata randomWords) internal override {
        PendingBox memory pending = pendingBoxOpenings[requestId];
        uint256 randomResult = randomWords[0];

        RewardWeights memory weights = rewardWeights[pending.boxId];
        uint256 randomWeight = randomResult % weights.totalWeight;
        
        if(randomWeight < weights.tokenWeight) {
            awardERC20(pending.boxId, pending.opener, randomResult);
        } else if (randomWeight < weights.tokenWeight + weights.semiWeight) {
            awardERC1155(pending.boxId, pending.opener, randomResult);
        } else {
            awardERC721(pending.boxId, pending.opener, randomResult);
        }

        delete pendingBoxOpenings[requestId];
    }

    function awardERC20(uint256 boxId, address recipient, uint256 randomSeed) internal {
        Box memory box = boxes[boxId];
        BoxToken token = BoxToken(box.boxTokenAddress);
        
        uint256 amount = 1 + (randomSeed % 100);
        amount = amount * 1e18;
        
        if (token.balanceOf(address(this)) >= amount) {
            token.transfer(recipient, amount);
            
            emit RewardDistributed(
                boxId,
                recipient,
                0,
                box.boxTokenAddress,
                amount,
                0
            );
        }
    }

    function awardERC721(uint256 boxId, address recipient, uint256 randomSeed) internal {
        Box memory box = boxes[boxId];
        BoxNFT nft = BoxNFT(box.boxNFTAddress);
        
        try nft.mintBoxNFT(recipient, box.nftURI) {
            uint256 tokenId = nft.nextTokenId() - 1;
            emit RewardDistributed(
                boxId,
                recipient,
                1,
                box.boxNFTAddress,
                1,
                tokenId
            );
        } catch {
            awardERC20(boxId, recipient, randomSeed);
        }
    }

    function awardERC1155(uint256 boxId, address recipient, uint256 randomSeed) internal {
        Box memory box = boxes[boxId];
        SemiBoxToken semiToken = SemiBoxToken(box.boxItemsAddress);
        
        uint256 amount = 1 + (randomSeed % 5);
        
        try semiToken.mintItem(recipient, amount, box.snftURI) {
            uint256 tokenId = semiToken.tokenId() - 1;
            emit RewardDistributed(
                boxId,
                recipient,
                2,
                box.boxItemsAddress,
                amount,
                tokenId
            );
        } catch {
            awardERC20(boxId, recipient, randomSeed);
        }
    }

    function getBox(uint256 boxId) external view returns (Box memory) {
        if (boxId >= boxCount) revert BOX_NOT_FOUND();
        return boxes[boxId];
    }

    function getRewardWeights(uint256 boxId) external view returns (RewardWeights memory) {
        if (boxId >= boxCount) revert BOX_NOT_FOUND();
        return rewardWeights[boxId];
    }

    function isBoxActive(uint256 boxId) external view returns (bool) {
        if (boxId >= boxCount) return false;
        return boxes[boxId].isActive && boxes[boxId].remainingContent > 0;
    }

    function emergencyWithdraw() external onlyOwner {
        (bool success, ) = payable(owner()).call{value: address(this).balance}("");
        require(success, "Emergency withdrawal failed");
    }

    receive() external payable {}
    fallback() external payable {}
}