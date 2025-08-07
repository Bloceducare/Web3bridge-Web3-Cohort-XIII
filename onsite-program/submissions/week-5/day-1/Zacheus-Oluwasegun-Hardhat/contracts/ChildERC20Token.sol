// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../interfaces/IERC20Token.sol";

contract ERC20Token is IERC20Token {
    string public name;
    string public symbol;
    uint public decimal;
    uint totalSupply;
    address public owner;

    mapping(address => uint) public userBalances;
    mapping(address _owner => mapping(address _spender => uint)) allowances;

    constructor(string memory _name, string memory _symbol, uint _decimals) {
        name = _name;
        symbol = _symbol;
        decimal = _decimals;
        owner = msg.sender;
    }

    function mintToken(uint _tokenAmount) external {
        if (msg.sender != owner) {
            revert ONLY_OWNER_CAN_MINT();
        }

        userBalances[msg.sender] = userBalances[msg.sender] + _tokenAmount;
        totalSupply = totalSupply + _tokenAmount;

        emit Transfer(address(0x0), msg.sender, _tokenAmount);
    }

    function balanceOf(address _user) external view returns (uint) {
        return userBalances[_user];
    }

    function transfer(
        address _receiver,
        uint _amount
    ) external returns (bool success) {
        if (userBalances[msg.sender] < _amount) {
            revert INSUFFICIENT_BALANCE();
        }

        userBalances[msg.sender] = userBalances[msg.sender] - _amount;
        userBalances[_receiver] = userBalances[_receiver] + _amount;

        emit Transfer(msg.sender, _receiver, _amount);
        return true;
    }

    function approve(
        address _spender,
        uint _amount
    ) external returns (bool success) {
        if (userBalances[msg.sender] < _amount) {
            revert INSUFFICIENT_BALANCE();
        }

        allowances[msg.sender][_spender] = _amount;
        emit Approval(msg.sender, _spender, _amount);

        return true;
    }

    function allowance(address _spender) external view returns (uint) {
        return allowances[msg.sender][_spender];
    }

    function transferFrom(
        address _from,
        address _to,
        uint _amount
    ) external returns (bool success) {
        if (userBalances[_from] < _amount) {
            revert INSUFFICIENT_BALANCE();
        }

        uint allowed_amount = allowances[_from][msg.sender];
        if (_amount > allowed_amount) {
            revert AMOUNT_MORE_THAN_ALLOWED_AMOUNT();
        }

        userBalances[_from] = userBalances[_from] - _amount;
        allowances[_from][msg.sender] = allowances[_from][msg.sender] - _amount;
        userBalances[_to] = userBalances[_to] + _amount;

        return true;
    }

    function _totalSupply() public view returns (uint) {
        return totalSupply;
    }
}
