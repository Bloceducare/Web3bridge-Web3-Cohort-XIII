// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract TokenA {
    error ERC20InvalidSender(address sender);
    error ERC20InvalidReceiver(address receiver);
    error ERC20InsufficientBalance(
        address sender,
        uint256 balance,
        uint256 needed
    );
    error StakingContractAlreadySet();
    error InvalidStakingAddress();

    string public name = "Token A";
    string public symbol = "TKA";
    uint8 public decimals = 18;
    uint256 public totalSupply;
    address public stakingContract;
    bool private stakingContractSet;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );

    modifier onlyStaking() {
        require(msg.sender == stakingContract, "Only staking contract");
        _;
    }

    function setStakingContract(address _stakingContract) external returns (bool) {
        if (stakingContractSet) revert StakingContractAlreadySet();
        if (_stakingContract == address(0)) revert InvalidStakingAddress();

        stakingContract = _stakingContract;
        stakingContractSet = true;

        return true;
    }

    function mint(address account, uint256 value) external onlyStaking returns (bool) {
        if (account == address(0)) {
            revert ERC20InvalidReceiver(address(0));
        }
        _update(address(0), account, value);

        return true;
    }

    function transfer(address to, uint256 value) external returns (bool) {
        address owner = _msgSender();
        _transfer(owner, to, value);
        return true;
    }

    function _transfer(
        address from,
        address to,
        uint256 value
    ) internal {
        if (from == address(0)) {
            revert ERC20InvalidSender(address(0));
        }
        if (to == address(0)) {
            revert ERC20InvalidReceiver(address(0));
        }
        _update(from, to, value);
    }

    function _update(
        address from,
        address to,
        uint256 value
    ) internal virtual {
        if (from == address(0)) {
            // Overflow check required: The rest of the code assumes that totalSupply never overflows
            totalSupply += value;
        } else {
            uint256 fromBalance = balanceOf[from];
            if (fromBalance < value) {
                revert ERC20InsufficientBalance(from, fromBalance, value);
            }
            unchecked {
                // Overflow not possible: value <= fromBalance <= totalSupply.
                balanceOf[from] = fromBalance - value;
            }
        }

        if (to == address(0)) {
            unchecked {
                // Overflow not possible: value <= totalSupply or value <= fromBalance <= totalSupply.
                totalSupply -= value;
            }
        } else {
            unchecked {
                // Overflow not possible: balance + value is at most totalSupply, which we know fits into a uint256.
                balanceOf[to] += value;
            }
        }

        emit Transfer(from, to, value);
    }

    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }
}
