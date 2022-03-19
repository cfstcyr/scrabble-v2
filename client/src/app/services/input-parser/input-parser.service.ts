import { Injectable } from '@angular/core';
import { ActionData, ActionType, ACTION_COMMAND_INDICATOR, ExchangeActionPayload, PlaceActionPayload } from '@app/classes/actions/action-data';
import CommandException from '@app/classes/command-exception';
import { Location } from '@app/classes/location';
import { Orientation } from '@app/classes/orientation';
import { AbstractPlayer } from '@app/classes/player';
import { Position } from '@app/classes/position';
import { LetterValue, Tile } from '@app/classes/tile';
import { CommandExceptionMessages, PLAYER_NOT_FOUND } from '@app/constants/command-exception-messages';
import {
    BLANK_TILE_LETTER_VALUE,
    BOARD_SIZE,
    DEFAULT_ORIENTATION,
    EXPECTED_COMMAND_WORD_COUNT,
    LETTER_VALUES,
    ON_YOUR_TURN_ACTIONS,
    SYSTEM_ERROR_ID,
} from '@app/constants/game';
import { GamePlayController } from '@app/controllers/game-play-controller/game-play.controller';
import { GameService } from '@app/services';
import { ActionService } from '@app/services/action/action.service';
import { GameViewEventManagerService } from '@app/services/game-view-event-manager/game-view-event-manager.service';
import { isNumber } from '@app/utils/is-number';

const ASCII_VALUE_OF_LOWERCASE_A = 97;

@Injectable({
    providedIn: 'root',
})
export default class InputParserService {
    constructor(
        private controller: GamePlayController,
        private gameService: GameService,
        private gameViewEventManagerService: GameViewEventManagerService,
        private actionService: ActionService,
    ) {}

    handleInput(input: string): void {
        const playerId = this.getLocalPlayer().id;
        const gameId = this.gameService.getGameId();

        if (this.isAction(input)) {
            this.handleCommand(input, gameId, playerId);
        } else {
            this.controller.sendMessage(gameId, playerId, {
                content: input,
                senderId: playerId,
            });
        }
    }

    private handleCommand(input: string, gameId: string, playerId: string): void {
        try {
            this.actionService.sendAction(gameId, playerId, this.createActionData(input));
        } catch (exception) {
            if (exception instanceof CommandException) {
                const errorMessageContent =
                    exception.message === CommandExceptionMessages.NotYourTurn
                        ? exception.message
                        : `La commande **${input}** est invalide :<br />${exception.message}`;

                this.controller.sendError(gameId, playerId, {
                    content: errorMessageContent,
                    senderId: SYSTEM_ERROR_ID,
                });
            }
        }
    }

    private createActionData(input: string): ActionData {
        const inputWords: string[] = this.separateCommandWords(input);
        const actionType: string = inputWords[0];

        this.verifyActionValidity(actionType as ActionType);
        if (inputWords.length !== EXPECTED_COMMAND_WORD_COUNT.get(actionType as ActionType)) {
            throw new CommandException(CommandExceptionMessages.PlaceBadSyntax);
        }

        switch (actionType) {
            case ActionType.PLACE:
                return {
                    type: ActionType.PLACE,
                    input,
                    payload: this.createPlaceActionPayload(inputWords[1], inputWords[2]),
                };
            case ActionType.EXCHANGE:
                return {
                    type: ActionType.EXCHANGE,
                    input,
                    payload: this.createExchangeActionPayload(inputWords[1]),
                };
            case ActionType.PASS:
                return {
                    type: ActionType.PASS,
                    input,
                    payload: {},
                };
            case ActionType.RESERVE:
                return {
                    type: ActionType.RESERVE,
                    input,
                    payload: {},
                };
            case ActionType.HINT:
                return {
                    type: ActionType.HINT,
                    input,
                    payload: {},
                };
            case ActionType.HELP:
                return {
                    type: ActionType.HELP,
                    input,
                    payload: {},
                };
            default:
                throw new CommandException(CommandExceptionMessages.InvalidEntry);
        }
    }

    private createLocation(locationString: string, nLettersToPlace: number): Location {
        const locationLastChar = locationString.charAt(locationString.length - 1);
        const rowNumber: number = this.getRowNumberFromChar(locationString[0]);
        const colNumber = parseInt(locationString.substring(1), 10) - 1;
        let orientation: Orientation;

        if (isNumber(locationLastChar)) {
            if (nLettersToPlace !== 1) throw new CommandException(CommandExceptionMessages.PlaceBadSyntax);
            orientation = DEFAULT_ORIENTATION;
        } else {
            if (locationLastChar === 'h') orientation = Orientation.Horizontal;
            else if (locationLastChar === 'v') orientation = Orientation.Vertical;
            else throw new CommandException(CommandExceptionMessages.BadSyntax);
        }

        return {
            row: rowNumber,
            col: colNumber,
            orientation,
        };
    }

    private createPlaceActionPayload(locationString: string, lettersToPlace: string): PlaceActionPayload {
        const location: Location = this.createLocation(locationString, lettersToPlace.length);

        const placeActionPayload: PlaceActionPayload = this.actionService.createPlaceActionPayload(
            this.parseLettersToTiles(lettersToPlace, ActionType.PLACE),
            this.getStartPosition(location),
            location.orientation,
        );

        this.gameViewEventManagerService.emitGameViewEvent('usedTiles', placeActionPayload);
        return placeActionPayload;
    }

    private createExchangeActionPayload(lettersToExchange: string): ExchangeActionPayload {
        return this.actionService.createExchangeActionPayload(this.parseLettersToTiles(lettersToExchange, ActionType.EXCHANGE));
    }

    private parseLettersToTiles(lettersToParse: string, actionType: ActionType.PLACE | ActionType.EXCHANGE): Tile[] {
        if (actionType === ActionType.EXCHANGE) {
            if (lettersToParse !== lettersToParse.toLowerCase()) throw new CommandException(CommandExceptionMessages.ExchangeRequireLowercaseLetters);
        }

        const player: AbstractPlayer = this.getLocalPlayer();
        const playerTiles: Tile[] = [];
        player.getTiles().forEach((tile: Tile) => {
            playerTiles.push(new Tile(tile.letter, tile.value));
        });
        const parsedTiles: Tile[] = [];

        for (const letter of lettersToParse) {
            for (let i = Object.values(playerTiles).length - 1; i >= 0; i--) {
                if (playerTiles[i].letter.toLowerCase() === letter) {
                    parsedTiles.push(playerTiles.splice(i, 1)[0]);
                    break;
                } else if (actionType === ActionType.PLACE && this.isValidBlankTileCombination(playerTiles[i].letter, letter)) {
                    const tile = playerTiles.splice(i, 1)[0];
                    parsedTiles.push(new Tile(letter as LetterValue, tile.value, true));
                    break;
                }
            }
        }

        if (parsedTiles.length !== lettersToParse.length) throw new CommandException(CommandExceptionMessages.DontHaveTiles);

        return parsedTiles;
    }

    private isValidBlankTileCombination(playerLetter: string, placeLetter: string): boolean {
        return (
            playerLetter === BLANK_TILE_LETTER_VALUE &&
            LETTER_VALUES.includes(placeLetter as LetterValue) &&
            placeLetter === placeLetter.toUpperCase()
        );
    }

    private isPositionWithinBounds(position: Position): boolean {
        return position.row >= 0 && position.column >= 0 && position.row < BOARD_SIZE && position.column < BOARD_SIZE;
    }

    private isAction(input: string): boolean {
        return input[0] === ACTION_COMMAND_INDICATOR;
    }

    private separateCommandWords(input: string): string[] {
        return input.substring(1).split(' ');
    }

    private verifyActionValidity(actionName: ActionType): void {
        if (!actionName) throw new CommandException(CommandExceptionMessages.InvalidEntry);
        if (this.gameService.isGameOver) throw new CommandException(CommandExceptionMessages.GameOver);
        if (!this.gameService.isLocalPlayerPlaying() && ON_YOUR_TURN_ACTIONS.includes(actionName))
            throw new CommandException(CommandExceptionMessages.NotYourTurn);
    }

    private getStartPosition(location: Location): Position {
        const inputStartPosition: Position = {
            row: location.row,
            column: location.col,
        };

        if (!this.isPositionWithinBounds(inputStartPosition)) throw new CommandException(CommandExceptionMessages.PositionFormat);
        return inputStartPosition;
    }

    private getLocalPlayer(): AbstractPlayer {
        const localPlayer: AbstractPlayer | undefined = this.gameService.getLocalPlayer();
        if (localPlayer) {
            return localPlayer;
        }
        throw new Error(PLAYER_NOT_FOUND);
    }

    private getRowNumberFromChar(char: string): number {
        return char.charCodeAt(0) - ASCII_VALUE_OF_LOWERCASE_A;
    }
}
