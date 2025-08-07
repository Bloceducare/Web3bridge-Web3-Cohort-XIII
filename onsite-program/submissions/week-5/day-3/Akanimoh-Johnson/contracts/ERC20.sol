// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./IERC20.sol";

error INSUFFICIENT_BALANCE();
error INSUFFICIENT_ALLOWANCE();
error ZERO_ADDRESS();
error ZERO_AMOUNT();
error TRANSFER_FAILED();
error NOT_OWNER();

contract ERC20 is IERC20 {

    string public name;
    string public symbol;
    uint256 public immutable decimals;
    uint256 public totalSupply;
    address public owner;

    mapping(address => uint256) public _balanceOf;
    mapping (address=>mapping(address => uint256)) public allowance;

    constructor(string memory _name, string memory _symbol, uint256 _decimals, uint256 _initialSupply ){
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        totalSupply = _initialSupply;
        owner = msg.sender;
        _balanceOf[msg.sender] = _initialSupply;
        emit Transfer(address(0), msg.sender, _initialSupply);
    }


    modifier onlyOwner() {
        if (msg.sender != owner) revert NOT_OWNER();
        _;
    }


    function transfer(address to, uint256 amount) external returns (bool) {
        if (to == address(0)) revert ZERO_ADDRESS();
        if (amount == 0) revert ZERO_AMOUNT();
        if (_balanceOf[msg.sender] < amount) revert INSUFFICIENT_BALANCE();

        _balanceOf[msg.sender] -= amount;
        _balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }


    function approve(address spender, uint256 amount) external returns (bool) {
        if (spender == address(0)) revert ZERO_ADDRESS();

        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }


    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        if (from == address(0) || to == address(0)) revert ZERO_ADDRESS();
        if (amount == 0) revert ZERO_AMOUNT();
        if (_balanceOf[from] < amount) revert INSUFFICIENT_BALANCE();
        if (allowance[from][msg.sender] < amount) revert INSUFFICIENT_ALLOWANCE();

        allowance[from][msg.sender] -= amount;
        _balanceOf[from] -= amount;
        _balanceOf[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }


    function burn(uint256 amount) external {
        if (amount == 0) revert ZERO_AMOUNT();
        if (_balanceOf[msg.sender] < amount) revert INSUFFICIENT_BALANCE();

        _balanceOf[msg.sender] -= amount;
        totalSupply -= amount;
        emit Transfer(msg.sender, address(0), amount);
    }


    function mint(address to, uint256 amount) external onlyOwner {
        if (to == address(0)) revert ZERO_ADDRESS();
        if (amount == 0) revert ZERO_AMOUNT();

        totalSupply += amount;
        _balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }


    function get_total_supply() external view returns (uint256) {
        return totalSupply;
    }

    function balanceOf(address account) external view returns (uint256) {
        return _balanceOf[account];
    }

}
