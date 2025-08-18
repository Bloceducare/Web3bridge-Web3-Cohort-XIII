import { ethers } from 'ethers';
import { Contract, ContractTransaction } from 'ethers';

const LUDO_GAME_ABI = [

    'function registerPlayer(string _name, uint8 _color) public',
    'function rollDice() public returns (uint256)',
    'function movePlayer() public',
    'function getPlayerInfo(address _player) public view returns (string, uint256, uint8, uint256)',
    'function getPlayerCount() public view returns (uint256)',
    'event PlayerRegistered(address player, string name, uint8 color)',
    'event DiceRolled(address player, uint256 result)',
    'event PlayerMoved(address player, uint256 newPosition)'
];

enum Color {
    RED = 0,
    GREEN = 1,
    BLUE = 2,
    YELLOW = 3
}

interface PlayerInfo {
    name: string;
    score: bigint;
    color: Color;
    position: bigint;
}

class LudoGame {
    private contract: Contract;
    private signer: ethers.Signer;

    constructor(contractAddress: string, provider: ethers.Provider, signer: ethers.Signer) {
        this.contract = new ethers.Contract(contractAddress, LUDO_GAME_ABI, provider);
        this.signer = signer;
    }

    async registerPlayer(name: string, color: Color): Promise<ContractTransaction> {
        const contractWithSigner = this.contract.connect(this.signer);
        return await contractWithSigner.registerPlayer(name, color);
    }

    async rollDice(): Promise<bigint> {
        const contractWithSigner = this.contract.connect(this.signer);
        const result = await contractWithSigner.rollDice();
        return BigInt(result);
    }

    async movePlayer(): Promise<ContractTransaction> {
        const contractWithSigner = this.contract.connect(this.signer);
        return await contractWithSigner.movePlayer();
    }

    async getPlayerInfo(playerAddress: string): Promise<PlayerInfo> {
        const [name, score, color, position] = await this.contract.getPlayerInfo(playerAddress);
        return {
            name,
            score: BigInt(score),
            color: color as Color,
            position: BigInt(position)
        };
    }

    async getPlayerCount(): Promise<bigint> {
        return BigInt(await this.contract.getPlayerCount());
    }

    onPlayerRegistered(callback: (player: string, name: string, color: Color) => void) {
        this.contract.on('PlayerRegistered', (player, name, color) => {
            callback(player, name, color);
        });
    }

    onDiceRolled(callback: (player: string, result: bigint) => void) {
        this.contract.on('DiceRolled', (player, result) => {
            callback(player, BigInt(result));
        });
    }

    onPlayerMoved(callback: (player: string, newPosition: bigint) => void) {
        this.contract.on('PlayerMoved', (player, newPosition) => {
            callback(player, BigInt(newPosition));
        });
    }
}
async function main() {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contractAddress = 'YOUR_CONTRACT_ADDRESS';

    const ludoGame = new LudoGame(contractAddress, provider, signer);

    try {
        const tx = await ludoGame.registerPlayer('Alice', Color.RED);
        await tx.wait();
        console.log('Player registered');
    } catch (error) {
        console.error('Registration failed:', error);
    }
    try {
        const diceResult = await ludoGame.rollDice();
        console.log('Dice roll:', diceResult.toString());
        
        const tx = await ludoGame.movePlayer();
        await tx.wait();
        console.log('Player moved');
    } catch (error) {
        console.error('Move failed:', error);
    }

    const playerInfo = await ludoGame.getPlayerInfo(await signer.getAddress());
    console.log('Player info:', playerInfo);

    ludoGame.onPlayerMoved((player, newPosition) => {
        console.log(`Player ${player} moved to position ${newPosition}`);
    });
}