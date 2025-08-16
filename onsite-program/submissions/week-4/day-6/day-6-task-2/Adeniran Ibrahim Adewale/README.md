# Usefule functions to takenote

TotalSupply: The total number of tokens that will ever be issued
BalanceOf: The account balance of a token owner's account
Transfer: Automatically executes transfers of a specified number of tokens to a specified address for transactions using the token
TransferFrom: Automatically executes transfers of a specified number of tokens from a specified address using the token
Approve: Allows a spender to withdraw a set number of tokens from a specified account, up to a specific amount
Allowance: Returns a set number of tokens from a spender to the owner
The events that must be included in the token are:

Transfer: An event triggered when a transfer is successful
Approval: A log of an approved event (an event)
The following functions are optional and are not required, but they enhance the token's usability:

Token's name (optional)
Its symbol (optional)
Decimal points to use (optional)

```shell
npx hardhat ignition deploy ignition/modules/ERC20Token.ts --network lisk_sepolia --verify

Deployed Addresses
ERC20TokenModule#ERC20Token - 0x8FFd9a40C48854D34C83167b9f1C5c2eacBD503e
```
