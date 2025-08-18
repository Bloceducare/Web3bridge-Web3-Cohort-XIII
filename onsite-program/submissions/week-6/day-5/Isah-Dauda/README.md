
# Deployed and Verified Address on Lisk

ChronoStampNFTModule#ChronoStamp - 0xC36547153ef2482D33B786d3dD68a711324BD2bD

ChronoStampModule#ChronoStamp - 0x1462318caeA61178B319c0878Ef6bAc18148A3d7

# Deployed Addresses and Verified on Sepolia

ChronoStampNFTModule#ChronoStamp - 0xFd036Ad562A612cEF82db4893558C09bBA8664D8


## I HAVE DEPLOYED AND VERIFIED THE CONTRACTS, BUT NONE OF THEM IS SHOWING NO RARIBLE






# > HARDHAT TESTING RESULT

Network Info
============
> HardhatEVM: v2.26.3
> network:    hardhat



  ChronoStamp ERC721 NFT
    ✔ Should mint, return correct balances and ownership (1178ms)
    ✔ Should produce dynamic tokenURI with current timestamp (8742ms)
    ✔ Should handle approvals and transfers correctly (303ms)
    ✔ Should support ERC721 and ERC721Metadata interfaces (143ms)


  4 passing (11s)

------------------------|----------|----------|----------|----------|----------------|
File                    |  % Stmts | % Branch |  % Funcs |  % Lines |Uncovered Lines |
------------------------|----------|----------|----------|----------|----------------|
 contracts\             |    88.57 |       50 |    76.92 |     87.5 |                |
  ChronoStamp.sol       |    88.57 |       50 |    76.92 |     87.5 |... ,88,120,121 |
 contracts\errors\      |      100 |      100 |      100 |      100 |                |
  ChronoStampErrors.sol |      100 |      100 |      100 |      100 |                |
 contracts\interfaces\  |      100 |      100 |      100 |      100 |                |
  IChronoStamp.sol      |      100 |      100 |      100 |      100 |                |
 contracts\libraries\   |    92.11 |    44.44 |      100 |    95.74 |                |
  ChronoStampLib.sol    |    92.11 |    44.44 |      100 |    95.74 |          49,57 |
------------------------|----------|----------|----------|----------|----------------|
All files               |    90.41 |       48 |    82.35 |    91.58 |                |
------------------------|----------|----------|----------|----------|----------------|

> Istanbul reports written to ./coverage/ and ./coverage.json