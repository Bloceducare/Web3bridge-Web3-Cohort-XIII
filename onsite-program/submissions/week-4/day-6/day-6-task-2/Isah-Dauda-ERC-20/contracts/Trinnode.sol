// SPDX-License-Identifier: MIT

pragma solidity ^0.8.30;

import "./ITrinnode.sol";
import "./ErrorLib.sol";

contract Trinnode is ITrinnode {
    using ErrorLib for *;

    string public name;
    string public symbol;
    uint8 public decimals;
    uint public totalSupply;
    uint maxSupply;
    address public owner;
    bool private initialized;

    struct Metadata {
        bool blacklisted;
        uint createdAt;
    }

    mapping(address => uint) public balanceOf;

    //Mapping Sender, to Spender, to ammount
    mapping(address => mapping(address => uint)) public allowance;
    mapping(address => Metadata) public accountMetadata;

    modifier onlyOwner() {
        if (msg.sender != owner) revert ErrorLib.UNAUTHORIZED();
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function initialize(
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        uint _initialSupply,
        uint _maxSupply
    ) external onlyOwner {
        if (initialized) revert ErrorLib.ALREADY_INITIALIZED();
        if (_initialSupply > _maxSupply) revert ErrorLib.CAP_EXCEEDED();
        if (_initialSupply == 0 || _maxSupply == 0)
            revert ErrorLib.ZERO_AMOUNT();
        if (msg.sender == address(0)) revert ErrorLib.INVALID_ADDRESS();

        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        maxSupply = _maxSupply;
        totalSupply = _initialSupply;
        balanceOf[msg.sender] = _initialSupply;

        accountMetadata[msg.sender] = Metadata(false, block.timestamp);

        initialized = true;
    }

    function transfer(address _to, uint _amount) external returns (bool) {
        if (_to == address(0)) revert ErrorLib.INVALID_ADDRESS();
        if (balanceOf[msg.sender] < _amount)
            revert ErrorLib.INSUFFICIENT_BALANCE();
        if (
            accountMetadata[msg.sender].blacklisted ||
            accountMetadata[_to].blacklisted
        ) revert ErrorLib.UNAUTHORIZED();

        balanceOf[msg.sender] -= _amount;
        balanceOf[_to] += _amount;

        if (accountMetadata[_to].createdAt == 0) {
            accountMetadata[_to] = Metadata(false, block.timestamp);
        }
        return true;
    }

    function approve(address _spender, uint _amount) external returns (bool) {
        if (_spender == address(0)) revert ErrorLib.INVALID_ADDRESS();
        allowance[msg.sender][_spender] = _amount;
        return true;
    }

    function transferFrom(
        address _from,
        address _to,
        uint _amount
    ) external returns (bool) {
        if (_to == address(0)) revert ErrorLib.INVALID_ADDRESS();
        if (balanceOf[_from] < _amount) revert ErrorLib.INSUFFICIENT_BALANCE();
        if (allowance[_from][msg.sender] < _amount)
            revert ErrorLib.INSUFFICIENT_ALLOWANCE();

        allowance[_from][msg.sender] -= _amount;
        balanceOf[_from] -= _amount;
        balanceOf[_to] += _amount;

        if (accountMetadata[_to].createdAt == 0) {
            accountMetadata[_to] = Metadata(false, block.timestamp);
        }
        return true;
    }

    function mint(address _to, uint _amount) external onlyOwner {
        if (_to == address(0)) revert ErrorLib.INVALID_ADDRESS();
        if (totalSupply + _amount > maxSupply) revert ErrorLib.CAP_EXCEEDED();
        balanceOf[_to] += _amount;
        totalSupply += _amount;

        //Transfering the token

        if (accountMetadata[_to].createdAt == 0) {
            accountMetadata[_to] = Metadata(false, block.timestamp);
        }
    }

    function burn(uint _amount) external {
        if (balanceOf[msg.sender] < _amount)
            revert ErrorLib.INSUFFICIENT_BALANCE();

        balanceOf[msg.sender] -= _amount;
        totalSupply -= _amount;
    }
}
