# == Logs ==
  %% Using signer: 0x199674cd60606A67E0Fa9fa28Ef00F58A33d2075
  %% Deploying UniswapV2SwapWithPermit contract...
  %% Contract deployed at: 0x9954251e9a86d6566Df39F6e41B83E55Ec07Cc64
  %% Transferred 200 USDC from HOLDER to signer
  %% Sent 2 ETH to signer for gas
  %% Permit signed off-chain
  %% swapWithPermit transaction sent
  %% Final DAI balance: 99 DAI


## Foundry

**Foundry is a blazing fast, portable and modular toolkit for Ethereum application development written in Rust.**

Foundry consists of:

-   **Forge**: Ethereum testing framework (like Truffle, Hardhat and DappTools).
-   **Cast**: Swiss army knife for interacting with EVM smart contracts, sending transactions and getting chain data.
-   **Anvil**: Local Ethereum node, akin to Ganache, Hardhat Network.
-   **Chisel**: Fast, utilitarian, and verbose solidity REPL.

## Documentation

https://book.getfoundry.sh/

## Usage

### Build

```shell
$ forge build
```

### Test

```shell
$ forge test
```

### Format

```shell
$ forge fmt
```

### Gas Snapshots

```shell
$ forge snapshot
```

### Anvil

```shell
$ anvil
```

### Deploy

```shell
$ forge script script/Counter.s.sol:CounterScript --rpc-url <your_rpc_url> --private-key <your_private_key>
```

### Cast

```shell
$ cast <subcommand>
```

### Help

```shell
$ forge --help
$ anvil --help
$ cast --help
```
