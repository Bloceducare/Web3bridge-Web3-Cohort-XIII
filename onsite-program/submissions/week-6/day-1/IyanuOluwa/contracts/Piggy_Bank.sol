// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// Basic IERC20 interface
interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

// Basic ReentrancyGuard
abstract contract ReentrancyGuard {
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status;

    constructor() {
        _status = _NOT_ENTERED;
    }

    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }
}

// Individual Piggy Bank Contract
contract PiggyBank is ReentrancyGuard {
    
    // Factory contract that deployed this piggy bank
    address public factory;
    // Owner of this piggy bank
    address public owner;
    // Admin (factory deployer) who receives breaking fees
    address public admin;
    
    // Structure to store savings details
    struct Savings {
        uint256 amount;           // Amount saved
        uint256 lockPeriod;       // Lock period in seconds
        uint256 depositTime;     // When the deposit was made
        address tokenAddress;     // Address of ERC20 token (0x0 for ETH)
        bool isWithdrawn;        // Whether this savings has been withdrawn
    }
    
    // Array to store all savings of this user
    Savings[] public savings;
    
    // Events
    event Deposited(uint256 indexed savingsId, uint256 amount, uint256 lockPeriod, address tokenAddress);
    event Withdrawn(uint256 indexed savingsId, uint256 amount, uint256 fee);
    event EarlyWithdrawn(uint256 indexed savingsId, uint256 amount, uint256 fee);
    
    // Breaking fee percentage (3%)
    uint256 public constant BREAKING_FEE_PERCENT = 3;
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier onlyFactory() {
        require(msg.sender == factory, "Only factory can call this function");
        _;
    }
    
    constructor(address _owner, address _admin) {
        factory = msg.sender;
        owner = _owner;
        admin = _admin;
    }
    
    // Function to deposit ETH
    function depositETH(uint256 _lockPeriod) external payable onlyOwner nonReentrant {
        require(msg.value > 0, "Amount must be greater than 0");
        require(_lockPeriod > 0, "Lock period must be greater than 0");
        
        savings.push(Savings({
            amount: msg.value,
            lockPeriod: _lockPeriod,
            depositTime: block.timestamp,
            tokenAddress: address(0), // 0x0 represents ETH
            isWithdrawn: false
        }));
        
        emit Deposited(savings.length - 1, msg.value, _lockPeriod, address(0));
    }
    
    // Function to deposit ERC20 tokens
    function depositToken(address _tokenAddress, uint256 _amount, uint256 _lockPeriod) 
        external onlyOwner nonReentrant {
        require(_tokenAddress != address(0), "Invalid token address");
        require(_amount > 0, "Amount must be greater than 0");
        require(_lockPeriod > 0, "Lock period must be greater than 0");
        
        // Transfer tokens from user to this contract
        require(IERC20(_tokenAddress).transferFrom(msg.sender, address(this), _amount), 
                "Token transfer failed");
        
        savings.push(Savings({
            amount: _amount,
            lockPeriod: _lockPeriod,
            depositTime: block.timestamp,
            tokenAddress: _tokenAddress,
            isWithdrawn: false
        }));
        
        emit Deposited(savings.length - 1, _amount, _lockPeriod, _tokenAddress);
    }
    
    // Function to withdraw after lock period
    function withdraw(uint256 _savingsId) external onlyOwner nonReentrant {
        require(_savingsId < savings.length, "Invalid savings ID");
        require(!savings[_savingsId].isWithdrawn, "Already withdrawn");
        require(
            block.timestamp >= savings[_savingsId].depositTime + savings[_savingsId].lockPeriod,
            "Lock period not yet expired"
        );
        
        Savings storage saving = savings[_savingsId];
        saving.isWithdrawn = true;
        
        if (saving.tokenAddress == address(0)) {
            // Withdraw ETH
            (bool success, ) = payable(owner).call{value: saving.amount}("");
            require(success, "ETH transfer failed");
        } else {
            // Withdraw ERC20 token
            require(IERC20(saving.tokenAddress).transfer(owner, saving.amount), 
                    "Token transfer failed");
        }
        
        emit Withdrawn(_savingsId, saving.amount, 0);
    }
    
    // Function to withdraw before lock period (with 3% fee)
    function earlyWithdraw(uint256 _savingsId) external onlyOwner nonReentrant {
        require(_savingsId < savings.length, "Invalid savings ID");
        require(!savings[_savingsId].isWithdrawn, "Already withdrawn");
        require(
            block.timestamp < savings[_savingsId].depositTime + savings[_savingsId].lockPeriod,
            "Lock period already expired, use regular withdraw"
        );
        
        Savings storage saving = savings[_savingsId];
        saving.isWithdrawn = true;
        
        uint256 fee = (saving.amount * BREAKING_FEE_PERCENT) / 100;
        uint256 amountAfterFee = saving.amount - fee;
        
        if (saving.tokenAddress == address(0)) {
            // Withdraw ETH with fee
            (bool success1, ) = payable(owner).call{value: amountAfterFee}("");
            require(success1, "ETH transfer to owner failed");
            
            (bool success2, ) = payable(admin).call{value: fee}("");
            require(success2, "ETH fee transfer failed");
        } else {
            // Withdraw ERC20 token with fee
            require(IERC20(saving.tokenAddress).transfer(owner, amountAfterFee), 
                    "Token transfer to owner failed");
            require(IERC20(saving.tokenAddress).transfer(admin, fee), 
                    "Token fee transfer failed");
        }
        
        emit EarlyWithdrawn(_savingsId, amountAfterFee, fee);
    }
    
    // View functions
    function getSavingsCount() external view returns (uint256) {
        return savings.length;
    }
    
    function getSavingDetails(uint256 _savingsId) external view returns (
        uint256 amount,
        uint256 lockPeriod,
        uint256 depositTime,
        address tokenAddress,
        bool isWithdrawn,
        bool canWithdraw
    ) {
        require(_savingsId < savings.length, "Invalid savings ID");
        
        Savings storage saving = savings[_savingsId];
        bool canWithdraw = !saving.isWithdrawn && 
            (block.timestamp >= saving.depositTime + saving.lockPeriod);
            
        return (
            saving.amount,
            saving.lockPeriod,
            saving.depositTime,
            saving.tokenAddress,
            saving.isWithdrawn,
            canWithdraw
        );
    }
    
    // Get total balance for a specific token
    function getTokenBalance(address _tokenAddress) external view returns (uint256) {
        uint256 totalBalance = 0;
        
        for (uint256 i = 0; i < savings.length; i++) {
            if (!savings[i].isWithdrawn && savings[i].tokenAddress == _tokenAddress) {
                totalBalance += savings[i].amount;
            }
        }
        
        return totalBalance;
    }
    
    // Get ETH balance
    function getETHBalance() external view returns (uint256) {
        return this.getTokenBalance(address(0));
    }
}

// Factory Contract
contract PiggyBankFactory {
    
    // Owner of the factory (admin)
    address public owner;
    
    // Array to store all deployed piggy banks
    address[] public piggyBanks;
    
    // Mapping from user address to their piggy bank address
    mapping(address => address) public userToPiggyBank;
    
    // Mapping to check if an address is a valid piggy bank
    mapping(address => bool) public isValidPiggyBank;
    
    // Events
    event PiggyBankCreated(address indexed user, address indexed piggyBankAddress);
    
    constructor() {
        owner = msg.sender;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    // Function to create a new piggy bank for a user
    function createPiggyBank() external {
        require(userToPiggyBank[msg.sender] == address(0), "User already has a piggy bank");
        
        PiggyBank newPiggyBank = new PiggyBank(msg.sender, owner);
        address piggyBankAddress = address(newPiggyBank);
        
        piggyBanks.push(piggyBankAddress);
        userToPiggyBank[msg.sender] = piggyBankAddress;
        isValidPiggyBank[piggyBankAddress] = true;
        
        emit PiggyBankCreated(msg.sender, piggyBankAddress);
    }
    
    // Get user's piggy bank address
    function getUserPiggyBank(address _user) external view returns (address) {
        return userToPiggyBank[_user];
    }
    
    // Get total number of piggy banks created
    function getTotalPiggyBanks() external view returns (uint256) {
        return piggyBanks.length;
    }
    
    // Get piggy bank address by index
    function getPiggyBankByIndex(uint256 _index) external view returns (address) {
        require(_index < piggyBanks.length, "Index out of bounds");
        return piggyBanks[_index];
    }
    
    // Get user's savings count
    function getUserSavingsCount(address _user) external view returns (uint256) {
        address piggyBankAddress = userToPiggyBank[_user];
        if (piggyBankAddress == address(0)) {
            return 0;
        }
        
        PiggyBank piggyBank = PiggyBank(piggyBankAddress);
        return piggyBank.getSavingsCount();
    }
    
    // Get user's balance for a specific token
    function getUserTokenBalance(address _user, address _tokenAddress) external view returns (uint256) {
        address piggyBankAddress = userToPiggyBank[_user];
        if (piggyBankAddress == address(0)) {
            return 0;
        }
        
        PiggyBank piggyBank = PiggyBank(piggyBankAddress);
        return piggyBank.getTokenBalance(_tokenAddress);
    }
    
    // Get user's ETH balance
    function getUserETHBalance(address _user) external view returns (uint256) {
        return getUserTokenBalance(_user, address(0));
    }
    
    // Admin function to check if a piggy bank is valid
    function validatePiggyBank(address _piggyBankAddress) external view returns (bool) {
        return isValidPiggyBank[_piggyBankAddress];
    }
}