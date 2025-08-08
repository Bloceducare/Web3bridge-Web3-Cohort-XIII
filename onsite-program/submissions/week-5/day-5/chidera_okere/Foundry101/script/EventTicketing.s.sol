// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.28;

// import "forge-std/Script.sol";
// import "forge-std/console.sol"; 

// import "../src/TicketToken.sol";
// import "../src/TicketNft.sol";
// import "../src/EventTicketing.sol";

// contract Deploy is Script {
//     function run() external {
//         uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
//         vm.startBroadcast(deployerPrivateKey);

//         TicketToken token = new TicketToken(1_000_000 ether);
//         TicketNft nft = new TicketNft();
//         EventTicketing ticketing = new EventTicketing(IERC20(address(token)), IMintableNFT(address(nft)));

//         console.log("TicketToken deployed to:", address(token));
//         console.log("TicketNFT deployed to:", address(nft));
//         console.log("EventTicketing deployed to:", address(ticketing));

//         vm.stopBroadcast();
//     }
// }
