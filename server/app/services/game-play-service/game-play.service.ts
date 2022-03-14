import { Action, ActionExchange, ActionHelp, ActionPass, ActionPlace, ActionReserve } from '@app/classes/actions';
import ActionHint from '@app/classes/actions/action-hint/action-hint';
import { Position } from '@app/classes/board';
import { ActionData, ActionExchangePayload, ActionPlacePayload, ActionType } from '@app/classes/communication/action-data';
import { GameUpdateData } from '@app/classes/communication/game-update-data';
import { RoundData } from '@app/classes/communication/round-data';
import Game from '@app/classes/game/game';
import Player from '@app/classes/player/player';
import { IS_OPPONENT, IS_REQUESTING } from '@app/constants/game';
import { INVALID_COMMAND, INVALID_PAYLOAD, NOT_PLAYER_TURN } from '@app/constants/services-errors';
import { ActiveGameService } from '@app/services/active-game-service/active-game.service';
import { Service } from 'typedi';
import HighScoresService from '@app/services/high-scores-service/high-scores-service';
import { FeedbackMessages } from './feedback-messages';

@Service()
export class GamePlayService {
    constructor(private readonly activeGameService: ActiveGameService, private readonly highScoresService: HighScoresService) {
        this.activeGameService.playerLeftEvent.on('playerLeft', (gameId, playerWhoLeftId) => {
            this.handlePlayerLeftEvent(gameId, playerWhoLeftId);
        });
    }

    async playAction(gameId: string, playerId: string, actionData: ActionData): Promise<[void | GameUpdateData, void | FeedbackMessages]> {
        const game = this.activeGameService.getGame(gameId, playerId);
        const player = game.getPlayer(playerId, IS_REQUESTING);

        if (player.id !== playerId) throw Error(NOT_PLAYER_TURN);

        const action: Action = this.getAction(player, game, actionData);

        let updatedData: void | GameUpdateData = action.execute();

        const localPlayerFeedback = action.getMessage();
        const opponentFeedback = action.getOpponentMessage();
        let endGameFeedback: string[] | undefined;

        if (updatedData) {
            updatedData.tileReserve = Array.from(game.getTilesLeftPerLetter(), ([letter, amount]) => ({ letter, amount }));
            updatedData.tileReserveTotal = updatedData.tileReserve.reduce((prev, { amount }) => prev + amount, 0);
        }

        if (action.willEndTurn()) {
            const nextRound = game.roundManager.nextRound(action);
            const nextRoundData: RoundData = game.roundManager.convertRoundToRoundData(nextRound);
            if (updatedData) updatedData.round = nextRoundData;
            else updatedData = { round: nextRoundData };
            if (game.isGameOver()) {
                endGameFeedback = await this.handleGameOver(undefined, game, updatedData);
            }
        }
        return [updatedData, { localPlayerFeedback, opponentFeedback, endGameFeedback }];
    }

    getAction(player: Player, game: Game, actionData: ActionData): Action {
        switch (actionData.type) {
            case ActionType.PLACE: {
                const payload = this.getActionPlacePayload(actionData);
                const position = new Position(payload.startPosition.row, payload.startPosition.column);
                return new ActionPlace(player, game, payload.tiles ?? [], position, payload.orientation);
            }
            case ActionType.EXCHANGE: {
                const payload = this.getActionExchangePayload(actionData);
                return new ActionExchange(player, game, payload.tiles ?? []);
            }
            case ActionType.PASS: {
                return new ActionPass(player, game);
            }
            case ActionType.HELP: {
                return new ActionHelp(player, game);
            }
            case ActionType.RESERVE: {
                return new ActionReserve(player, game);
            }
            case ActionType.HINT: {
                return new ActionHint(player, game);
            }
            default: {
                throw Error(INVALID_COMMAND);
            }
        }
    }

    getActionPlacePayload(actionData: ActionData): ActionPlacePayload {
        const payload = actionData.payload as ActionPlacePayload;
        if (payload.tiles === undefined || !Array.isArray(payload.tiles) || !payload.tiles.length) throw new Error(INVALID_PAYLOAD);
        if (payload.startPosition === undefined) throw new Error(INVALID_PAYLOAD);
        if (payload.orientation === undefined) throw new Error(INVALID_PAYLOAD);
        return payload;
    }

    getActionExchangePayload(actionData: ActionData): ActionExchangePayload {
        const payload = actionData.payload as ActionExchangePayload;
        if (payload.tiles === undefined || !Array.isArray(payload.tiles) || !payload.tiles.length) throw new Error(INVALID_PAYLOAD);
        return payload;
    }

    async handleGameOver(winnerName: string | undefined, game: Game, updatedData: GameUpdateData): Promise<string[]> {
        const [updatedScorePlayer1, updatedScorePlayer2] = game.endOfGame(winnerName);

        if (!game.isAddedToDatabase) {
            const connectedRealPlayers = game.getConnectedRealPlayers();
            for (const player of connectedRealPlayers) {
                await this.highScoresService.addHighScore(player.name, player.score, game.gameType);
            }
            game.isAddedToDatabase = true;
        }

        if (updatedData.player1) updatedData.player1.score = updatedScorePlayer1;
        else updatedData.player1 = { score: updatedScorePlayer1 };
        if (updatedData.player2) updatedData.player2.score = updatedScorePlayer2;
        else updatedData.player2 = { score: updatedScorePlayer2 };

        updatedData.isGameOver = true;
        return game.endGameMessage(winnerName);
    }

    handlePlayerLeftEvent(gameId: string, playerWhoLeftId: string): void {
        const game = this.activeGameService.getGame(gameId, playerWhoLeftId);
        const playerStillInGame = game.getPlayer(playerWhoLeftId, IS_OPPONENT);
        game.getPlayer(playerWhoLeftId, IS_REQUESTING).isConnected = false;
        const updatedData: GameUpdateData = {};
        const endOfGameMessages = this.handleGameOver(playerStillInGame.name, game, updatedData);
        this.activeGameService.playerLeftEvent.emit('playerLeftFeedback', gameId, endOfGameMessages, updatedData);
    }
}
