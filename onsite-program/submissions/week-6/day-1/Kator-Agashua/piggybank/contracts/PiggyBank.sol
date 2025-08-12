// This is a contract for a piggybank
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;

interface IERC20 {
    function totalSupply() external view returns (uint256);

    function balanceOf(address account) external view returns (uint256);

    function transfer(
        address recipient,
        uint256 amount
    ) external returns (bool);

    function allowance(
        address owner,
        address spender
    ) external view returns (uint256);

    function approve(address spender, uint256 amount) external returns (bool);

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
}

contract PiggyBank {
    enum State {
        OPEN,
        CLOSED
    }

    enum Plan {
        MONTHLY, // 0
        QUARTERLY, // 1
        YEARLY // 2
    }

    enum AccountType {
        ETHER, // 0
        TOKEN // 1
    }

    struct Account {
        uint128 accountId;
        string name;
        address owner;
        uint256 balance;
        uint256 created;
        AccountType accountType;
        address tokenAddress;
        Plan plan;
        State state;
        uint256 maturityDate;
    }

    // State variables
    address public admin;
    mapping(uint128 => Account) public accounts;
    uint256 public accountCount;
    mapping(address => uint128[]) public userAccountIds;

    // Events
    event AccountCreated(
        uint128 indexed accountId,
        address indexed owner,
        string name,
        Plan plan
    );
    event Deposit(
        address indexed sender,
        uint128 indexed accountId,
        uint256 amount,
        AccountType accountType
    );
    event Withdrawal(
        address indexed owner,
        uint128 indexed accountId,
        uint256 amount,
        uint256 interest
    );
    event AccountClosed(uint128 indexed accountId);

    // Modifiers
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this function");
        _;
    }

    modifier onlyAccountOwner(uint128 _accountId) {
        require(
            accounts[_accountId].owner == msg.sender,
            "Only account owner can call this function"
        );
        _;
    }

    modifier accountExists(uint128 _accountId) {
        require(
            accounts[_accountId].owner != address(0),
            "Account does not exist"
        );
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function createAccount(
        string memory _name,
        uint256 _plan,
        AccountType _accountType,
        address _tokenAddress
    ) external {
        require(msg.sender != address(0), "Invalid sender");
        require(_plan <= uint256(Plan.YEARLY), "Invalid plan");
        require(bytes(_name).length > 0, "Name cannot be empty");

        if (_accountType == AccountType.TOKEN) {
            require(
                _tokenAddress != address(0),
                "Token address required for token accounts"
            );
        }

        accountCount++;

        uint128 _accountId = uint128(
            uint256(
                keccak256(
                    abi.encodePacked(
                        _name,
                        block.timestamp,
                        msg.sender,
                        accountCount
                    )
                )
            )
        );

        // Calculate maturity date based on plan
        uint256 maturityDate = block.timestamp + getPlanDuration(_plan);

        Account memory newAccount = Account({
            accountId: _accountId,
            name: _name,
            owner: msg.sender,
            balance: 0,
            accountType: _accountType,
            created: block.timestamp,
            tokenAddress: (_accountType == AccountType.TOKEN)
                ? _tokenAddress
                : address(0),
            plan: Plan(_plan),
            state: State.OPEN,
            maturityDate: maturityDate
        });

        accounts[_accountId] = newAccount;
        userAccountIds[msg.sender].push(_accountId);

        emit AccountCreated(_accountId, msg.sender, _name, Plan(_plan));
    }

    function getPlanDuration(uint256 _plan) internal pure returns (uint256) {
        if (_plan == uint256(Plan.MONTHLY)) {
            return 30 days;
        } else if (_plan == uint256(Plan.QUARTERLY)) {
            return 90 days;
        } else {
            return 365 days;
        }
    }

    function interestRate(uint256 _plan) external pure returns (uint256) {
        return
            _plan == uint256(Plan.MONTHLY)
                ? 10
                : _plan == uint256(Plan.QUARTERLY)
                    ? 15
                    : 25;
    }

    function calculateInterest(
        uint256 _amount,
        uint256 _plan
    ) external view returns (uint256) {
        return (_amount * this.interestRate(_plan)) / 100;
    }

    function deposit(
        uint256 _amount,
        uint128 _accountId
    ) external payable accountExists(_accountId) onlyAccountOwner(_accountId) {
        require(_amount > 0, "Amount must be greater than zero");
        require(accounts[_accountId].state == State.OPEN, "Account is closed");

        if (accounts[_accountId].accountType == AccountType.ETHER) {
            require(msg.value == _amount, "Ether amount mismatch");
            accounts[_accountId].balance += msg.value;
        } else if (accounts[_accountId].accountType == AccountType.TOKEN) {
            require(
                msg.value == 0,
                "No Ether should be sent for token deposit"
            );
            IERC20 token = IERC20(accounts[_accountId].tokenAddress);
            require(
                token.transferFrom(msg.sender, address(this), _amount),
                "Token transfer failed"
            );
            accounts[_accountId].balance += _amount;
        }

        emit Deposit(
            msg.sender,
            _accountId,
            _amount,
            accounts[_accountId].accountType
        );
    }

    function withdraw(
        uint128 _accountId
    ) external accountExists(_accountId) onlyAccountOwner(_accountId) {
        Account storage account = accounts[_accountId];
        require(account.state == State.OPEN, "Account is already closed");
        require(account.balance > 0, "No funds to withdraw");

        uint256 principal = account.balance;
        uint256 interest = 0;

        // Calculate interest only if maturity date has passed
        if (block.timestamp >= account.maturityDate) {
            interest = this.calculateInterest(principal, uint256(account.plan));
        }

        uint256 totalWithdrawal = principal + interest;

        // Update account state
        account.balance = 0;
        account.state = State.CLOSED;

        // Transfer funds
        if (account.accountType == AccountType.ETHER) {
            require(
                address(this).balance >= totalWithdrawal,
                "Insufficient contract balance"
            );
            payable(msg.sender).transfer(totalWithdrawal);
        } else {
            IERC20 token = IERC20(account.tokenAddress);
            require(
                token.transfer(msg.sender, totalWithdrawal),
                "Token transfer failed"
            );
        }

        emit Withdrawal(msg.sender, _accountId, principal, interest);
        emit AccountClosed(_accountId);
    }

    function emergencyWithdraw(
        uint128 _accountId
    ) external accountExists(_accountId) onlyAccountOwner(_accountId) {
        Account storage account = accounts[_accountId];
        require(account.state == State.OPEN, "Account is already closed");
        require(account.balance > 0, "No funds to withdraw");

        uint256 principal = account.balance;

        // Update account state
        account.balance = 0;
        account.state = State.CLOSED;

        // Transfer funds (no interest for emergency withdrawal)
        if (account.accountType == AccountType.ETHER) {
            payable(msg.sender).transfer(principal);
        } else {
            IERC20 token = IERC20(account.tokenAddress);
            require(
                token.transfer(msg.sender, principal),
                "Token transfer failed"
            );
        }

        emit Withdrawal(msg.sender, _accountId, principal, 0);
        emit AccountClosed(_accountId);
    }

    function getUserAccountIds() external view returns (uint128[] memory) {
        return userAccountIds[msg.sender];
    }

    function getUserAccounts() external view returns (Account[] memory) {
        uint128[] memory accountIds = userAccountIds[msg.sender];
        Account[] memory userAccounts = new Account[](accountIds.length);

        for (uint256 i = 0; i < accountIds.length; i++) {
            userAccounts[i] = accounts[accountIds[i]];
        }

        return userAccounts;
    }

    function getAccount(
        uint128 _accountId
    ) external view returns (Account memory) {
        return accounts[_accountId];
    }

    function getAccountBalance(
        uint128 _accountId
    ) external view returns (uint256) {
        return accounts[_accountId].balance;
    }

    function isMatured(uint128 _accountId) external view returns (bool) {
        return block.timestamp >= accounts[_accountId].maturityDate;
    }

    function getTimeToMaturity(
        uint128 _accountId
    ) external view returns (uint256) {
        if (block.timestamp >= accounts[_accountId].maturityDate) {
            return 0;
        }
        return accounts[_accountId].maturityDate - block.timestamp;
    }

    // Admin functions
    function adminWithdrawFees() external onlyAdmin {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        payable(admin).transfer(balance);
    }

    function adminWithdrawTokenFees(
        address tokenAddress,
        uint256 amount
    ) external onlyAdmin {
        IERC20 token = IERC20(tokenAddress);
        require(token.transfer(admin, amount), "Token transfer failed");
    }

    function changeAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "Invalid admin address");
        admin = newAdmin;
    }

    receive() external payable {}
}
