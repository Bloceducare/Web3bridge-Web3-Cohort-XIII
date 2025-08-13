// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IAccount {
  event Withdrawal(uint amount, uint when);
  event Deposit(address indexed user, uint256 amount, bool isERC20, uint256 timestamp);
  struct SavingInstance {
    uint256 savingsId;
    string savingsName;
    bool isERC20;
    address tokenAddress;
    uint256 amount;
    uint256 lockPeriod;
    uint256 createdAt;
  }


  // what parameter are we getting from the user to get their account created or have them join an account?
  function createAccount(string memory _name, uint256 _lock_period, address _token_address, bool _IERC20, uint256 amount) external payable;

  // function joinAccount() external {}

  function getSavingInstances(address userAddress) external view returns (SavingInstance[] memory);

  function withdrawMoney(uint256 savingsId) external payable;

  function getSavingInstance(address tokenAddress, uint256 id) external view returns(SavingInstance memory);

  function depositAmount(uint256 savingsId, uint256 amount) external payable;
}
