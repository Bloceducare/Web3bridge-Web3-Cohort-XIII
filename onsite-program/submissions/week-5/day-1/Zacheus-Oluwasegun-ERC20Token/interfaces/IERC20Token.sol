// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IERC20Token {
    error INSUFFICIENT_BALANCE();
    error AMOUNT_MORE_THAN_ALLOWED_AMOUNT();
    error ONLY_OWNER_CAN_MINT();

    event Transfer(address indexed _from, address indexed _to, uint256 _value);
    event Approval(
        address indexed _owner,
        address indexed _spender,
        uint256 _value
    );

    function mintToken(uint _tokenAmount) external ;

    function balanceOf(address _user) external view returns (uint) ;

    function transfer(
        address _receiver,
        uint _amount
    ) external returns (bool success) ;

    function approve(
        address _spender,
        uint _amount
    ) external returns (bool success) ;

    function allowance(address _spender) external view returns (uint) ;

    function transferFrom(
        address _from,
        address _to,
        uint _amount
    ) external returns (bool success) ;

    function _totalSupply() external view returns (uint) ;
}
