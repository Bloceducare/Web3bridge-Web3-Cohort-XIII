// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

error OnlyFactory();
error OnlyAccountOwner();
error AccountNotExist();
error LockPeriodMustBeGreaterThanZero();
error MustDepositSomething();
error InvalidTokenAddress();
error InsufficientBalance();
error NoPenaltyToReceive();
error NoPenaltiesToWithdraw();

// PiggyBank
// A personal savings vault that can store ETH and ERC20 tokens.
//  Each account inside has a lock period and can apply an early withdrawal penalty.

contract PiggyBank {
    address public factory; // the factory that created this piggy bank
    address public owner; // the user who owns this piggy bank

    mapping(uint256 => address) public accountOwner;

    // One account = one ETH balance + multiple token balances
    struct SavingsAccount {
        uint256 ethBalance;
        mapping(address => uint256) tokenBalances; // token address => balance
        uint256 lockPeriod; // in seconds
        uint256 depositTimestamp;
        bool exists;
    }

    mapping(uint256 => SavingsAccount) public savingsAccounts;
    uint256 public totalAccounts;
    event SavingsAccountCreated(
        address indexed user,
        uint256 accountId,
        uint256 lockPeriod
    );
    event EthDeposited(address indexed user, uint256 accountId, uint256 amount);
    event TokenDeposited(
        address indexed user,
        uint256 accountId,
        address token,
        uint256 amount
    );
    event EthWithdrawal(
        address indexed user,
        uint256 accountId,
        uint256 amount,
        bool penaltyApplied
    );
    event TokenWithdrawal(
        address indexed user,
        uint256 accountId,
        address token,
        uint256 amount,
        bool penaltyApplied
    );

    constructor(address _owner) {
        factory = msg.sender;
        owner = _owner;
    }

    // Modifier to allow only the factory to call certain functions
    modifier onlyFactory() {
        if (msg.sender != factory) revert OnlyFactory();
        _;
    }

    // Modifier to allow only the real account owner
    modifier onlyAccountOwner(uint256 accountId) {
        if (accountOwner[accountId] != msg.sender) revert OnlyAccountOwner();
        _;
    }

    function createSavingsAccount(
        uint256 lockPeriod
    ) external returns (uint256) {
        if (lockPeriod == 0) revert LockPeriodMustBeGreaterThanZero();

        uint256 accountId = totalAccounts++;
        SavingsAccount storage account = savingsAccounts[accountId];
        account.lockPeriod = lockPeriod;
        account.depositTimestamp = block.timestamp;
        account.exists = true;

        accountOwner[accountId] = msg.sender; // directly store owner

        emit SavingsAccountCreated(msg.sender, accountId, lockPeriod);
        return accountId;
    }

    // Deposit ETH into an account.
    function depositEth(
        uint256 accountId
    ) external payable onlyAccountOwner(accountId) {
        if (!savingsAccounts[accountId].exists) revert AccountNotExist();
        if (msg.value == 0) revert MustDepositSomething();

        savingsAccounts[accountId].ethBalance += msg.value;

        emit EthDeposited(msg.sender, accountId, msg.value);
    }

    //Deposit ERC20 tokens into an account.

    function depositToken(
        uint256 accountId,
        address token,
        uint256 amount
    ) external onlyAccountOwner(accountId) {
        if (!savingsAccounts[accountId].exists) revert AccountNotExist();
        if (amount == 0) revert MustDepositSomething();
        if (token == address(0)) revert InvalidTokenAddress();

        IERC20(token).transferFrom(msg.sender, address(this), amount);
        savingsAccounts[accountId].tokenBalances[token] += amount;

        emit TokenDeposited(msg.sender, accountId, token, amount);
    }

    //Withdraw ETH from an account.
    //  Early withdrawals lose 3% to the factory as a penalty.

    function withdrawEth(
        uint256 accountId,
        uint256 amount
    ) external onlyAccountOwner(accountId) {
        if (!savingsAccounts[accountId].exists) revert AccountNotExist();
        if (savingsAccounts[accountId].ethBalance < amount)
            revert InsufficientBalance();

        bool penaltyApplied = false;
        uint256 withdrawAmount = amount;

        // Check for lock period violation
        if (
            block.timestamp <
            savingsAccounts[accountId].depositTimestamp +
                savingsAccounts[accountId].lockPeriod
        ) {
            uint256 penalty = (amount * 3) / 100;
            withdrawAmount -= penalty;
            penaltyApplied = true;

            // Send ETH penalty to factory safely
            (bool sentPenalty, ) = factory.call{value: penalty}("");
            require(sentPenalty, "Penalty transfer failed");

            IPiggyBankFactory(factory).emitPenaltyReceived(penalty); // log penalty
        }

        savingsAccounts[accountId].ethBalance -= amount;

        // Send ETH safely to user
        (bool sentUser, ) = msg.sender.call{value: withdrawAmount}("");
        require(sentUser, "ETH transfer failed");

        emit EthWithdrawal(
            msg.sender,
            accountId,
            withdrawAmount,
            penaltyApplied
        );
    }

    //Withdraw ERC20 tokens from an account.

    function withdrawToken(
        uint256 accountId,
        address token,
        uint256 amount
    ) external onlyAccountOwner(accountId) {
        if (!savingsAccounts[accountId].exists) revert AccountNotExist();
        if (savingsAccounts[accountId].tokenBalances[token] < amount)
            revert InsufficientBalance();

        bool penaltyApplied = false;
        uint256 withdrawAmount = amount;

        // Early withdrawal penalty
        if (
            block.timestamp <
            savingsAccounts[accountId].depositTimestamp +
                savingsAccounts[accountId].lockPeriod
        ) {
            uint256 penalty = (amount * 3) / 100;
            withdrawAmount -= penalty;
            penaltyApplied = true;

            IERC20(token).transfer(factory, penalty);
            IPiggyBankFactory(factory).emitTokenPenaltyReceived(token, penalty);
        }

        savingsAccounts[accountId].tokenBalances[token] -= amount;
        IERC20(token).transfer(msg.sender, withdrawAmount);

        emit TokenWithdrawal(
            msg.sender,
            accountId,
            token,
            withdrawAmount,
            penaltyApplied
        );
    }

    // View ETH balance for an account.

    function getEthBalance(uint256 accountId) external view returns (uint256) {
        if (!savingsAccounts[accountId].exists) revert AccountNotExist();
        return savingsAccounts[accountId].ethBalance;
    }

    // View token balance for an account.

    function getTokenBalance(
        uint256 accountId,
        address token
    ) external view returns (uint256) {
        if (!savingsAccounts[accountId].exists) revert AccountNotExist();
        return savingsAccounts[accountId].tokenBalances[token];
    }
}

// Interface so PiggyBank can call back to factory

interface IPiggyBankFactory {
    function emitPenaltyReceived(uint256 amount) external;
    function emitTokenPenaltyReceived(address token, uint256 amount) external;
}

//   title PiggyBankFactory
//   dev Deploys PiggyBanks and collects penalties.

contract PiggyBankFactory is Ownable, IPiggyBankFactory {
    mapping(address => address[]) public userPiggyBanks;
    address[] public allPiggyBanks;

    constructor() Ownable(msg.sender) {}

    event PiggyBankCreated(address indexed user, address piggyBank);
    event PenaltyReceived(uint256 amount);
    event TokenPenaltyReceived(address token, uint256 amount);

    function createPiggyBank() external returns (address) {
        PiggyBank newBank = new PiggyBank(msg.sender);
        address bankAddress = address(newBank);

        userPiggyBanks[msg.sender].push(bankAddress);
        allPiggyBanks.push(bankAddress);

        emit PiggyBankCreated(msg.sender, bankAddress);
        return bankAddress;
    }

    function emitPenaltyReceived(uint256 amount) external override {
        emit PenaltyReceived(amount);
    }

    function emitTokenPenaltyReceived(
        address token,
        uint256 amount
    ) external override {
        emit TokenPenaltyReceived(token, amount);
    }

    function withdrawPenalties() external onlyOwner {
        if (address(this).balance == 0) revert NoPenaltiesToWithdraw();
        payable(owner()).transfer(address(this).balance);
    }

    function withdrawPenaltyTokens(address token) external onlyOwner {
        uint256 balance = IERC20(token).balanceOf(address(this));
        if (balance == 0) revert NoPenaltiesToWithdraw();
        IERC20(token).transfer(owner(), balance);
    }
}



// 0xE340e275CCe6785e71df34e13Cf948F77AB20A14 = DEPLOYEDAND VERIFIED ADDRESS