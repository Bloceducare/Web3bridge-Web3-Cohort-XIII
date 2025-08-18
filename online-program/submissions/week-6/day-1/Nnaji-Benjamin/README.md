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
### Deploy
```bash
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url https://rpc.sepolia-api.lisk.com \
  --broadcast \
  --private-key $PRIVATE_KEY
```
### Verify contract
``` bash 
forge verify-contract $FACTORY_ADDRESS \
  src/PiggyBankFactory.sol:PiggyBankFactory \
  --chain lisk_sepolia
  ```
### Envs
PRIVATE_KEY=0x
ETHERSCAN_API_KEY=
