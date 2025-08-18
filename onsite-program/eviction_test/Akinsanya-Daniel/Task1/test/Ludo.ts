import { expect } from "chai";
import hre from "hardhat";

describe("LudoGame", function () {
    async function deployLudoFixture() {
        const [owner, player1, player2, player3, player4] = await hre.ethers.getSigners();

        const LudoGame = await hre.ethers.getContractFactory("LudoGame");
        const ludo = await LudoGame.deploy();

        return { ludo, owner, player1, player2, player3, player4 };
    }

    describe("Joining the game", function () {
        it("should allow players to join until max is reached", async function () {
            const { ludo, player1, player2, player3, player4 } = await deployLudoFixture();

            await ludo.connect(player1).joinGame();
            await ludo.connect(player2).joinGame();
            await ludo.connect(player3).joinGame();
            await ludo.connect(player4).joinGame();

            await expect(ludo.connect(player1).joinGame()).to.be.revertedWithCustomError(
                ludo,
                "GAME_IS_FULL"
            );

            expect(await ludo.playerCount()).to.equal(4);
        });

        it("should not allow joining after game starts", async function () {
            const { ludo, player1, player2 } = await deployLudoFixture();

            await ludo.connect(player1).joinGame();
            await ludo.connect(player2).joinGame();
            await ludo.startGame();

            await expect(ludo.connect(player1).joinGame()).to.be.revertedWithCustomError(
                ludo,
                "GAME_HAS_ALREADY_STARTED"
            );
        });
    });

    describe("Starting the game", function () {
        it("should require at least 2 players", async function () {
            const { ludo, player1 } = await deployLudoFixture();
            await ludo.connect(player1).joinGame();

            await expect(ludo.startGame()).to.be.revertedWithCustomError(ludo,"NOT_ENOUGH_PLAYERS");
        });

        it("should start with 2 or more players", async function () {
            const { ludo, player1, player2 } = await deployLudoFixture();

            await ludo.connect(player1).joinGame();
            await ludo.connect(player2).joinGame();

            await expect(ludo.startGame()).to.emit(ludo, "GameStarted");

            expect(await ludo.gameInProgress()).to.equal(true);
            expect(await ludo.currentPlayerIndex()).to.equal(0);
        });
    });

    describe("Rolling dice", function () {
        it("should roll a number between 1 and 6", async function () {
            const { ludo, player1, player2 } = await deployLudoFixture();
            await ludo.connect(player1).joinGame();
            await ludo.connect(player2).joinGame();
            await ludo.startGame();

            const roll = await ludo.connect(player1).rollDice();
            const value = await roll.wait();
            const event = value!.logs[0];
            expect(event).to.not.be.undefined;
        });

        it("should revert if game has not started", async function () {
            const { ludo, player1 } = await deployLudoFixture();
            await ludo.connect(player1).joinGame();

            await expect(ludo.connect(player1).rollDice()).to.be.revertedWithCustomError(
                ludo,
                "GAME_HAS_ALREADY_STARTED"
            );
        });
    });

    describe("Moving tokens", function () {
        it("should require player turn", async function () {
            const { ludo, player1, player2 } = await deployLudoFixture();

            await ludo.connect(player1).joinGame();
            await ludo.connect(player2).joinGame();
            await ludo.startGame();


            await expect(
                ludo.connect(player2).moveToken(0, 6)
            ).to.be.revertedWith("Not your turn");
        });

        it("should require rolling a 6 to leave start", async function () {
            const { ludo, player1, player2 } = await deployLudoFixture();

            await ludo.connect(player1).joinGame();
            await ludo.connect(player2).joinGame();
            await ludo.startGame();

            await expect(ludo.connect(player1).moveToken(0, 3)).to.be.revertedWith(
                "Need a 6 to move from start"
            );
        });

        it("should move token when 6 is rolled", async function () {
            const { ludo, player1, player2 } = await deployLudoFixture();

            await ludo.connect(player1).joinGame();
            await ludo.connect(player2).joinGame();
            await ludo.startGame();

            await expect(ludo.connect(player1).moveToken(0, 6)).to.emit(
                ludo,
                "TokenMoved"
            );
        });
    });


});
