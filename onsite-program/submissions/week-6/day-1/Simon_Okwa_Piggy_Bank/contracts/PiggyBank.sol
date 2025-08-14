// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";


contract PiggyBank is Ownable, ReentrancyGuard {
    
    uint256 public constant EARLY_WITHDRAWAL_FEE = 3; 
    uint256 public constant FEE_DENOMINATOR = 100;
    
    
    address public immutable factory; // why do we have to link the address to the factory?

    // Take a look / always take a look at  source code,  written by humans, understand the whole context and build from there - you are this / very close.

    address public immutable tokenAddress; // The token address of the toke the user selects.

    uint256 public immutable lockPeriod;
    uint256 public immutable createdAt;
    uint256 public balance;
    bool public isClosed;

    // https://drive.google.com/drive/folders/1EH5llTuay-o0ymXPGE0N0veslAVNl6VX
    // https://drive.google.com/drive/folders/1CvamD724Sk4THmAh47KufTtzY8N7rCwB?usp=drive_link

    /*
    Create a ticketing platform. 
    Where a user purchases a ticket and when the user gets it, the user gets minted an nft as the ticket.
    */
    
    // Handle everything that might want to occur as feedback to the user.

    // Just the keyboard and monitor and that's enough.
    event Deposited(address indexed user, uint256 amount, uint256 timestamp);
    event Withdrawn(address indexed user, uint256 amount, uint256 timestamp);
    event EarlyWithdrawalFee(address indexed user, uint256 feeAmount, uint256 timestamp);
    event Closed(address indexed user, uint256 timestamp);
    
    
    // On a global scale, for applications that involve factories and numeous functions, constructors are used to initalize the state and ensure that everything is created as a group, variable or state.

    // When you use AI, use it periodically but build, study and create your own, the truth is, information would always be sold so know how are when to buy it and also sell it.
    
    // Just the typepad and display screen (programmable display screen for the computer is programmable -> I an program it to do a and everything I want it to do.  ).

    // no more whatsapp, create your platforms for communication.
    constructor(
        address _owner,
        uint256 _lockPeriod,
        address _tokenAddress,
        address _factory
    ) Ownable(_owner) {
        require(_lockPeriod > 0, "Lock period must be greater than 0");
        require(_factory != address(0), "Factory address cannot be zero");
        
        factory = _factory;
        tokenAddress = _tokenAddress;
        lockPeriod = _lockPeriod;
        createdAt = block.timestamp;
    }

    // Arbitrum and Uniswap.
    // Please build ad never give your power away.

    // From now till 7pm - stay sitted, coding and building, learning and pivoting for this is where you belong and what you're to do.
    
   
    function deposit(uint256 amount) external payable nonReentrant {
        require(!isClosed, "Piggy bank is closed");
        
        if (tokenAddress == address(0)) {
          
            require(msg.value > 0, "Amount must be greater than 0");
            require(msg.value == amount, "Sent value must match amount");
            balance += msg.value;
            emit Deposited(msg.sender, msg.value, block.timestamp);
        } else {
           
            require(amount > 0, "Amount must be greater than 0");
            require(msg.value == 0, "Cannot send Ether for token deposit");
            IERC20 token = IERC20(tokenAddress);
            require(token.transferFrom(msg.sender, address(this), amount), "Token transfer failed");
            balance += amount;
            emit Deposited(msg.sender, amount, block.timestamp);
        }
    }
    
    
    function withdraw(uint256 amount) external onlyOwner nonReentrant {
        require(!isClosed, "Piggy bank is closed");
        require(amount > 0, "Amount must be greater than 0");
        require(amount <= balance, "Insufficient balance");
        
        uint256 feeAmount = 0;
        uint256 actualAmount = amount;
        
        
        if (block.timestamp < createdAt + lockPeriod) {
            feeAmount = (amount * EARLY_WITHDRAWAL_FEE) / FEE_DENOMINATOR;
            actualAmount = amount - feeAmount;
            
           
            if (tokenAddress == address(0)) {
                (bool success, ) = factory.call{value: feeAmount}("");
                require(success, "Failed to transfer fee to factory");
            } else {
                IERC20 token = IERC20(tokenAddress);
                require(token.transfer(factory, feeAmount), "Failed to transfer fee to factory");
            }
            
            emit EarlyWithdrawalFee(msg.sender, feeAmount, block.timestamp);
        }
        
        
        balance -= amount;
        
     
        if (tokenAddress == address(0)) {
            (bool success, ) = owner().call{value: actualAmount}("");
            require(success, "Failed to transfer Ether to owner");
        } else {
            IERC20 token = IERC20(tokenAddress);
            require(token.transfer(owner(), actualAmount), "Failed to transfer tokens to owner");
        }
        
        emit Withdrawn(msg.sender, actualAmount, block.timestamp);
    }
    
    
    function close() external onlyOwner nonReentrant {
        require(!isClosed, "Piggy bank is already closed");
        require(block.timestamp >= createdAt + lockPeriod, "Lock period not expired");
        
        isClosed = true;
        
       
        if (balance > 0) {
            uint256 remainingBalance = balance;
            balance = 0;
            
            if (tokenAddress == address(0)) {
                (bool success, ) = owner().call{value: remainingBalance}("");
                require(success, "Failed to transfer remaining Ether");
            } else {
                IERC20 token = IERC20(tokenAddress);
                require(token.transfer(owner(), remainingBalance), "Failed to transfer remaining tokens");
            }
            
            emit Withdrawn(msg.sender, remainingBalance, block.timestamp);
        }
        
        emit Closed(msg.sender, block.timestamp);
    }
    
    
    function emergencyClose() external {
        require(msg.sender == factory, "Only factory can emergency close");
        require(!isClosed, "Piggy bank is already closed");
        
        isClosed = true;
        
        
        if (balance > 0) {
            uint256 remainingBalance = balance;
            balance = 0;
            
            if (tokenAddress == address(0)) {
                (bool success, ) = factory.call{value: remainingBalance}("");
                require(success, "Failed to transfer remaining Ether to factory");
            } else {
                IERC20 token = IERC20(tokenAddress);
                require(token.transfer(factory, remainingBalance), "Failed to transfer remaining tokens to factory");
            }
        }
        
        emit Closed(owner(), block.timestamp);
    }
    
 
    function getTimeRemaining() external view returns (uint256) {
        if (block.timestamp >= createdAt + lockPeriod) {
            return 0;
        }
        return createdAt + lockPeriod - block.timestamp;
    }
 
    function isLockPeriodExpired() external view returns (bool) {
        return block.timestamp >= createdAt + lockPeriod;
    }
    
    function getPiggyBankDetails() external view returns (
        address owner_,
        address token,
        uint256 lockPeriod_,
        uint256 createdAt_,
        uint256 balance_,
        bool closed
    ) {
        return (
            owner(),
            tokenAddress,
            lockPeriod,
            createdAt,
            balance,
            isClosed
        );
    }
    
   
    function calculateEarlyWithdrawalFee(uint256 amount) external pure returns (uint256) {
        return (amount * EARLY_WITHDRAWAL_FEE) / FEE_DENOMINATOR;
    }
    
   
    function getBalance() external view returns (uint256) {
        return balance;
    }
    
    function getLockEndTime() external view returns (uint256) {
        return createdAt + lockPeriod;
    }
    
    function getEarlyWithdrawalFee(uint256 amount) external pure returns (uint256) {
        return (amount * EARLY_WITHDRAWAL_FEE) / FEE_DENOMINATOR;
    }
    
    
    receive() external payable {
        require(tokenAddress == address(0), "This piggy bank only accepts Ether");
        require(!isClosed, "Piggy bank is closed");
        
        balance += msg.value;
        emit Deposited(msg.sender, msg.value, block.timestamp);
    }
}
