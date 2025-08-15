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

```shell
export RPC_URL="https://rpc.sepolia-api.lisk.com"   # testnet
export PRIVATE_KEY=0xYOUR_PRIVATE_KEY               # no 0x? add it

forge script script/Deploy.s.sol:Deploy \
  --rpc-url $RPC_URL --broadcast --slow --legacy --chain 4202
```

```shell
export RPC_URL="https://rpc.api.lisk.com"
export PRIVATE_KEY=0xYOUR_PRIVATE_KEY

forge script script/Deploy.s.sol:Deploy \
  --rpc-url $RPC_URL --broadcast --slow --legacy --chain 1135
```

### Mint
```shell
cast send <CLOCK_ADDRESS> "mint(address)" <YOUR_ADDRESS> --rpc-url $RPC_URL --private-key $PRIVATE_KEY
```

```shell
const uri = await clock.tokenURI(1);
// Decode base64 -> JSON -> image field (another base64) to preview the SVG.
```