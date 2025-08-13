// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./PiggyBank.sol";
import "./interfaces/IPiggyBankFactory.sol";

contract PiggyBankFactory is Ownable, ReentrancyGuard, IPiggyBankFactory {
    using SafeERC20 for IERC20;

    mapping(address => address[]) public userPiggyBanks;
    mapping(address => bool) public isPiggyBank;
    address[] public allPiggyBanks;

    event PiggyBankCreated(address indexed user, address indexed piggyBank, uint256 index);
    event PenaltyCollected(address indexed user, uint256 amount, address token);

    // OpenZeppelin 5.x requires initialOwner in Ownable constructor
    constructor() Ownable(msg.sender) {}

    /**
     * @dev Create a new piggy bank for the caller
     */
    function createPiggyBank() external returns (address) {
        PiggyBank newPiggyBank = new PiggyBank(msg.sender, address(this));
        address piggyBankAddress = address(newPiggyBank);

        userPiggyBanks[msg.sender].push(piggyBankAddress);
        isPiggyBank[piggyBankAddress] = true;
        allPiggyBanks.push(piggyBankAddress);

        emit PiggyBankCreated(msg.sender, piggyBankAddress, userPiggyBanks[msg.sender].length - 1);
        return piggyBankAddress;
    }

    /**
     * @dev Get all piggy banks for a user
     */
    function getUserPiggyBanks(address _user) external view returns (address[] memory) {
        return userPiggyBanks[_user];
    }

    /**
     * @dev Get the number of piggy banks for a user
     */
    function getUserPiggyBankCount(address _user) external view returns (uint256) {
        return userPiggyBanks[_user].length;
    }

    /**
     * @dev Get total balance for a user across all piggy banks for a specific token
     */
    function getUserTotalBalance(address _user, address _token) external view returns (uint256) {
        uint256 totalBalance = 0;
        address[] memory piggyBanks = userPiggyBanks[_user];

        for (uint256 i = 0; i < piggyBanks.length; i++) {
            totalBalance += PiggyBank(piggyBanks[i]).getTotalBalance(_token);
        }

        return totalBalance;
    }

    /**
     * @dev Get total number of savings accounts for a user
     */
    function getUserTotalSavingsAccounts(address _user) external view returns (uint256) {
        uint256 totalAccounts = 0;
        address[] memory piggyBanks = userPiggyBanks[_user];

        for (uint256 i = 0; i < piggyBanks.length; i++) {
            totalAccounts += PiggyBank(piggyBanks[i]).getTotalAccounts();
        }

        return totalAccounts;
    }

    /**
     * @dev Collect ETH penalty from piggy bank contracts
     */
    function collectPenalty() external payable override {
        require(isPiggyBank[msg.sender], "Only piggy banks can call this");
        emit PenaltyCollected(tx.origin, msg.value, address(0));
    }

    /**
     * @dev Collect token penalty from piggy bank contracts
     */
    function collectTokenPenalty(address _token, uint256 _amount) external override {
        require(isPiggyBank[msg.sender], "Only piggy banks can call this");
        emit PenaltyCollected(tx.origin, _amount, _token);
    }

    /**
     * @dev Withdraw collected ETH penalties (only owner)
     */
    function withdrawETHPenalties() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH to withdraw");
        payable(owner()).transfer(balance);
    }

    /**
     * @dev Withdraw collected token penalties (only owner)
     */
    function withdrawTokenPenalties(address _token) external onlyOwner nonReentrant {
        uint256 balance = IERC20(_token).balanceOf(address(this));
        require(balance > 0, "No tokens to withdraw");
        IERC20(_token).safeTransfer(owner(), balance);
    }

    /**
     * @dev Get all piggy banks
     */
    function getAllPiggyBanks() external view returns (address[] memory) {
        return allPiggyBanks;
    }

    /**
     * @dev Get comprehensive user data
     */
    function getUserData(
        address _user
    )
        external
        view
        returns (
            address[] memory piggyBanks,
            uint256 totalSavingsAccounts,
            uint256 totalETHBalance,
            uint256 factoryPenaltyETH
        )
    {
        return (
            userPiggyBanks[_user],
            this.getUserTotalSavingsAccounts(_user),
            this.getUserTotalBalance(_user, address(0)),
            address(this).balance
        );
    }

    /**
     * @dev Get factory statistics
     */
    function getFactoryStats()
        external
        view
        returns (
            uint256 totalPiggyBanks,
            uint256 ethBalance,
            address factoryOwner
        )
    {
        return (
            allPiggyBanks.length,
            address(this).balance,
            owner()
        );
    }

    // Fallback to receive ETH
    receive() external payable {}
}
