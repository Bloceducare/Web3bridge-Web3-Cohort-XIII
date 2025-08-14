// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./LootToken.sol";

contract LootBox is VRFConsumerBaseV2, Ownable {
    VRFCoordinatorV2Interface immutable COORDINATOR;
    bytes32  immutable KEY_HASH;
    uint64   immutable SUB_ID;
    uint16   constant REQUEST_CONFIRM = 3;
    uint32   constant CALLBACK_LIMIT  = 100_000;
    uint32   constant NUM_WORDS       = 1;

    LootToken public immutable loot;
    uint256   public openFee = 0.001 ether;

    struct Request {
        address opener;
        bool    fulfilled;
    }
    mapping(uint256 => Request) public requests;

    event BoxOpened(address indexed opener, uint256 indexed requestId);
    event LootClaimed(address indexed opener, uint256 amount);

    constructor(
        address _vrfCoordinator,
        bytes32 _keyHash,
        uint64  _subId,
        LootToken _loot
    ) VRFConsumerBaseV2(_vrfCoordinator) Ownable(msg.sender) {
        COORDINATOR = VRFCoordinatorV2Interface(_vrfCoordinator);
        KEY_HASH    = _keyHash;
        SUB_ID      = _subId;
        loot        = _loot;
    }

    /* --- owner --- */
    function setFee(uint256 _wei) external onlyOwner {
        openFee = _wei;
    }

    function withdraw(address to) external onlyOwner {
        (bool ok,) = to.call{value: address(this).balance}("");
        require(ok);
    }

    /* --- user --- */
    function openBox() external payable returns (uint256 requestId) {
        require(msg.value == openFee, "fee");

        requestId = COORDINATOR.requestRandomWords(
            KEY_HASH,
            SUB_ID,
            REQUEST_CONFIRM,
            CALLBACK_LIMIT,
            NUM_WORDS
        );
        requests[requestId] = Request(msg.sender, false);
        emit BoxOpened(msg.sender, requestId);
    }

    /* --- VRF callback --- */
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords)
        internal
        override
    {
        Request storage req = requests[requestId];
        require(!req.fulfilled, "done");
        req.fulfilled = true;

        // simple weighted example:
        // 0-50  → 1 token
        // 51-99 → 3 tokens
        // 100   → 10 tokens
        uint256 r = randomWords[0] % 101;
        uint256 amount = (r <= 50) ? 1 : (r <= 99 ? 3 : 10);

        loot.mint(req.opener, 0, amount, "");
        emit LootClaimed(req.opener, amount);
    }

    receive() external payable {}
}