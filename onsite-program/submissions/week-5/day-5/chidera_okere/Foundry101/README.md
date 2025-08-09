# Event Ticketing System

A Solidity-based ticketing system for creating and managing events, purchasing tickets with ERC20 tokens (`TKT`), and issuing ERC721 NFTs (`TNFT`) as proof of purchase.

## Contracts

- **TicketToken**: ERC20 token used for ticket payments.
- **TicketNft**: ERC721 NFT representing unique tickets.
- **EventTicketing**: Manages event creation and ticket purchases.
- **TokenSale**: Allows users to buy `TKT` tokens with ETH.

## Setup

1. Deploy `TicketToken` with an initial supply.
2. Deploy `TicketNft`.
3. Deploy `EventTicketing` with `TicketToken` and `TicketNft` addresses.
4. Deploy `TokenSale` with `TicketToken` address and token price.

## Usage

- **Organizers**: Call `createTicket` to create events.
- **Users**: Buy `TKT` tokens via `TokenSale.buyTokens`, then use `EventTicketing.buyTicket` to purchase tickets and receive NFTs.

## Notes

- Ensure users approve `EventTicketing` to spend `TKT` tokens before buying tickets.
- See code comments for further details.

## License

MIT
