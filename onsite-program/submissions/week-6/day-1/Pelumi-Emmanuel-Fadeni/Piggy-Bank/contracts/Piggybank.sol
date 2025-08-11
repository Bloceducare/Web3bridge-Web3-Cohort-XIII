// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IFactory {
    function admin() external view returns (address);
}

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract SavingsAccount {
    // Address of the owner of this savings account
    address public owner;

    // Token address — if zero address, means ETH savings
    address public tokenAddress;

    // Lock timing
    uint256 public lockStart;     // When the lock starts (set on first deposit)
    uint256 public lockDuration;  // How many seconds the lock lasts

    // Tracks if the first deposit has been made yet
    bool public hasDeposited;

    // Factory address (to know who created us, and where fees go)
    address public factory;

   address public immutable factoryAdmin;
   mapping(address => uint256) public balances;

    // Constructor: runs when Factory deploys this account
    constructor(address _owner, address _tokenAddress, uint256 _lockDuration, address _factory, address _factoryAdmin) {
        owner = _owner;                 // Set the user who owns this account
        tokenAddress = _tokenAddress;   // Could be ERC20 or ETH (0 address)
        lockDuration = _lockDuration;   // Save lock length
        factory = _factory;             // Save reference to factory contract
        factoryAdmin = _factoryAdmin;   // Save reference to factory admin
    }

    function depositETH() external payable {
    require(msg.sender == owner, "Not the owner");
    require(tokenAddress == address(0), "This account is for tokens, not ETH");
    require(msg.value > 0, "Must send ETH");

    if (!hasDeposited) {
        lockStart = block.timestamp;
        hasDeposited = true;
    }

    // No extra logic needed — ETH is now in contract's balance
}
    
    function depositToken(uint256 _amount) external {
    require(msg.sender == owner, "Not the owner");
    require(tokenAddress != address(0), "This account is for ETH, not tokens");
    require(_amount > 0, "Must deposit > 0");

    if (!hasDeposited) {
        lockStart = block.timestamp;
        hasDeposited = true;
    }

    // Call the token contract to transfer tokens from the owner to this contract
    bool success = IERC20(tokenAddress).transferFrom(msg.sender, address(this), _amount);
    require(success, "Token transfer failed");
   }
    
    function withdrawETH(uint256 _amount) external {
    require(msg.sender == owner, "Not the owner");
    require(tokenAddress == address(0), "This account is for tokens, not ETH");
    require(_amount > 0 && _amount <= address(this).balance, "Invalid amount");

    address feeReceiver = IFactory(factory).admin();

    if (block.timestamp < lockStart + lockDuration) {
        // Early withdrawal
        uint256 fee = (_amount * 3) / 100;
        uint256 payout = _amount - fee;

        payable(feeReceiver).transfer(fee);
        payable(owner).transfer(payout);
    } else {
        // No fee
        payable(owner).transfer(_amount);
    }
  }
     
     function withdrawToken(uint256 _amount) external {
    require(msg.sender == owner, "Not the owner");
    require(tokenAddress != address(0), "This account is for ETH, not tokens");

    uint256 balance = IERC20(tokenAddress).balanceOf(address(this));
    require(_amount > 0 && _amount <= balance, "Invalid amount");

    address feeReceiver = IFactory(factory).admin();

    if (block.timestamp < lockStart + lockDuration) {
        // Early withdrawal
        uint256 fee = (_amount * 3) / 100;
        uint256 payout = _amount - fee;

        require(IERC20(tokenAddress).transfer(feeReceiver, fee), "Fee transfer failed");
        require(IERC20(tokenAddress).transfer(owner, payout), "Payout transfer failed");
    } else {
        // No fee
        require(IERC20(tokenAddress).transfer(owner, _amount), "Transfer failed");
    }
}


    


}
