import { v4 as uuidv4 } from 'uuid';
import Player from '@app/classes/player/player';
import RoundManager from '@app/classes/round/round-manager';
import TileReserve from '@app/classes/tile/tile-reserve';
import { MultiplayerGameConfig } from './game-config';
import { GameType } from './game.type';
import { START_TILE_AMOUNT } from './game.const';
import Board from '@app/classes/board/board';
import * as Errors from '@app/constants/errors';

export default class Game {
    player1: Player;
    player2: Player;
    roundManager: RoundManager;
    wordsPlayed: string[];
    gameType: GameType;
    tileReserve: TileReserve;
    board: Board;
    private id: string;

    private constructor() {
        this.id = uuidv4();
    }

    /**
     * Create a game from MultiplayerConfig
     *
     * @constructor
     * @param {MultiplayerGameConfig} config game configuration
     * @returns {Game} game
     */

    static async createMultiplayerGame(config: MultiplayerGameConfig): Promise<Game> {
        const game = new Game();

        game.player1 = config.player;
        game.player2 = config.player2;
        game.roundManager = new RoundManager(/* config.maxRoundTime */);
        game.wordsPlayed = [];
        game.gameType = config.gameType;
        game.tileReserve = new TileReserve();
        game.board = new Board();

        await game.tileReserve.init();

        game.player1.tiles = game.tileReserve.getTiles(START_TILE_AMOUNT);
        game.player2.tiles = game.tileReserve.getTiles(START_TILE_AMOUNT);

        // game.roundManager.startRound(); TODO: start round

        return game;
    }

    /**
     * Create a game from SoloGameConfig
     *
     * @constructor
     * @param {SoloGameConfig} config game configuration
     * @returns {Game} game
     */

    static async createSoloGame(/* config: SoloGameConfig */): Promise<Game> {
        throw new Error('Solo mode not implemented');
    }

    getId() {
        return this.id;
    }

    /**
     * Get the player with id
     *
     * @param {string} playerId id
     * @returns {Player} player with id
     */

    getActivePlayer(playerId: string): Player {
        if (this.player1.getId() === playerId) return this.player1;
        if (this.player2.getId() === playerId) return this.player2;
        throw new Error(Errors.INVALID_PLAYER_ID_FOR_GAME);
    }

    /**
     * Get the opponent of the player with id
     *
     * @param {string} playerId id
     * @returns {Player} opponent
     */

    getOpponentPlayer(playerId: string): Player {
        if (this.player1.getId() === playerId) return this.player2;
        if (this.player2.getId() === playerId) return this.player1;
        throw new Error(Errors.INVALID_PLAYER_ID_FOR_GAME);
    }
}
