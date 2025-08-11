// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface Ipiggy {
    struct Accounts {
        string name;
        address tokenAddress;
        uint256 accountId;
        uint256 balance;
        uint256 unlockTime;
        AccountType accountType;
    }
    enum AccountType {
        ETHERS,
        ERC_20
    }

    function create_account(
        string memory _name,
        address _tokenAddress,
        uint256 _unlockTime,
        AccountType _accountType
    ) external;

    function deposit(
        address _tokenAddress,
        uint256 _id,
        uint256 _amount
    ) external payable;

    function withdraw(
        address _tokenAddress,
        uint256 _id,
        uint256 _amount
    ) external payable;

    function get_users() external view returns (Accounts[] memory);

    function get_Balances(
        address _user,
        uint256 _id
    ) external view returns (uint256);
}
