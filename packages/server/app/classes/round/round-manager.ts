/* eslint-disable @typescript-eslint/no-magic-numbers */
import { Action, ActionPass } from '@app/classes/actions';
import { PlayerData } from '@app/classes/communication/player-data';
import { RoundData } from '@app/classes/communication/round-data';
import { HttpException } from '@app/classes/http-exception/http-exception';
import Player from '@app/classes/player/player';
import { INVALID_PLAYER_TO_REPLACE, NO_FIRST_ROUND_EXISTS } from '@app/constants/services-errors';
import { Random } from '@app/utils/random/random';
import { StatusCodes } from 'http-status-codes';
import { AbstractVirtualPlayer } from '@app/classes/virtual-player/abstract-virtual-player/abstract-virtual-player';
import { CompletedRound, Round } from './round';
import { NUMBER_OF_PASSING_ROUNDS_TO_END_GAME, NUMBER_OF_PLAYERS_IN_GAME } from '@app/constants/classes-constants';
import { Board } from '@app/classes/board';

const SECONDS_TO_MILLISECONDS = 1000;

export default class RoundManager {
    completedRounds: CompletedRound[];
    private player1: Player;
    private player2: Player;
    private player3: Player;
    private player4: Player;
    private currentRound: Round;
    private maxRoundTime: number;

    constructor(maxRoundTime: number, player1: Player, player2: Player, player3: Player, player4: Player) {
        this.maxRoundTime = maxRoundTime;
        this.player1 = player1;
        this.player2 = player2;
        this.player3 = player3;
        this.player4 = player4;
        this.completedRounds = [];
    }

    convertRoundToRoundData(round: Round): RoundData {
        const playerData: PlayerData = {
            publicUser: round.player.publicUser,
            id: round.player.id,
            score: round.player.score,
            tiles: round.player.tiles,
        };
        return {
            playerData,
            startTime: round.startTime,
            limitTime: round.limitTime,
        };
    }

    nextRound(actionPlayed: Action, board: Board): Round {
        if (this.currentRound !== undefined) {
            this.saveCompletedRound(this.currentRound, actionPlayed, board);
        }
        return this.beginRound();
    }

    beginRound(): Round {
        const player = this.getNextPlayer();
        const now = new Date();
        const limit = new Date(Date.now() + this.maxRoundTime * SECONDS_TO_MILLISECONDS);
        this.currentRound = {
            player,
            tiles: player.tiles.map((tile) => ({ ...tile })),
            startTime: now,
            limitTime: limit,
        };
        return this.currentRound;
    }

    getCurrentRound(): Round {
        return this.currentRound;
    }

    getGameStartTime(): Date {
        if (!this.completedRounds[0] && !this.currentRound) throw new HttpException(NO_FIRST_ROUND_EXISTS, StatusCodes.NOT_FOUND);
        return this.completedRounds[0] !== undefined ? this.completedRounds[0].startTime : this.currentRound.startTime;
    }

    getMaxRoundTime(): number {
        return this.maxRoundTime;
    }

    replacePlayer(oldPlayerId: string, newPlayer: Player): void {
        if (oldPlayerId === this.currentRound.player.id) this.currentRound.player = newPlayer;

        switch (oldPlayerId) {
            case this.player1.id: {
                this.player1 = newPlayer;
                break;
            }
            case this.player2.id: {
                this.player2 = newPlayer;
                break;
            }
            case this.player3.id: {
                this.player3 = newPlayer;
                break;
            }
            case this.player4.id: {
                this.player4 = newPlayer;
                break;
            }
            default:
                throw new HttpException(INVALID_PLAYER_TO_REPLACE, StatusCodes.NOT_FOUND);
        }
    }

    verifyIfGameOver(): boolean {
        if (this.completedRounds.length < NUMBER_OF_PASSING_ROUNDS_TO_END_GAME * NUMBER_OF_PLAYERS_IN_GAME) return false;

        for (let i = 0; i < NUMBER_OF_PASSING_ROUNDS_TO_END_GAME * NUMBER_OF_PLAYERS_IN_GAME; i++) {
            const round = this.completedRounds[this.completedRounds.length - 1 - i];
            if (round.player instanceof AbstractVirtualPlayer) continue;
            if (!(round.actionPlayed instanceof ActionPass)) {
                return false;
            }
        }
        return true;
    }

    private saveCompletedRound(round: Round, actionPlayed: Action, board: Board): void {
        const now = new Date();
        this.completedRounds.push({
            ...round,
            completedTime: now,
            actionPlayed,
            board: new Board(board.grid.map((row) => row.map((square) => ({ ...square })))),
        });
        // console.log(this.completedRounds[this.completedRounds.length - 1]);
    }

    private getNextPlayer(): Player {
        if (this.currentRound === undefined) {
            const startPlayerNumber = Random.randomIntFromInterval(1, 4);
            switch (startPlayerNumber) {
                case 1:
                    return this.player1;
                case 2:
                    return this.player2;
                case 3:
                    return this.player3;
                case 4:
                    return this.player4;
                // No default
            }
        }
        switch (this.currentRound.player) {
            case this.player1:
                return this.player2;
            case this.player2:
                return this.player3;
            case this.player3:
                return this.player4;
            default:
                return this.player1;
        }
    }
}
