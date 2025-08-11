// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import {IERC20} from "../interfaces/IERC20.sol";

contract PiggyBank {
    struct Account {
        uint id;
        string name;
        address owner;
        uint balance;
        bool isLocked;
        uint lockPeriod;
    }

    uint accountId;
    address owner;
    address public admin;
    uint constant breakingFee = 3;    
    Account[] public myAccounts;    

    error ACCOUNT_DOES_NOT_EXIST();
    error USER_DOES_NOT_EXIST();
    error MORE_THAN_BALANCE();
    error CHECK_ONLY_YOUR_BALANCE();

    event WithdrawalCompleted(uint amount, uint when);
    event DeposiitCompleted(uint amount, uint when);
    event UserJoined(address indexed, uint when);
    event AccountCreated(string name, uint when);

     constructor(address _owner, address _admin) {
        owner = _owner;
        admin = _admin;
    }

    receive() external payable {}

    modifier onlyOwner() {
        require(msg.sender == owner, "You're not the owner");
        _;
    }
    modifier checkLockTime(uint _lockPeriod) {
        require(
            block.timestamp < _lockPeriod,
            "Unlock time should be in the future"
        );
        _;
    }
    modifier checkIfAccountExists(uint _id) {
        require(_id>0 &&
            _id <= myAccounts.length,
            ACCOUNT_DOES_NOT_EXIST()
        );
        _;
    }
  
    modifier checkMoreThanBalance(uint _amount, uint _acct_id) {
        require(
            myAccounts[_acct_id].balance >= _amount,
            MORE_THAN_BALANCE()
        );
        _;
    }

    function createSavingsAccount(
        string memory _name,
        uint _lockPeriod
    ) external onlyOwner checkLockTime(_lockPeriod) returns (uint acct_id) {      

        accountId = accountId + 1;        
        Account memory _new_account = Account(
            accountId,
            _name,
            owner,
            0,
            false,
            _lockPeriod
        );

        myAccounts.push(_new_account);

        emit AccountCreated(_name, block.timestamp);
        return accountId;
    }

    // this registers a user and automatically creates a default savings account
    // removed this when creating factory as user is now owner of this piggy instance
    // function registerUser(string memory _acct_name, uint _lockPeriod) external {
    //     userId = userId + 1;
    //     Account memory _account_to_add = this.createSavingsAccount(
    //         _acct_name,
    //         _lockPeriod
    //     );

    //     userAccounts.push(_account_to_add);

    //     usersLibrary[msg.sender] = User(userId, userAccounts);
    //     emit UserJoined(msg.sender, block.timestamp);
    // }

    // check all user accounts and return balance
    function getUserBalance()
        external
        view
        onlyOwner        
        returns (uint userBalance)
    {
        uint userBal;
        for (uint i; i < myAccounts.length; i++) {
            userBal = userBal + myAccounts[i].balance;
        }

        return userBal;
    }

    function getAccount(uint _id) external view onlyOwner checkIfAccountExists(_id) returns (Account memory) {
        return myAccounts[_id - 1];
    }

    function getAccountBalance(
        uint _acct_id
    )
        external
        view
        onlyOwner
        checkIfAccountExists(_acct_id)        
        returns (uint acctBalance)
    {
        return myAccounts[_acct_id - 1].balance;
    }

    function getAllAccounts() external view onlyOwner returns (Account[] memory) {
        return myAccounts;
    }

    function fundAccount(
        uint _amount,
        uint _acct_id,
        address _token_address
    ) external payable checkIfAccountExists(_acct_id) {
        require(_amount > 0, "Amount must be greater than 0");
        // send funds to this piggy bank contract account, update values in my accounts
        if (_token_address == address(0)) {
            (bool sent, ) = address(this).call{value: _amount}("");
            require(sent, "Failed to send Ether");
        } else {
            IERC20(_token_address).transferFrom(owner, address(this), _amount);
        }

        myAccounts[_acct_id - 1].balance += _amount;
        myAccounts[_acct_id - 1].isLocked = true;
        emit DeposiitCompleted(_amount, block.timestamp);
    }

    function withdraw(
        uint amount,
        uint _acct_id,
        address _token_address
    ) external onlyOwner checkIfAccountExists(_acct_id) checkMoreThanBalance(amount, _acct_id) {
        //  check lock period to determine if there's fee or not,
        //  if fee, send to factory address
        // transfer from CA to user back, update balances in umy accounts
        uint lockPeriod = myAccounts[_acct_id - 1]
            .lockPeriod;
        uint fee = (amount * breakingFee) / 100;
        uint amount_to_withdraw = lockPeriod > block.timestamp
            ? amount - fee
            : amount;

        if (_token_address == address(0)) {
            // withdraw eth here and send eth to factory admin
            (bool sent, ) = owner.call{value: amount_to_withdraw}("");
            (bool sentFee, ) = admin.call{value: fee}("");

            require(sent, "Failed to withdraw Ether");
            require(sentFee, "Failed to Send Fee to Admin");
        } else {
            // IERC20(_token_address).approve(msg.sender, amount_to_withdraw);
            IERC20(_token_address).transfer(                
                msg.sender,
                amount_to_withdraw
            );
            IERC20(_token_address).transfer(admin, fee);
        }

        myAccounts[_acct_id - 1].balance -= amount;
        if (myAccounts[_acct_id - 1].balance == 0) {
            myAccounts[_acct_id - 1].isLocked = false;
        }
        emit WithdrawalCompleted(address(this).balance, block.timestamp);
    }
}
