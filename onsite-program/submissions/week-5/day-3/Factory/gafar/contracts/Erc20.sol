// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;
import "../interfaces/IErc20.sol";

error ZERO_ADDRESS();
error INSUFFICIENT_FUND();
error ONLY_OWNER();

contract Erc20 is IErc20 {
    string private _name;
    string private _symbol;
    uint8 private _decimals;
    uint256 private _totalSupply;
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowance;
    // address owner;

    // modifier onlyOwner {
    //     if(owner != msg.sender) revert ONLY_OWNER();
    //     _;
    // }

    constructor(string memory name_, string memory symbol_, uint8 decimals_, uint256 initialSupply) {
        _name = name_;
        _symbol = symbol_;
        _decimals = decimals_;
        _mint(msg.sender, initialSupply);
        // owner = msg.sender;
    }

    function name() external view returns (string memory) {
        return _name;
    }

    function symbol() external view returns (string memory) {
        return _symbol;
    }

    function decimals() external view returns (uint8) {
        return _decimals;
    }

    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }

    function transfer(address recipient, uint256 amount) external returns (bool){
        if(recipient == address(0)) revert ZERO_ADDRESS();
        if(_balances[msg.sender] < amount) revert INSUFFICIENT_FUND();

        _balances[msg.sender] -= amount;
        _balances[recipient] += amount;
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        if (spender == address(0)) revert ZERO_ADDRESS();
        _allowance[msg.sender][spender] = amount;
        return true;
    }

    function transferFrom(address sender, address recipient, uint256 amount)external returns (bool){
        if(recipient == address(0)) revert ZERO_ADDRESS();
        if(_allowance[sender][msg.sender] < amount) revert INSUFFICIENT_FUND();

        _balances[sender] -= amount;
        _allowance[sender][msg.sender] -= amount;
        _balances[recipient] += amount;
        return true;
    }

    function allowance(address _owner, address _spender) external view returns (uint256){
        return _allowance[_owner][_spender];
    }

    function _mint(address to, uint256 amount) public {
        _balances[to] += amount;
        _totalSupply += amount;
    }

    function _burn(address from, uint256 amount) external {
        _balances[from] -= amount;
        _totalSupply -= amount;
    }
}
