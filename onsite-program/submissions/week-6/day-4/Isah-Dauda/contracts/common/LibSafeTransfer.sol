// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "../interfaces/IERC20.sol";
import {Errors} from "./Errors.sol";

library LibSafeTransfer {
    function safeTransferERC20(IERC20 token, address to, uint256 amount) internal {
        (bool ok, bytes memory data) = address(token).call(abi.encodeWithSelector(token.transfer.selector, to, amount));
        if (!ok || (data.length != 0 && !abi.decode(data, (bool)))) {
            revert Errors.ERC20TransferFailed(address(token), to, amount);
        }
    }
}
