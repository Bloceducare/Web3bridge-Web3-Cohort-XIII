// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import "./IERC.sol";
import "./library.sol";

contract ERC20 is IERC20 {
    uint256 public totalSupply;

    string public name;
    string public symbol;
    uint8 public decimals;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowed;

    constructor(string memory _name, string memory _symbol, uint8 _decimals) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        totalSupply = 10 * 10 ** _decimals;
        balanceOf[msg.sender] = totalSupply;
    }

    function transfer(
        address recipient,
        uint256 _amount
    ) external returns (bool) {
        require(recipient != address(0), ErrorMessages.INVALID_ADDRESS());
        require(
            balanceOf[msg.sender] >= _amount,
            ErrorMessages.INVALID_AMOUNT()
        );
        balanceOf[msg.sender] -= _amount;
        balanceOf[recipient] += _amount;
        emit Transfer(msg.sender, recipient, _amount);
        return true;
    }
    function approve(
        address _spender,
        uint256 _amount
    ) external returns (bool) {
        require(_spender != address(0), ErrorMessages.INVALID_ADDRESS());
        require(_amount != 0, ErrorMessages.INVALID_AMOUNT());
        allowed[msg.sender][_spender] = _amount;
        emit Approval(msg.sender, _spender, _amount);
        return true;
    }
    function allowance(
        address _owner,
        address _spender
    ) external view returns (uint256) {
        return allowed[_owner][_spender];
    }
    function transferFrom(
        address _from,
        address _to,
        uint256 _amount
    ) external returns (bool) {
        require(
            allowed[_from][msg.sender] >= _amount && _amount != 0,
            ErrorMessages.INVALID_AMOUNT()
        );
        require(_to != address(0), ErrorMessages.INVALID_ADDRESS());
        allowed[_from][msg.sender] -= _amount;
        balanceOf[_from] -= _amount;
        balanceOf[_to] += _amount;
        emit Transfer(_from, _to, _amount);
        return true;
    }
}
