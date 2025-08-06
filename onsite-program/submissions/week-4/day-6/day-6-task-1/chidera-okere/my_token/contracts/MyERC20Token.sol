// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;


import "../interfaces/IErc_20.sol";
import "./libraries/Storage.sol";

contract MyERC20Token is IErc_20 {
  
  Storage.Token public TokenData;

  mapping(address => uint256) private _balances;
  mapping(address => mapping(address => uint256)) private _allowances;

  
  modifier onlyOwner() {
    if(msg.sender != TokenData.owner) {
      revert Storage.NotOwner();
        }
        _;
  }
    
    constructor (
      string memory _name,
      string memory _symbol,
      uint256 _decimal,
      uint256 _initialSupply
    ) {

      TokenData = Storage.Token({
        name: _name,
        symbol: _symbol,
        decimal: _decimal,
        totalSupply: _initialSupply * 10 ** _decimal,
        owner: msg.sender
      });

      _balances[msg.sender] = TokenData.totalSupply;
    }


    function name() external view returns(string memory) {
      return TokenData.name;
    }


    function symbol() external view returns(string memory) {
      return TokenData.symbol;
    }

    function decimal() external view returns(uint256) {
      return TokenData.decimal;
    }

    function totalSupply() external view returns(uint256) {
      return TokenData.totalSupply;
    }

    function balanceOf(address account ) external view override returns(uint256) {
      return _balances[account];
    }

    function transfer(address to, uint256 amount) external override returns(bool) {
      if (to == address(0)) {
        revert Storage.ZeroAddress();
      }
      if (_balances[msg.sender] < amount) {
        revert Storage.InsufficientBalance();
      }
       _balances[msg.sender] -= amount;
       _balances[to] += amount;  

       return true; 
    }
   
   function allowance(address owner, address spender) external view override returns (uint256) {
        return _allowances[owner][spender];
    }

      function approve(address spender, uint256 amount) external override returns (bool) {
        if (spender == address(0)) {
            revert Storage.ZeroAddress();
        }

        _allowances[msg.sender][spender] = amount;

        return true;
    }

        function transferFrom(address from, address to, uint256 amount) external override returns (bool) {
        if (from == address(0) || to == address(0)) {
            revert Storage.ZeroAddress();
        }
        if (_balances[from] < amount) {
            revert Storage.InsufficientBalance();
        }
        if (_allowances[from][msg.sender] < amount) {
            revert Storage.InsufficientAllowance();
        }

        _balances[from] -= amount;
        _balances[to] += amount;
        _allowances[from][msg.sender] -= amount;
        return true;
    }



     function mint(address to, uint256 amount) external onlyOwner returns (bool) {
        if (to == address(0)) {
            revert Storage.ZeroAddress();
        }
        
        TokenData.totalSupply += amount;
        _balances[to] += amount;
        
        return true;
    }

    function burn(uint256 amount) external returns (bool) {
        if (_balances[msg.sender] < amount) {
            revert Storage.InsufficientBalance();
        }
        
        _balances[msg.sender] -= amount;
        TokenData.totalSupply -= amount;
        
        
        return true;
    }
}
