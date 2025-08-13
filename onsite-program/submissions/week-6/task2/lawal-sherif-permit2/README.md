## Foundry

![alt text](<Screenshot 2025-08-12 at 11.18.01 PM.png>)


Compiler run successful!

Ran 1 test for test/PermitSwap.t.sol:PermitSwapEIP712Test
[PASS] testPermitAndSwap() (gas: 191924)
Traces:
  [245170] PermitSwapEIP712Test::testPermitAndSwap()
    ├─ [0] VM::addr(<pk>) [staticcall]
    │   └─ ← [Return] 0xe05fcC23807536bEe418f142D19fa0d21BB0cfF7
    ├─ [44838] ERC20Mock::mint(0xe05fcC23807536bEe418f142D19fa0d21BB0cfF7, 1000000000000000000000 [1e21])
    │   └─ ← [Stop]
    ├─ [2583] ERC20Mock::nonces(0xe05fcC23807536bEe418f142D19fa0d21BB0cfF7) [staticcall]
    │   └─ ← [Return] 0
    ├─ [2383] ERC20Mock::DOMAIN_SEPARATOR() [staticcall]
    │   └─ ← [Return] 0xa8ecc09c3bd7d05f277c5161805e37b7362b592a4cf057e4ce7ec34b7b1f11f2
    ├─ [0] VM::sign("<pk>", 0x1a39d84c30512e01d55edcca75ffa7fec720d00516cbe6564cdb8c6ced7dd565) [staticcall]
    │   └─ ← [Return] 28, 0xb7cd81d7d102cb84e87915448363172244d37d9fab209dcec57c9f129e532a96, 0x4369ef7048b0d6bead53bf17e6385f97671b54c80d2e7d63ada5b5eb634d1c25
    ├─ [0] VM::prank(0xe05fcC23807536bEe418f142D19fa0d21BB0cfF7)
    │   └─ ← [Return]
    ├─ [175040] PermitSwapEIP712::permitAndSwapSimple(ERC20Mock: [0x5615dEB798BB3E4dFa0139dFa1b3D433Cc23b72f], ERC20Mock: [0x2e234DAe75C793f67A35089C9d99245E1C58470b], 500000000000000000000 [5e20], 400000000000000000000 [4e20], 86401 [8.64e4], 28, 0xb7cd81d7d102cb84e87915448363172244d37d9fab209dcec57c9f129e532a96, 0x4369ef7048b0d6bead53bf17e6385f97671b54c80d2e7d63ada5b5eb634d1c25)
    │   ├─ [47320] ERC20Mock::permit(0xe05fcC23807536bEe418f142D19fa0d21BB0cfF7, PermitSwapEIP712: [0x5991A2dF15A8F6A256D3Ec51E99254Cd3fb576A9], 500000000000000000000 [5e20], 86401 [8.64e4], 28, 0xb7cd81d7d102cb84e87915448363172244d37d9fab209dcec57c9f129e532a96, 0x4369ef7048b0d6bead53bf17e6385f97671b54c80d2e7d63ada5b5eb634d1c25)
    │   │   ├─ [3000] PRECOMPILES::ecrecover(0x1a39d84c30512e01d55edcca75ffa7fec720d00516cbe6564cdb8c6ced7dd565, 28, 83136351082696006033706779410711742421991154880553905418139848477875631237782, 30492132341426720323534839509418490323897155063541890159101706346100914199589) [staticcall]
    │   │   │   └─ ← [Return] 0x000000000000000000000000e05fcc23807536bee418f142d19fa0d21bb0cff7
    │   │   └─ ← [Stop]
    │   ├─ [24276] ERC20Mock::transferFrom(0xe05fcC23807536bEe418f142D19fa0d21BB0cfF7, PermitSwapEIP712: [0x5991A2dF15A8F6A256D3Ec51E99254Cd3fb576A9], 500000000000000000000 [5e20])
    │   │   └─ ← [Return] true
    │   ├─ [22828] ERC20Mock::approve(UniswapRouterMock: [0xF62849F9A0B5Bf2913b396098F7c7019b51A820a], 500000000000000000000 [5e20])
    │   │   └─ ← [Return] true
    │   ├─ [74458] UniswapRouterMock::swapExactTokensForTokens(500000000000000000000 [5e20], 400000000000000000000 [4e20], [0x5615dEB798BB3E4dFa0139dFa1b3D433Cc23b72f, 0x2e234DAe75C793f67A35089C9d99245E1C58470b], 0xe05fcC23807536bEe418f142D19fa0d21BB0cfF7, 86401 [8.64e4])
    │   │   ├─ [24276] ERC20Mock::transferFrom(PermitSwapEIP712: [0x5991A2dF15A8F6A256D3Ec51E99254Cd3fb576A9], UniswapRouterMock: [0xF62849F9A0B5Bf2913b396098F7c7019b51A820a], 500000000000000000000 [5e20])
    │   │   │   └─ ← [Return] true
    │   │   ├─ [44838] ERC20Mock::mint(0xe05fcC23807536bEe418f142D19fa0d21BB0cfF7, 400000000000000000000 [4e20])
    │   │   │   └─ ← [Stop]
    │   │   └─ ← [Return] [500000000000000000000 [5e20], 400000000000000000000 [4e20]]
    │   └─ ← [Stop]
    ├─ [582] ERC20Mock::balanceOf(0xe05fcC23807536bEe418f142D19fa0d21BB0cfF7) [staticcall]
    │   └─ ← [Return] 500000000000000000000 [5e20]
    ├─ [582] ERC20Mock::balanceOf(0xe05fcC23807536bEe418f142D19fa0d21BB0cfF7) [staticcall]
    │   └─ ← [Return] 400000000000000000000 [4e20]
    └─ ← [Stop]














































<!-- 
0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
[⠊] Compiling...
[⠆] Compiling 21 files with Solc 0.8.17
[⠰] Solc 0.8.17 finished in 23.89s
Compiler run successful!
Script ran successfully.

== Logs ==
Deploying for local/anvil environment
Local PermitSwapEIP712 deployed at: 0x5FbDB2315678afecb367f032d93F642f64180aa3

=== Deploying Mock Tokens for Testing ===
Mock USDC deployed at: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
Mock WETH deployed at: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
Mock DAI deployed at: 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
Mock UNI deployed at: 0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9

=== Deployment Summary ===
Chain ID: 31337
Block number: 0
Deployer: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
PermitSwapEIP712: 0x5FbDB2315678afecb367f032d93F642f64180aa3
Uniswap V2 Router: 0x1234567890123456789012345678901234567890
Permit2: 0x0000000000000000000000000000000000000000

=== Integration Info ===
Contract name: PermitSwapEIP712
Contract version: 1
SWAP_REQUEST_TYPEHASH:
SwapRequest(address owner,address token,uint256 amountIn,uint256 amountOutMin,address[] path,address to,uint256 deadline,uint256 nonce)

## Setting up 1 EVM.

==========================

Chain 31337

Estimated gas price: 2.000000001 gwei

Estimated total gas used for script: 6888325

Estimated amount required: 0.013776650006888325 ETH

==========================

##### anvil-hardhat

✅ [Success] Hash: 0x29e950e855c45de4efe5da03b7cb74a9455ed92e35afb26910835e135f330da0
Contract Address: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
Block: 2
Paid: 0.000904382327409872 ETH (1021772 gas \* 0.885111676 gwei)

##### anvil-hardhat

✅ [Success] Hash: 0xd04fe5f701339367b4d10cc53c06c59eda9245805381b942b8d3bb732ba72a9b
Contract Address: 0x5FbDB2315678afecb367f032d93F642f64180aa3
Block: 1
Paid: 0.001213401001213401 ETH (1213401 gas \* 1.000000001 gwei)

##### anvil-hardhat

✅ [Success] Hash: 0x882c5c1fd3f6ce50be219eb205236f6e456aafdfd9b3901047f79408391a7502
Contract Address: 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
Block: 2
Paid: 0.000904361084729648 ETH (1021748 gas \* 0.885111676 gwei)

##### anvil-hardhat

✅ [Success] Hash: 0x5d13fdbc3a8e2d16db45afa7a350de1d59c902b7bb09a97f8370ae084725720d
Contract Address: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
Block: 2
Paid: 0.000904350463389536 ETH (1021736 gas \* 0.885111676 gwei)

##### anvil-hardhat

✅ [Success] Hash: 0x1257c8a8bd6a9065eb6bafd4017aafd553c94b602786f8b14f4f00dd09c1acac
Contract Address: 0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9
Block: 2
Paid: 0.00090437170606976 ETH (1021760 gas \* 0.885111676 gwei)

✅ Sequence #1 on anvil-hardhat | Total Paid: 0.004830866582812217 ETH (5300417 gas \* avg 0.908089341 gwei)

==========================

home@MacBook-Pro-2 permit2 % forge test -vvvv

[⠊] Compiling...
[⠒] Compiling 6 files with Solc 0.8.17
[⠑] Solc 0.8.17 finished in 35.58s
Compiler run successful with warnings:
Warning (5667): Unused function parameter. Remove or comment out the variable name to silence this warning.
 test/PermitSwap.t.sol:91:9:
|
<!-- 91 | bytes calldata signature
| ^^^^^^^^^^^^^^^^^^^^^^^^

Ran 10 tests for test/PermitSwap.t.sol:PermitSwapEIP712Test
[PASS] testDeployment() (gas: 15594)
Traces:
[15594] PermitSwapEIP712Test::testDeployment()
├─ [363] PermitSwap::router() [staticcall]
│ └─ ← [Return] MockUniswapV2Router: [0x5615dEB798BB3E4dFa0139dFa1b3D433Cc23b72f]
├─ [168] PermitSwap::permit2() [staticcall]
│ └─ ← [Return] MockPermit2: [0x2e234DAe75C793f67A35089C9d99245E1C58470b]
├─ [2491] PermitSwap::nonces(Owner: [0xCf03Dd0a894Ef79CB5b601A43C4b25E3Ae4c67eD]) [staticcall]
│ └─ ← [Return] 0
└─ ← [Return]

[PASS] testEventEmission() (gas: 166922) -->  -->
