// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;
import "./IERC20.sol";
abstract contract MoviesToken is IERC20 {
    string private tokenName;
    string private tokenSymbol;
    uint private tokenTotalSupply;
    mapping(address=> uint) private tokenHolders;
    mapping (address=> mapping(address => uint)) private tokenSpenders;
    constructor(string memory _name, string memory _symbol, uint _totalSupply){
        tokenName = _name;
        tokenSymbol = _symbol;
        tokenTotalSupply = _totalSupply;
    }

    function totalSupply() public view returns(uint){
        return tokenTotalSupply;
    }

    function name() external view returns(string memory){
        return tokenName;
    }

    function symbol() external view returns(string memory){
        return tokenSymbol;
    }
    function balanceOf(address _owner) external view returns (uint){
        return tokenHolders[_owner];
    }

    // approve(0x132456789023456789g61r24r775g23t32e, )
    function approve(address spender, uint256 value) external returns(bool){
        if(tokenHolders[msg.sender] >= value){
            tokenSpenders[msg.sender][spender] += value;
            return true;
        }
        return false;
    }

    function transfer(address _to, uint value) external returns(bool){
        if(tokenHolders[msg.sender] >= value){
            tokenHolders[msg.sender] -= value;
            tokenHolders[_to]+=value;
            return true;
        }
        return false;
    }
      function allowance(address _owner, address _spender) external view returns (uint){
        return tokenSpenders[_owner][_spender];
    }
    
    function transferFrom(address from, address to, uint256 value) external returns (bool){
        if (tokenSpenders[from][msg.sender] >= value){
            if (tokenHolders[from] >= value){
                tokenSpenders[from][msg.sender] -=value;
                tokenHolders[from] -=value;
                tokenHolders[to] +=value;
                return true;
            }
            return false;
        }
        return false;
    }
    function buyToken(uint quantity)external {
        tokenHolders[msg.sender] += quantity;
    }
}

  
