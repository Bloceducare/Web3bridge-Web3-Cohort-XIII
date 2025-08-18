//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract PiggyBank is ReentrancyGuard {
    uint256 public accountCount;
    uint256 public userCount;
    address public factoryAdmin;
    address public bankOwner;
    constructor(address _factoryAdmin, address _bankOwner) {
        factoryAdmin = _factoryAdmin;
        bankOwner = _bankOwner;
        accountCount = 0;
        userCount = 0;
    }

    enum TokenType {
        ETH,
        ERC20
    }
    enum UserStatus {
        NotJoined,
        Joined
    }

    struct SavingsAccount {
        uint256 id;
        address owner;
        TokenType tokenType;
        address tokenAddress;
        uint256 balance;
        uint256 lockPeriod;
        uint256 createdAt;
        uint256 unlockTime;
        bool isActive;
    }

    struct User {
        uint256 userId;
        address userAddress;
        UserStatus status;
        uint256 accountsCount;
    }

    mapping(address => User) public users;
    mapping(address => uint256[]) public userAccountIds; // User -> array of account IDs
    mapping(uint256 => SavingsAccount) public savingsAccounts; // Account ID -> Account details
    mapping(address => bool) public supportedTokens; // Supported ERC20 tokens

    event UserJoined(address indexed user, uint256 userId);
    event SavingsAccountCreated(
        address indexed user,
        uint256 indexed accountId,
        TokenType tokenType,
        address tokenAddress,
        uint256 lockPeriod,
        uint256 unlockTime
    );
    event Deposited(
        address indexed user,
        uint256 indexed accountId,
        uint256 amount
    );
    event Withdrawn(
        address indexed user,
        uint256 indexed accountId,
        uint256 amount,
        uint256 penalty,
        bool isEarlyWithdrawal
    );
    event TokenSupportUpdated(address indexed token, bool supported);

    // Errors
    error UserNotJoined();
    error UserAlreadyJoined();
    error InvalidAccountId();
    error InsufficientBalance();
    error TokenNotSupported();
    error InvalidLockPeriod();
    error InvalidAmount();
    error UnauthorizedAccess();

    modifier onlyJoinedUsers() {
        if (users[msg.sender].status != UserStatus.Joined) {
            revert UserNotJoined();
        }
        _;
    }

    modifier onlyBankOwner() {
        if (msg.sender != bankOwner) {
            revert UnauthorizedAccess();
        }
        _;
    }

    modifier validAccount(uint256 _accountId) {
        if (_accountId == 0 || _accountId > accountCount) {
            revert InvalidAccountId();
        }
        if (savingsAccounts[_accountId].owner != msg.sender) {
            revert UnauthorizedAccess();
        }
        if (!savingsAccounts[_accountId].isActive) {
            revert InvalidAccountId();
        }
        _;
    }

    function joinBank() external {
        if (users[msg.sender].status == UserStatus.Joined) {
            revert UserAlreadyJoined();
        }

        userCount++;
        users[msg.sender] = User({
            userId: userCount,
            userAddress: msg.sender,
            status: UserStatus.Joined,
            accountsCount: 0
        });

        emit UserJoined(msg.sender, userCount);
    }

    function createSavingsAccount(
        TokenType _tokenType,
        address _tokenAddress,
        uint256 _lockPeriod
    ) external onlyJoinedUsers {
        if (_lockPeriod == 0) {
            revert InvalidLockPeriod();
        }

        if (_tokenType == TokenType.ERC20) {
            if (
                _tokenAddress == address(0) || !supportedTokens[_tokenAddress]
            ) {
                revert TokenNotSupported();
            }
        } else {
            _tokenAddress = address(0);
        }

        accountCount++;
        uint256 currentTime = block.timestamp;
        uint256 unlockTime = currentTime + _lockPeriod;

        savingsAccounts[accountCount] = SavingsAccount({
            id: accountCount,
            owner: msg.sender,
            tokenType: _tokenType,
            tokenAddress: _tokenAddress,
            balance: 0,
            lockPeriod: _lockPeriod,
            createdAt: currentTime,
            unlockTime: unlockTime,
            isActive: true
        });

        userAccountIds[msg.sender].push(accountCount);
        users[msg.sender].accountsCount++;

        emit SavingsAccountCreated(
            msg.sender,
            accountCount,
            _tokenType,
            _tokenAddress,
            _lockPeriod,
            unlockTime
        );
    }

    function depositETH(
        uint256 _accountId
    ) external payable onlyJoinedUsers validAccount(_accountId) nonReentrant {
        if (msg.value == 0) {
            revert InvalidAmount();
        }

        SavingsAccount storage account = savingsAccounts[_accountId];
        if (account.tokenType != TokenType.ETH) {
            revert TokenNotSupported();
        }

        account.balance += msg.value;
        emit Deposited(msg.sender, _accountId, msg.value);
    }

    function depositERC20(
        uint256 _accountId,
        uint256 _amount
    ) external onlyJoinedUsers validAccount(_accountId) nonReentrant {
        if (_amount == 0) {
            revert InvalidAmount();
        }

        SavingsAccount storage account = savingsAccounts[_accountId];
        if (account.tokenType != TokenType.ERC20) {
            revert TokenNotSupported();
        }

        IERC20 token = IERC20(account.tokenAddress);

        require(
            token.transferFrom(msg.sender, address(this), _amount),
            "Token transfer failed"
        );

        account.balance += _amount;
        emit Deposited(msg.sender, _accountId, _amount);
    }

    function withdraw(
        uint256 _accountId,
        uint256 _amount
    ) external onlyJoinedUsers validAccount(_accountId) nonReentrant {
        if (_amount == 0) {
            revert InvalidAmount();
        }

        SavingsAccount storage account = savingsAccounts[_accountId];
        if (account.balance < _amount) {
            revert InsufficientBalance();
        }

        bool isEarlyWithdrawal = block.timestamp < account.unlockTime;
        uint256 penalty = 0;
        uint256 amountToUser = _amount;

        if (isEarlyWithdrawal) {
            penalty = (_amount * 3) / 100; // 3% penalty
            if (account.balance < _amount + penalty) {
                revert InsufficientBalance();
            }
            amountToUser = _amount;
            account.balance -= (_amount + penalty);
        } else {
            account.balance -= _amount;
        }

        if (account.tokenType == TokenType.ETH) {
            if (penalty > 0) {
                payable(factoryAdmin).transfer(penalty);
            }

            payable(msg.sender).transfer(amountToUser);
        } else {
            IERC20 token = IERC20(account.tokenAddress);

            if (penalty > 0) {
                require(
                    token.transfer(factoryAdmin, penalty),
                    "Penalty transfer failed"
                );
            }

            require(
                token.transfer(msg.sender, amountToUser),
                "Token transfer failed"
            );
        }

        emit Withdrawn(
            msg.sender,
            _accountId,
            _amount,
            penalty,
            isEarlyWithdrawal
        );
    }

    function updateTokenSupport(
        address _token,
        bool _supported
    ) external onlyBankOwner {
        supportedTokens[_token] = _supported;
        emit TokenSupportUpdated(_token, _supported);
    }

    function getUserTotalBalance(
        address _user
    )
        external
        view
        returns (
            uint256 totalETH,
            address[] memory tokenAddresses,
            uint256[] memory tokenBalances
        )
    {
        uint256[] memory accountIds = userAccountIds[_user];

        address[] memory tempTokens = new address[](accountIds.length);
        uint256[] memory tempBalances = new uint256[](accountIds.length);
        uint256 uniqueTokenCount = 0;

        for (uint256 i = 0; i < accountIds.length; i++) {
            SavingsAccount memory account = savingsAccounts[accountIds[i]];
            if (!account.isActive) continue;

            if (account.tokenType == TokenType.ETH) {
                totalETH += account.balance;
            } else {
                bool exists = false;
                for (uint256 j = 0; j < uniqueTokenCount; j++) {
                    if (tempTokens[j] == account.tokenAddress) {
                        tempBalances[j] += account.balance;
                        exists = true;
                        break;
                    }
                }
                if (!exists) {
                    tempTokens[uniqueTokenCount] = account.tokenAddress;
                    tempBalances[uniqueTokenCount] = account.balance;
                    uniqueTokenCount++;
                }
            }
        }

        tokenAddresses = new address[](uniqueTokenCount);
        tokenBalances = new uint256[](uniqueTokenCount);
        for (uint256 i = 0; i < uniqueTokenCount; i++) {
            tokenAddresses[i] = tempTokens[i];
            tokenBalances[i] = tempBalances[i];
        }
    }

    function getUserAccounts(
        address _user
    ) external view returns (SavingsAccount[] memory) {
        uint256[] memory accountIds = userAccountIds[_user];
        SavingsAccount[] memory accounts = new SavingsAccount[](
            accountIds.length
        );

        for (uint256 i = 0; i < accountIds.length; i++) {
            accounts[i] = savingsAccounts[accountIds[i]];
        }

        return accounts;
    }

    function getAccountDetails(
        uint256 _accountId
    ) external view returns (SavingsAccount memory) {
        return savingsAccounts[_accountId];
    }

    function getUserAccountCount(
        address _user
    ) external view returns (uint256) {
        return users[_user].accountsCount;
    }

    function hasUserJoined(address _user) external view returns (bool) {
        return users[_user].status == UserStatus.Joined;
    }

    function getTimeUntilUnlock(
        uint256 _accountId
    ) external view returns (uint256) {
        SavingsAccount memory account = savingsAccounts[_accountId];
        if (block.timestamp >= account.unlockTime) {
            return 0;
        }
        return account.unlockTime - block.timestamp;
    }

    function isTokenSupported(address _token) external view returns (bool) {
        return supportedTokens[_token];
    }
}
