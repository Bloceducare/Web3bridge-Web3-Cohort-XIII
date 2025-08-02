# Solidity Visibility Specifiers: Variables and Functions

# Overview of Visibility Specifiers

- **Public**: Accessible from anywhere (within the contract, derived contracts, external contracts, and externally via transactions).

- **Private**: Only accessible within the contract where defined.

- **Internal**: Accessible within the contract and its derived (inherited) contracts.

- **External**: Only accessible from outside the contract (via transactions or external contract calls).

# Visibility Specifiers for Variables

Variables in Solidity can be state variables (stored on the blockchain) or local variables (within functions). Visibility specifiers apply primarily to state variables.

| Specifier  | Access Scope | Behavior                                                       | Notes                                                                                                                                                                                                                              |
| ---------- | ------------ | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Public** | Everywhere   | Automatically generates a getter function for external access. | - External contracts, derived contracts, and internal code can read/write (if not `constant`/`immutable`). <br> - External accounts can read via the getter. <br> - Example: `uint public myVar = 10;` creates a `myVar()` getter. |

| **Private** | Same contract only | Not accessible by derived contracts or externally. | - Only functions within the same contract can read/write. <br> - Enhances security by restricting access. <br> - Example: `uint private secret = 42;` is only accessible within the contract. |

| **Internal** | Same contract and derived contracts | Not accessible externally. | - Useful for inheritance, allowing child contracts to access variables. <br> - Example: `uint internal counter = 0;` can be read/written by derived contracts. |

| **External** | Not applicable | Not allowed for state variables. | - Solidity restricts `external` to functions only. Attempting to use it on variables causes a compilation error. |

# Key Points for Variables

- **Public variables** are expensive due to automatic getter generation, increasing deployment costs.

- **Private** and **internal** are preferred for sensitive data to limit exposure.

- **Default visibility** for state variables is `internal` if not specified.

# Visibility Specifiers for Functions

Functions in Solidity can be called internally, by derived contracts, or externally, depending on their visibility.

| Specifier    | Access Scope                        | Behavior                                                                                                    | Notes                                                                                                                                                 |
| ------------ | ----------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Public**   | Everywhere                          | Callable by same contract, derived contracts, external contracts, and external accounts (via transactions). | - Most permissive, used for user-facing or interoperable functions. <br> - Example: `function update() public {}` can be called by anyone.            |
| **Private**  | Same contract only                  | Not callable by derived contracts or externally.                                                            | - Restricts function to internal use within the contract. <br> - Example: `function helper() private {}` is only callable within the contract.        |
| **Internal** | Same contract and derived contracts | Not callable externally.                                                                                    | - Ideal for utility functions shared across inherited contracts. <br> - Example: `function compute() internal {}` is accessible to derived contracts. |
| **External** | External calls only                 | Callable by external contracts or accounts, not internally (except via `this.`).                            | - Optimizes gas by avoiding internal call overhead. <br> - Example: `function pay() external {}` is only callable from outside.                       |

### Key Points for Functions

- **External** functions cannot be called internally unless using `this.functionName()`, which treats the call as external and consumes more gas.
- **Public** functions are versatile but expose the contract to broader access, so use cautiously.
- **Private** and **internal** functions enhance modularity and security by restricting access.
- **Default visibility** for functions is `public` if not specified (prior to Solidity 0.5.0; now explicit declaration is required).

## Best Practices

- Use `private` or `internal` for sensitive variables or helper functions to minimize attack surfaces.

- Reserve `public` for functions/variables that need external interaction (e.g., user interfaces or cross-contract calls).

- Use `external` for functions designed solely for external interaction to optimize gas usage.

- Always specify visibility explicitly to avoid unintended access (Solidity now enforces this for clarity).

## Example Code

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract VisibilityExample {
    uint public publicVar = 1;     // Accessible everywhere
    uint private privateVar = 2;   // Only within this contract
    uint internal internalVar = 3; // This contract and derived contracts

    function publicFunction() public view returns (uint) {
        return publicVar; // Callable by anyone
    }

    function privateFunction() private view returns (uint) {
        return privateVar; // Only callable within this contract
    }

    function internalFunction() internal view returns (uint) {
        return internalVar; // Callable by this and derived contracts
    }

    function externalFunction() external view returns (uint) {
        return publicVar; // Only callable externally
    }
}

contract Derived is VisibilityExample {
    function testAccess() public view returns (uint) {
        return internalVar; // Works: internalVar is accessible
        // return privateVar; // Error: privateVar is not accessible
    }
}
```
