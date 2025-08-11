// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;
import "../contracts/piggybank.sol";

contract PiggybankFactory {
    address public owner;
    Piggybank[] public piggybanks;

    event PiggybankCreated(address indexed piggybankAddress, address indexed creator);

    constructor() {
        owner = msg.sender;
    }

    function createPiggybank() external returns (address) {
        Piggybank newPiggybank = new Piggybank(owner);
        piggybanks.push(newPiggybank);
        emit PiggybankCreated(address(newPiggybank), msg.sender);
        return address(newPiggybank);
    }

    function getAllPiggybanks() external view returns (Piggybank[] memory) {
        return piggybanks;
    }
}