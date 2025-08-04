// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

contract ERC20 is IERC20 {
    uint public totalsupply;
    mapping(address => uint) private balancesOf;
    mapping(address => mapping(address => uint)) private allowances;
    address public Owner;

    string public TokenName = "Rolex";
    string public Symbol = "RLX";
    uint public Decemals = 12;

    constructor(uint _initialSupply) {
        Owner = msg.sender;
        totalsupply = _initialSupply ;
        balancesOf[msg.sender] = totalsupply;
        emit Transfer(address(0), msg.sender, totalsupply);
    }

    modifier onlyme (){
        require (Owner == msg.sender, "Not For YOU");
        _;
    }

    function totalSupply() external view override returns (uint256) {
        return totalsupply;
    }

    function balanceOf(address account) external view override returns (uint256) {
        return balancesOf[account];
    }

    function allowance(address owner, address spender) external view override returns (uint256) {
        return allowances[owner][spender];
    }

    function transfer(address recipient, uint256 amount) external override returns (bool) {
        require(balancesOf[msg.sender] >= amount, "Insufficient balance");
        balancesOf[msg.sender] -= amount;
        balancesOf[recipient] += amount;
        emit Transfer(msg.sender, recipient, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external override onlyme returns (bool) {
        allowances[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address sender, address recipient, uint256 amount) external override returns (bool) {
        require(balancesOf[sender] >= amount, "Insufficient balance");
        require(allowances[sender][msg.sender] >= amount, "Allowance exceeded");

        allowances[sender][msg.sender] -= amount;
        balancesOf[sender] -= amount;
        balancesOf[recipient] += amount;
        emit Transfer(sender, recipient, amount);
        return true;
    }

    function mint( uint256 amount) external  onlyme{
        balancesOf[msg.sender] += amount;
        totalsupply += amount;
        emit Transfer(address(0), msg.sender, amount);
    }

    function burn( uint256 amount) external  onlyme{
        balancesOf[msg.sender] -= amount;
        totalsupply -= amount;
        emit Transfer(msg.sender, address(0), amount);
    }
    // https://sepolia-blockscout.lisk.com/address/0x606F947d350934a3f1D24343600FadFcee7DA9f4#code
    // ERC20Module#ERC20 - 0x606F947d350934a3f1D24343600FadFcee7DA9f4
} 