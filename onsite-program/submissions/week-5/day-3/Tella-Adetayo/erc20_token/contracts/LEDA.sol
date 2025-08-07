// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "../library/Storage.sol"; 
import "../library/Error.sol"; 
import "../interface/ILEDA.sol"; 

contract LEDA is ILEDA {
    using Storage for Storage.Layout;

    uint public override totalSupply; 

    string public name;
    string public symbol; 
    uint8 public decimals; 
    address public owner; 


    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized to perform this action"); 
        _;
    }

    constructor(string memory _name, string memory _symbol, uint8 _decimals) {
        owner = msg.sender; 
        name = _name; 
        symbol = _symbol; 
        decimals = _decimals; 
    }

    function balanceOf(address _account) external override view returns (uint) {
        return Storage.layout().balanceOf[_account]; 
    }

    function transfer(address _recipient, uint _amount) external override returns (bool) {
        Storage.Layout storage ds = Storage.layout();

        if (ds.balanceOf[msg.sender] < _amount) {
            revert Error.InsufficientBalance();
        }

        ds.balanceOf[msg.sender] -= _amount; 
        ds.balanceOf[_recipient] += _amount; 

        // In interface 
        emit Transfer(msg.sender, _recipient, _amount);
        return true;
    }

    function approve(address _spender, uint _amount) external override returns (bool) {
        Storage.Layout storage ds = Storage.layout(); 
        ds.allowance[msg.sender][_spender] = _amount; 

        emit Approval(msg.sender, _spender, _amount); 
        return true; 
    }

    function allowance(address _owner, address _spender) external view override returns (uint) {
        return Storage.layout().allowance[_owner][_spender];
    }

    function transferFrom(address _sender, address _recipient, uint _amount) external override returns (bool) {
        Storage.Layout storage ds = Storage.layout();
        if (ds.allowance[_sender][msg.sender] < _amount) {
            revert Error.AllowanceTooLow();
        }

        if (ds.balanceOf[_sender] < _amount) {
            revert Error.InsufficientBalance(); 
        }

        ds.allowance[_sender][msg.sender] -= _amount;
        ds.balanceOf[_sender] -= _amount; 
        ds.balanceOf[_recipient] += _amount; 

        emit Transfer(_sender, _recipient, _amount); 
        return true; 
    }

    function _mint(address _to, uint _amount) internal onlyOwner {
        Storage.Layout storage ds = Storage.layout();

        ds.balanceOf[_to] += _amount; 
        totalSupply += _amount; 

        emit Transfer(address(0), _to, _amount); 
    }


    function _burn(address _from, uint _amount) internal onlyOwner {
        Storage.Layout storage ds = Storage.layout();
        if (ds.balanceOf[_from] < _amount) {
            revert Error.NotEnoughToken();
        }

        ds.balanceOf[_from] -= _amount; 
        totalSupply -= _amount; 

        emit Transfer(msg.sender, _from, _amount);
    }

    function mint(address _to, uint256 _amount) external {
        _mint(_to, _amount);
    }

    function burn(address _from, uint256 _amount) external {
        _burn(_from, _amount);
    }
}