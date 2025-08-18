const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Ticket Contract", function () {
    let ticket;
    let owner;
    let creator;
    let buyer1;
    let buyer2;
    
    const CREATION_FEE = ethers.parseEther("0.01"); // 0.01 ETH
    const PURCHASE_FEE = ethers.parseEther("0.005"); // 0.005 ETH
    const TICKET_PRICE = ethers.parseEther("0.1"); // 0.1 ETH per ticket
    const TOTAL_TICKETS = 10;

    beforeEach(async function () {
        // Get signers
        [owner, creator, buyer1, buyer2] = await ethers.getSigners();
        
        // Deploy the contract
        const Ticket = await ethers.getContractFactory("Ticket");
        ticket = await Ticket.deploy(CREATION_FEE, PURCHASE_FEE);
        await ticket.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should set the correct creation and purchase fees", async function () {
            expect(await ticket.getCreationFeePercentage()).to.equal(CREATION_FEE);
            expect(await ticket.getPurchaseFeePercentage()).to.equal(PURCHASE_FEE);
        });

        it("Should set the correct owner", async function () {
            expect(await ticket.owner()).to.equal(owner.address);
        });

        it("Should have correct name and symbol", async function () {
            expect(await ticket.name()).to.equal("Ticket");
            expect(await ticket.symbol()).to.equal("TICKET");
        });
    });

    describe("Ticket Creation", function () {
        const tokenURI = "https://example.com/ticket/1";
        let futureDate;

        beforeEach(async function () {
            // Set future date (1 day from now)
            const currentTime = await time.latest();
            futureDate = currentTime + 86400; // 1 day = 86400 seconds
        });

        it("Should create a ticket successfully", async function () {
            await expect(
                ticket.connect(creator).createTicket(
                    tokenURI,
                    TOTAL_TICKETS,
                    TICKET_PRICE,
                    futureDate,
                    { value: CREATION_FEE }
                )
            )
            .to.emit(ticket, "TicketCreated")
            .withArgs(0, TOTAL_TICKETS, TICKET_PRICE, await time.latest() + 1, futureDate);

            // Check ticket info
            const ticketInfo = await ticket.getTicketInfo(0);
            expect(ticketInfo.tokenId).to.equal(0);
            expect(ticketInfo.totalTickets).to.equal(TOTAL_TICKETS);
            expect(ticketInfo.ticketsSold).to.equal(0);
            expect(ticketInfo.ticketPrice).to.equal(TICKET_PRICE);
            expect(ticketInfo.creator).to.equal(creator.address);
            expect(ticketInfo.ticketSold).to.equal(false);
        });

        it("Should transfer creation fee to owner", async function () {
            const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);
            
            await ticket.connect(creator).createTicket(
                tokenURI,
                TOTAL_TICKETS,
                TICKET_PRICE,
                futureDate,
                { value: CREATION_FEE }
            );

            const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
            expect(ownerBalanceAfter - ownerBalanceBefore).to.equal(CREATION_FEE);
        });

        it("Should mint NFT to creator", async function () {
            await ticket.connect(creator).createTicket(
                tokenURI,
                TOTAL_TICKETS,
                TICKET_PRICE,
                futureDate,
                { value: CREATION_FEE }
            );

            expect(await ticket.ownerOf(0)).to.equal(creator.address);
            expect(await ticket.tokenURI(0)).to.equal(tokenURI);
        });

        it("Should fail if total tickets is 0", async function () {
            await expect(
                ticket.connect(creator).createTicket(
                    tokenURI,
                    0,
                    TICKET_PRICE,
                    futureDate,
                    { value: CREATION_FEE }
                )
            ).to.be.revertedWith("Total tickets must be greater than 0");
        });

        it("Should fail if ticket price is 0", async function () {
            await expect(
                ticket.connect(creator).createTicket(
                    tokenURI,
                    TOTAL_TICKETS,
                    0,
                    futureDate,
                    { value: CREATION_FEE }
                )
            ).to.be.revertedWith("Ticket price must be greater than 0");
        });

        it("Should fail if end date is in the past", async function () {
            const pastDate = (await time.latest()) - 86400; // 1 day ago
            
            await expect(
                ticket.connect(creator).createTicket(
                    tokenURI,
                    TOTAL_TICKETS,
                    TICKET_PRICE,
                    pastDate,
                    { value: CREATION_FEE }
                )
            ).to.be.revertedWith("Ticket end date must be in the future");
        });

        it("Should fail if incorrect creation fee is sent", async function () {
            await expect(
                ticket.connect(creator).createTicket(
                    tokenURI,
                    TOTAL_TICKETS,
                    TICKET_PRICE,
                    futureDate,
                    { value: CREATION_FEE / 2n }
                )
            ).to.be.revertedWith("Incorrect creation fee sent");
        });
    });

    describe("Ticket Purchasing", function () {
        const tokenURI = "https://example.com/ticket/1";
        let futureDate;
        let ticketId = 0;

        beforeEach(async function () {
            const currentTime = await time.latest();
            futureDate = currentTime + 86400;
            
            // Create a ticket first
            await ticket.connect(creator).createTicket(
                tokenURI,
                TOTAL_TICKETS,
                TICKET_PRICE,
                futureDate,
                { value: CREATION_FEE }
            );
        });

        it("Should purchase tickets successfully", async function () {
            const ticketsToBuy = 2;
            const totalPrice = TICKET_PRICE * BigInt(ticketsToBuy);
            const totalWithFee = totalPrice + PURCHASE_FEE;

            await expect(
                ticket.connect(buyer1).purchaseTicket(
                    ticketId,
                    ticketsToBuy,
                    { value: totalWithFee }
                )
            ).to.emit(ticket, "TicketPurchased")
            .withArgs(ticketId, buyer1.address, ticketsToBuy);

            // Check updated ticket info
            const ticketInfo = await ticket.getTicketInfo(ticketId);
            expect(ticketInfo.ticketsSold).to.equal(ticketsToBuy);
            expect(ticketInfo.ticketSold).to.equal(false); // Not all sold yet
        });

        it("Should transfer payments correctly", async function () {
            const ticketsToBuy = 2;
            const totalPrice = TICKET_PRICE * BigInt(ticketsToBuy);
            const totalWithFee = totalPrice + PURCHASE_FEE;

            const creatorBalanceBefore = await ethers.provider.getBalance(creator.address);
            const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);

            await ticket.connect(buyer1).purchaseTicket(
                ticketId,
                ticketsToBuy,
                { value: totalWithFee }
            );

            const creatorBalanceAfter = await ethers.provider.getBalance(creator.address);
            const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);

            expect(creatorBalanceAfter - creatorBalanceBefore).to.equal(totalPrice);
            expect(ownerBalanceAfter - ownerBalanceBefore).to.equal(PURCHASE_FEE);
        });

        it("Should mint NFTs to buyer", async function () {
            const ticketsToBuy = 2;
            const totalPrice = TICKET_PRICE * BigInt(ticketsToBuy);
            const totalWithFee = totalPrice + PURCHASE_FEE;

            await ticket.connect(buyer1).purchaseTicket(
                ticketId,
                ticketsToBuy,
                { value: totalWithFee }
            );

            // Check user tickets
            const userTickets = await ticket.getUserTickets(buyer1.address);
            expect(userTickets.length).to.equal(ticketsToBuy);
            
            // Check ownership
            expect(await ticket.ownerOf(1)).to.equal(buyer1.address);
            expect(await ticket.ownerOf(2)).to.equal(buyer1.address);
        });

        it("Should record purchase information", async function () {
            const ticketsToBuy = 1;
            const totalWithFee = TICKET_PRICE + PURCHASE_FEE;

            await ticket.connect(buyer1).purchaseTicket(
                ticketId,
                ticketsToBuy,
                { value: totalWithFee }
            );

            const purchaseInfo = await ticket.getPurchaseInfo(1); // First purchased ticket has ID 1
            expect(purchaseInfo.length).to.equal(1);
            expect(purchaseInfo[0].buyer).to.equal(buyer1.address);
            expect(purchaseInfo[0].ticketsBought).to.equal(1);
            expect(purchaseInfo[0].totalPrice).to.equal(TICKET_PRICE);
            expect(purchaseInfo[0].ticketId).to.equal(ticketId);
        });

        it("Should mark ticket as sold when all tickets are purchased", async function () {
            const totalWithFee = TICKET_PRICE * BigInt(TOTAL_TICKETS) + PURCHASE_FEE;

            await ticket.connect(buyer1).purchaseTicket(
                ticketId,
                TOTAL_TICKETS,
                { value: totalWithFee }
            );

            const ticketInfo = await ticket.getTicketInfo(ticketId);
            expect(ticketInfo.ticketsSold).to.equal(TOTAL_TICKETS);
            expect(ticketInfo.ticketSold).to.equal(true);
        });

        it("Should fail if ticket doesn't exist", async function () {
            await expect(
                ticket.connect(buyer1).purchaseTicket(
                    999,
                    1,
                    { value: TICKET_PRICE + PURCHASE_FEE }
                )
            ).to.be.revertedWith("Ticket does not exist");
        });

        it("Should fail if trying to buy 0 tickets", async function () {
            await expect(
                ticket.connect(buyer1).purchaseTicket(
                    ticketId,
                    0,
                    { value: PURCHASE_FEE }
                )
            ).to.be.revertedWith("Invalid number of tickets");
        });

        it("Should fail if trying to buy more tickets than available", async function () {
            await expect(
                ticket.connect(buyer1).purchaseTicket(
                    ticketId,
                    TOTAL_TICKETS + 1,
                    { value: TICKET_PRICE * BigInt(TOTAL_TICKETS + 1) + PURCHASE_FEE }
                )
            ).to.be.revertedWith("Invalid number of tickets");
        });

        it("Should fail if incorrect payment amount", async function () {
            await expect(
                ticket.connect(buyer1).purchaseTicket(
                    ticketId,
                    1,
                    { value: TICKET_PRICE } // Missing purchase fee
                )
            ).to.be.revertedWith("Incorrect amount sent");
        });

        it("Should fail if ticket sale period has ended", async function () {
            // Fast forward past the end date
            await time.increaseTo(futureDate + 1);

            await expect(
                ticket.connect(buyer1).purchaseTicket(
                    ticketId,
                    1,
                    { value: TICKET_PRICE + PURCHASE_FEE }
                )
            ).to.be.revertedWith("Ticket sale period has ended");
        });

        it("Should fail if all tickets are already sold", async function () {
            // Buy all tickets first
            const totalWithFee = TICKET_PRICE * BigInt(TOTAL_TICKETS) + PURCHASE_FEE;
            await ticket.connect(buyer1).purchaseTicket(
                ticketId,
                TOTAL_TICKETS,
                { value: totalWithFee }
            );

            // Try to buy more
            await expect(
                ticket.connect(buyer2).purchaseTicket(
                    ticketId,
                    1,
                    { value: TICKET_PRICE + PURCHASE_FEE }
                )
            ).to.be.revertedWith("Ticket has already been sold");
        });
    });

    describe("Owner Functions", function () {
        it("Should allow owner to set creation fee", async function () {
            const newFee = ethers.parseEther("0.02");
            await ticket.connect(owner).setCreationFeePercentage(newFee);
            expect(await ticket.getCreationFeePercentage()).to.equal(newFee);
        });

        it("Should allow owner to set purchase fee", async function () {
            const newFee = ethers.parseEther("0.01");
            await ticket.connect(owner).setPurchaseFeePercentage(newFee);
            expect(await ticket.getPurchaseFeePercentage()).to.equal(newFee);
        });

        it("Should not allow non-owner to set fees", async function () {
            const newFee = ethers.parseEther("0.02");
            await expect(
                ticket.connect(creator).setCreationFeePercentage(newFee)
            ).to.be.revertedWithCustomError(ticket, "OwnableUnauthorizedAccount");
        });

        it("Should allow owner to withdraw fees", async function () {
            // First, create some fee revenue
            const currentTime = await time.latest();
            const futureDate = currentTime + 86400;
            
            await ticket.connect(creator).createTicket(
                "https://example.com/ticket/1",
                5,
                TICKET_PRICE,
                futureDate,
                { value: CREATION_FEE }
            );

            await ticket.connect(buyer1).purchaseTicket(
                0,
                2,
                { value: TICKET_PRICE * 2n + PURCHASE_FEE }
            );

            const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);
            const contractBalance = await ethers.provider.getBalance(await ticket.getAddress());
            
            const tx = await ticket.connect(owner).withdrawFees();
            const receipt = await tx.wait();
            const gasUsed = receipt.gasUsed * receipt.gasPrice;

            const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
            expect(ownerBalanceAfter + gasUsed - ownerBalanceBefore).to.equal(contractBalance);
        });
    });

    describe("View Functions", function () {
        it("Should return correct user tickets", async function () {
            // Create and purchase tickets
            const currentTime = await time.latest();
            const futureDate = currentTime + 86400;
            
            await ticket.connect(creator).createTicket(
                "https://example.com/ticket/1",
                5,
                TICKET_PRICE,
                futureDate,
                { value: CREATION_FEE }
            );

            await ticket.connect(buyer1).purchaseTicket(
                0,
                2,
                { value: TICKET_PRICE * 2n + PURCHASE_FEE }
            );

            const userTickets = await ticket.getUserTickets(buyer1.address);
            expect(userTickets.length).to.equal(2);
        });

        it("Should return empty array for user with no tickets", async function () {
            const userTickets = await ticket.getUserTickets(buyer2.address);
            expect(userTickets.length).to.equal(0);
        });
    });
});