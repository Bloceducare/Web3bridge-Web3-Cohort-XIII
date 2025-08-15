// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./PiggyBank.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract PiggyBankFactory {
    address public owner;

    mapping(address => address[]) private userPiggyBanks;

    struct PiggyInfo {
        address owner;
        uint256 lockPeriod;
        uint256 createdAt;
    }

    mapping(address => PiggyInfo) public piggyInfo;

    event PiggyBankCreated(address indexed piggy, address indexed owner, uint256 lockPeriod);
    event WithdrawETH(address indexed to, uint256 amount);
    event WithdrawToken(address indexed token, address indexed to, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not factory owner");
        _;
    }

    constructor() {
        owner = msg.sender; // Set deployer as factory owner
    }

    function createPiggyBank(address piggyOwner, uint256 lockPeriodSeconds) external returns (address) {
        PiggyBank piggyBank = new PiggyBank(piggyOwner, lockPeriodSeconds, address(this));
        address piggyBankAddress = address(piggyBank);

        userPiggyBanks[piggyOwner].push(piggyBankAddress);
        piggyInfo[piggyBankAddress] = PiggyInfo({
            owner: piggyOwner,
            lockPeriod: lockPeriodSeconds,
            createdAt: block.timestamp
        });

        emit PiggyBankCreated(piggyBankAddress, piggyOwner, lockPeriodSeconds);

        return piggyBankAddress;
    }

    function getPiggyBanks(address account) external view returns (address[] memory) {
        return userPiggyBanks[account];
    }

    function getPiggyBankCount(address account) external view returns (uint256) {
        return userPiggyBanks[account].length;
    }

    function totalBalanceOf(address account, address token) external view returns (uint256 total) {
        address[] memory arr = userPiggyBanks[account];
        for (uint256 i = 0; i < arr.length; i++) {
            total += PiggyBank(payable(arr[i])).balanceOf(token);
        }
    }


    function withdrawETH(uint256 amount) external onlyOwner {
        require(address(this).balance >= amount, "Insufficient ETH balance");
        payable(owner).transfer(amount);
        emit WithdrawETH(owner, amount);
    }

    function withdrawToken(address token, uint256 amount) external onlyOwner {
        require(IERC20(token).balanceOf(address(this)) >= amount, "Insufficient token balance");
        IERC20(token).transfer(owner, amount);
        emit WithdrawToken(token, owner, amount);
    }

    receive() external payable {}
}
