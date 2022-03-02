/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-lines */
/* eslint-disable dot-notation */
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { EventEmitter } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActionExchangePayload, ActionPlacePayload, ActionType, ACTION_COMMAND_INDICATOR } from '@app/classes/actions/action-data';
import CommandError from '@app/classes/command-error';
import { Location } from '@app/classes/location';
import { Orientation } from '@app/classes/orientation';
import { Player } from '@app/classes/player';
import { Position } from '@app/classes/position';
import { LetterValue, Tile } from '@app/classes/tile';
import { CommandErrorMessages, PLAYER_NOT_FOUND } from '@app/constants/command-error-messages';
import { SYSTEM_ERROR_ID } from '@app/constants/game';
import { GamePlayController } from '@app/controllers/game-play-controller/game-play.controller';
import { InputParserService } from '@app/services';
import GameService from '@app/services/game/game.service';

describe('InputParserService', () => {
    const VALID_MESSAGE_INPUT = 'How you doin';
    const VALID_LOCATION_INPUT = 'b12h';
    const VALID_LOCATION_INPUT_SINGLE = 'b12';
    const VALID_LETTERS_INPUT_MULTI = 'abc';
    const VALID_LETTERS_INPUT_SINGLE = 'a';

    const VALID_PLACE_INPUT = `${ACTION_COMMAND_INDICATOR}${ActionType.PLACE} ${VALID_LOCATION_INPUT} ${VALID_LETTERS_INPUT_MULTI}`;
    const VALID_PLACE_INPUT_SINGLE = `${ACTION_COMMAND_INDICATOR}${ActionType.PLACE} ${VALID_LOCATION_INPUT_SINGLE} ${VALID_LETTERS_INPUT_SINGLE}`;
    const VALID_EXCHANGE_INPUT = `${ACTION_COMMAND_INDICATOR}${ActionType.EXCHANGE} ${VALID_LETTERS_INPUT_MULTI}`;
    const VALID_PASS_INPUT = `${ACTION_COMMAND_INDICATOR}${ActionType.PASS}`;
    const VALID_PASS_ACTION_DATA = { type: ActionType.PASS, payload: {} };
    const VALID_RESERVE_INPUT = `${ACTION_COMMAND_INDICATOR}${ActionType.RESERVE}`;
    // const VALID_HINT_INPUT = '${ACTION_COMMAND_INDICATOR}indice';
    const VALID_HELP_INPUT = `${ACTION_COMMAND_INDICATOR}${ActionType.HELP}`;
    const VALID_POSITION: Position = { row: 0, column: 0 };
    const VALID_LOCATION: Location = { row: 0, col: 0, orientation: Orientation.Horizontal };

    const DEFAULT_GAME_ID = 'default game id';
    const DEFAULT_PLAYER_ID = 'default player id';
    const DEFAULT_PLAYER_NAME = 'default player name';
    const DEFAULT_TILES: Tile[] = [
        new Tile('A' as LetterValue, 1),
        new Tile('B' as LetterValue, 1),
        new Tile('C' as LetterValue, 1),
        new Tile('C' as LetterValue, 1),
        new Tile('E' as LetterValue, 1),
        new Tile('E' as LetterValue, 1),
        new Tile('*' as LetterValue, 0, true),
    ];
    const DEFAULT_PLAYER = new Player(DEFAULT_PLAYER_ID, DEFAULT_PLAYER_NAME, DEFAULT_TILES);
    const DEFAULT_COMMAND_ERROR_MESSAGE = CommandErrorMessages.InvalidEntry;

    const EXPECTED_PLACE_PAYLOAD_MULTI: ActionPlacePayload = {
        tiles: [new Tile('A' as LetterValue, 1), new Tile('B' as LetterValue, 1), new Tile('C' as LetterValue, 1)],
        startPosition: { row: 1, column: 11 },
        orientation: Orientation.Horizontal,
    };
    const EXPECTED_PLACE_PAYLOAD_SINGLE: ActionPlacePayload = {
        tiles: [new Tile('A' as LetterValue, 1)],
        startPosition: { row: 1, column: 11 },
        orientation: Orientation.Horizontal,
    };
    const EXPECTED_EXCHANGE_PAYLOAD: ActionExchangePayload = {
        tiles: [new Tile('A' as LetterValue, 1), new Tile('B' as LetterValue, 1), new Tile('C' as LetterValue, 1)],
    };

    let service: InputParserService;
    let gameServiceSpy: jasmine.SpyObj<GameService>;
    let gamePlayControllerSpy: jasmine.SpyObj<GamePlayController>;

    beforeEach(() => {
        gameServiceSpy = jasmine.createSpyObj('GameService', ['getLocalPlayer, getGameId']);
    });

    beforeEach(() => {
        gamePlayControllerSpy = jasmine.createSpyObj('GamePlayController', ['sendMessage', 'sendError', 'sendAction']);
        gamePlayControllerSpy.sendMessage.and.callFake(() => {
            return;
        });
        gamePlayControllerSpy.sendError.and.callFake(() => {
            return;
        });
        gamePlayControllerSpy.sendAction.and.callFake(() => {
            return;
        });

        gameServiceSpy = jasmine.createSpyObj('GameService', ['getLocalPlayer', 'getGameId', 'isLocalPlayerPlaying']);
        gameServiceSpy.getLocalPlayer.and.returnValue(DEFAULT_PLAYER);
        gameServiceSpy.getGameId.and.returnValue(DEFAULT_GAME_ID);
        gameServiceSpy.isLocalPlayerPlaying.and.returnValue(true);
        gameServiceSpy.playingTiles = new EventEmitter();

        TestBed.configureTestingModule({
            providers: [
                { provide: GamePlayController, useValue: gamePlayControllerSpy },
                { provide: GameService, useValue: gameServiceSpy },
                InputParserService,
            ],
            imports: [HttpClientTestingModule, RouterTestingModule.withRoutes([])],
        });
        service = TestBed.inject(InputParserService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('parseInput', () => {
        it('should always call getLocalPLayer, gameservice.getGameId', () => {
            const getLocalPlayerSpy = spyOn<any>(service, 'getLocalPlayer').and.returnValue(DEFAULT_PLAYER_ID);
            service.parseInput(VALID_MESSAGE_INPUT);
            expect(getLocalPlayerSpy).toHaveBeenCalled();
            expect(gameServiceSpy.getGameId).toHaveBeenCalled();
        });

        it('should call sendMessage if input doesnt start with !', () => {
            service.parseInput(VALID_MESSAGE_INPUT);
            expect(gamePlayControllerSpy.sendMessage).toHaveBeenCalled();
        });

        it('should call parseCommand if input starts with !', () => {
            const spy = spyOn<any>(service, 'parseCommand').and.returnValue(VALID_PASS_ACTION_DATA);
            service.parseInput(VALID_PASS_INPUT);
            expect(spy).toHaveBeenCalled();
        });
    });

    describe('parseCommand', () => {
        it('should call sendAction if actionData doesnt throw error', () => {
            spyOn<any>(service, 'createActionData').and.returnValue(VALID_PASS_ACTION_DATA);
            service['parseCommand'](VALID_PASS_INPUT, DEFAULT_GAME_ID, DEFAULT_PLAYER_ID);
            expect(gamePlayControllerSpy.sendAction).toHaveBeenCalled();
        });

        it('should have right error message content if createActionData throws error NotYourTurn', () => {
            spyOn<any>(service, 'getLocalPlayer').and.returnValue(DEFAULT_PLAYER);
            spyOn<any>(service, 'createActionData').and.callFake(() => {
                throw new CommandError(DEFAULT_COMMAND_ERROR_MESSAGE);
            });
            service['parseCommand'](VALID_PASS_INPUT, DEFAULT_GAME_ID, DEFAULT_PLAYER_ID);
            expect(gamePlayControllerSpy.sendError).toHaveBeenCalledWith(DEFAULT_GAME_ID, DEFAULT_PLAYER_ID, {
                content: `La commande **${VALID_PASS_INPUT}** est invalide :<br />${DEFAULT_COMMAND_ERROR_MESSAGE}`,
                senderId: SYSTEM_ERROR_ID,
            });
        });

        it('should have right error message content if createActionData throws other commandError', () => {
            spyOn<any>(service, 'getLocalPlayer').and.returnValue(DEFAULT_PLAYER);
            spyOn<any>(service, 'createActionData').and.callFake(() => {
                throw new CommandError(CommandErrorMessages.NotYourTurn);
            });
            service['parseCommand'](VALID_PASS_INPUT, DEFAULT_GAME_ID, DEFAULT_PLAYER_ID);
            expect(gamePlayControllerSpy.sendError).toHaveBeenCalledWith(DEFAULT_GAME_ID, DEFAULT_PLAYER_ID, {
                content: CommandErrorMessages.NotYourTurn,
                senderId: SYSTEM_ERROR_ID,
            });
        });

        it('should not throw if error thrown by createActionData is not a CommandError', () => {
            spyOn<any>(service, 'getLocalPlayer').and.returnValue(DEFAULT_PLAYER);
            spyOn<any>(service, 'createActionData').and.callFake(() => {
                throw new Error('other error message');
            });
            expect(() => service['parseCommand'](VALID_PASS_INPUT, DEFAULT_GAME_ID, DEFAULT_PLAYER_ID)).not.toThrow();
            expect(gamePlayControllerSpy.sendError).not.toHaveBeenCalled();
        });
    });

    describe('createActionData', () => {
        it('should call separateCommandWords and verifyActionValidity', () => {
            const separateSpy = spyOn<any>(service, 'separateCommandWords').and.returnValue([ActionType.PASS]);
            const verifyValiditySpy = spyOn<any>(service, 'verifyActionValidity');
            service['createActionData'](VALID_PASS_INPUT);
            expect(separateSpy).toHaveBeenCalled();
            expect(verifyValiditySpy).toHaveBeenCalled();
        });

        it('should return right ActionData if input is a valid place command', () => {
            expect(service['createActionData'](VALID_PLACE_INPUT_SINGLE)).toEqual({
                type: ActionType.PLACE,
                input: VALID_PLACE_INPUT_SINGLE,
                payload: EXPECTED_PLACE_PAYLOAD_SINGLE,
            });
            expect(service['createActionData'](VALID_PLACE_INPUT)).toEqual({
                type: ActionType.PLACE,
                input: VALID_PLACE_INPUT,
                payload: EXPECTED_PLACE_PAYLOAD_MULTI,
            });
        });

        it('should call createPlaceActionPayload if input is a valid place command', () => {
            const spy = spyOn<any>(service, 'createPlaceActionPayload').and.returnValue(EXPECTED_PLACE_PAYLOAD_SINGLE);
            service['createActionData'](VALID_PLACE_INPUT_SINGLE);
            expect(spy).toHaveBeenCalled();
        });

        it('should return right ActionData if input is a valid exchange command', () => {
            expect(service['createActionData'](VALID_EXCHANGE_INPUT)).toEqual({
                type: ActionType.EXCHANGE,
                input: VALID_EXCHANGE_INPUT,
                payload: EXPECTED_EXCHANGE_PAYLOAD,
            });
        });

        it('should call createExchangeActionPayload if input is a valid exchange command', () => {
            const spy = spyOn<any>(service, 'createExchangeActionPayload').and.returnValue(EXPECTED_EXCHANGE_PAYLOAD);
            service['createActionData'](VALID_EXCHANGE_INPUT);
            expect(spy).toHaveBeenCalled();
        });

        it('should return right Actiondata if input is a valid pass command', () => {
            expect(service['createActionData'](VALID_PASS_INPUT)).toEqual({ type: ActionType.PASS, input: VALID_PASS_INPUT, payload: {} });
        });

        it('should return right Actiondata if input is a valid reserve command', () => {
            expect(service['createActionData'](VALID_RESERVE_INPUT)).toEqual({
                type: ActionType.RESERVE,
                input: VALID_RESERVE_INPUT,
                payload: {},
            });
        });

        // it('should call sendHintAction if input is a valid hint command', () => { });

        it('should return right Actiondata if input is a valid help command', () => {
            expect(service['createActionData'](VALID_HELP_INPUT)).toEqual({ type: ActionType.HELP, input: VALID_HELP_INPUT, payload: {} });
        });

        it('should throw error if commands have incorrect lengths', () => {
            const invalidCommands: [command: string, error: CommandErrorMessages][] = [
                [`${ACTION_COMMAND_INDICATOR}placer abc`, CommandErrorMessages.PlaceBadSyntax],
                [`${ACTION_COMMAND_INDICATOR}échanger one two three`, CommandErrorMessages.ExchangeBadSyntax],
                [`${ACTION_COMMAND_INDICATOR}passer thing`, CommandErrorMessages.PassBadSyntax],
                [`${ACTION_COMMAND_INDICATOR}réserve second word`, CommandErrorMessages.BadSyntax],
                // `${ACTION_COMMAND_INDICATOR}indice not length of two`,
                [`${ACTION_COMMAND_INDICATOR}aide help`, CommandErrorMessages.BadSyntax],
            ];
            for (const [command, error] of invalidCommands) {
                expect(() => service['createActionData'](command)).toThrow(new CommandError(error));
            }
        });

        it('should throw error if command does not exist', () => {
            expect(() => {
                service['createActionData']('!trouver un ami');
            }).toThrow(new CommandError(CommandErrorMessages.InvalidEntry));
        });
    });

    describe('createLocation', () => {
        it('should return right rowNumber and columnNumber', () => {
            const locationStrings: string[] = ['a1h', 'a15v', 'b18', 'g12h', 'f1v', 'z12v', 'o15h', 'o1'];
            const expectedPositions: number[][] = [
                [0, 0],
                [0, 14],
                [1, 17],
                [6, 11],
                [5, 0],
                [25, 11],
                [14, 14],
                [14, 0],
            ];

            for (let i = 0; i < locationStrings.length; i++) {
                const result = service['createLocation'](locationStrings[i], 1);
                expect(result.row).toEqual(expectedPositions[i][0]);
                expect(result.col).toEqual(expectedPositions[i][1]);
            }
        });

        it('should throw if lastChar is a number and trying to place multiple letters', () => {
            expect(() => {
                service['createLocation'](VALID_LOCATION_INPUT_SINGLE, VALID_LETTERS_INPUT_MULTI.length);
            }).toThrow(new CommandError(CommandErrorMessages.PlaceBadSyntax));
        });

        it('should have horizontal orientation if last char is number and trying to place one letter', () => {
            expect(service['createLocation'](VALID_LOCATION_INPUT, 1).orientation).toEqual(Orientation.Horizontal);
            expect(service['createLocation'](VALID_LOCATION_INPUT_SINGLE, 1).orientation).toEqual(Orientation.Horizontal);
        });

        it('should throw if last char is not a number and is not h or v', () => {
            expect(() => {
                service['createLocation']('a1x', VALID_LETTERS_INPUT_MULTI.length);
            }).toThrow(new CommandError(CommandErrorMessages.BadSyntax));
        });

        it('should have horizontal orientation if last char is h', () => {
            expect(service['createLocation']('a1h', 1).orientation).toEqual(Orientation.Horizontal);
        });

        it('should have vertical orientation if last char is v', () => {
            expect(service['createLocation']('a1v', 1).orientation).toEqual(Orientation.Vertical);
        });
    });

    describe('createPlaceActionPayload', () => {
        it('should call createLocation, parsePlaceLettersToTiles et getStartPosition', () => {
            const createLocationSpy = spyOn<any>(service, 'createLocation').and.returnValue(VALID_LOCATION);
            const lettersToTilesSpy = spyOn<any>(service, 'parseLettersToTiles');
            const positionSpy = spyOn<any>(service, 'getStartPosition').and.returnValue(VALID_POSITION);
            service['createPlaceActionPayload'](VALID_LOCATION_INPUT, VALID_LETTERS_INPUT_SINGLE);
            expect(createLocationSpy).toHaveBeenCalledWith(VALID_LOCATION_INPUT, VALID_LETTERS_INPUT_SINGLE.length);
            expect(lettersToTilesSpy).toHaveBeenCalledWith(VALID_LETTERS_INPUT_SINGLE, ActionType.PLACE);
            expect(positionSpy).toHaveBeenCalled();
        });

        it('should emit playingTiles', () => {
            const emitSpy = spyOn<any>(service['gameService']['playingTiles'], 'emit');
            service['createPlaceActionPayload'](VALID_LOCATION_INPUT, VALID_LETTERS_INPUT_SINGLE);
            expect(emitSpy).toHaveBeenCalled();
        });
    });

    describe('createExchangeActionPayload', () => {
        it('should call parseLettersToTiles with right attributes', () => {
            const letterToTilesSpy = spyOn<any>(service, 'parseLettersToTiles');
            service['createExchangeActionPayload'](VALID_LETTERS_INPUT_MULTI);
            expect(letterToTilesSpy).toHaveBeenCalledWith(VALID_LETTERS_INPUT_MULTI, ActionType.EXCHANGE);
        });

        it('createExchangeActionPayload should return expected payload', () => {
            expect(service['createExchangeActionPayload'](VALID_LETTERS_INPUT_MULTI)).toEqual(EXPECTED_EXCHANGE_PAYLOAD);
        });
    });

    describe('parseLettersToTiles', () => {
        it('should return valid tiles with valid input for place actions', () => {
            const validLetters = ['abce', 'ceX', 'bKcc', 'ccee'];
            const expectedTiles: Tile[][] = [
                [new Tile('A' as LetterValue, 1), new Tile('B' as LetterValue, 1), new Tile('C' as LetterValue, 1), new Tile('E' as LetterValue, 1)],
                [new Tile('C' as LetterValue, 1), new Tile('E' as LetterValue, 1), new Tile('X' as LetterValue, 0, true)],
                [
                    new Tile('B' as LetterValue, 1),
                    new Tile('K' as LetterValue, 0, true),
                    new Tile('C' as LetterValue, 1),
                    new Tile('C' as LetterValue, 1),
                ],
                [new Tile('C' as LetterValue, 1), new Tile('C' as LetterValue, 1), new Tile('E' as LetterValue, 1), new Tile('E' as LetterValue, 1)],
            ];

            for (let i = 0; i < validLetters.length; i++) {
                expect(service['parseLettersToTiles'](validLetters[i], ActionType.PLACE)).toEqual(expectedTiles[i]);
            }
        });

        it('should throw error with invalid input for place actions', () => {
            const invalidLetters = ['a&c"e', 'abcdefghiklm', 'lmno', 'ABCD', 'aAB', 'aKL'];
            const errorMessages: CommandErrorMessages[] = [
                CommandErrorMessages.DontHaveTiles,
                CommandErrorMessages.DontHaveTiles,
                CommandErrorMessages.DontHaveTiles,
                CommandErrorMessages.DontHaveTiles,
                CommandErrorMessages.DontHaveTiles,
                CommandErrorMessages.DontHaveTiles,
            ];

            for (let i = 0; i < invalidLetters.length; i++) {
                expect(() => {
                    service['parseLettersToTiles'](invalidLetters[i], ActionType.PLACE);
                }).toThrow(new CommandError(errorMessages[i]));
            }
        });

        it('should return valid tiles with valid input for exchange actions', () => {
            const validLetters = ['abce', 'ab*', 'ccee'];
            const expectedTiles: Tile[][] = [
                [new Tile('A' as LetterValue, 1), new Tile('B' as LetterValue, 1), new Tile('C' as LetterValue, 1), new Tile('E' as LetterValue, 1)],
                [new Tile('A' as LetterValue, 1), new Tile('B' as LetterValue, 1), new Tile('*' as LetterValue, 0)],
                [new Tile('C' as LetterValue, 1), new Tile('C' as LetterValue, 1), new Tile('E' as LetterValue, 1), new Tile('E' as LetterValue, 1)],
            ];

            for (let i = 0; i < validLetters.length; i++) {
                expect(service['parseLettersToTiles'](validLetters[i], ActionType.EXCHANGE)).toEqual(expectedTiles[i]);
            }
        });

        it('should throw error with invalid input for exchange actions', () => {
            const invalidLetters = ['a&c"e', 'abcdefghiklm', 'lmno', 'ABCD', 'aaaa'];
            const errorMessages: CommandErrorMessages[] = [
                CommandErrorMessages.DontHaveTiles,
                CommandErrorMessages.DontHaveTiles,
                CommandErrorMessages.DontHaveTiles,
                CommandErrorMessages.ExhangeRequireLowercaseLettes,
                CommandErrorMessages.DontHaveTiles,
            ];

            for (let i = 0; i < invalidLetters.length; i++) {
                expect(() => {
                    service['parseLettersToTiles'](invalidLetters[i], ActionType.EXCHANGE);
                }).toThrow(new CommandError(errorMessages[i]));
            }
        });
    });

    describe('isValidBlankTileCombination', () => {
        const VALID_PLAYER_LETTER = '*';
        const VALID_PLACE_LETTER = 'A';

        it('should return true if combination for blank tile is valid', () => {
            expect(service['isValidBlankTileCombination'](VALID_PLAYER_LETTER, VALID_PLACE_LETTER)).toBeTrue();
        });

        it('should return false if player tile is not *', () => {
            expect(service['isValidBlankTileCombination']('A', VALID_PLACE_LETTER)).toBeFalse();
        });

        it('should return false if placeLetter is not a valid LetterValue', () => {
            expect(service['isValidBlankTileCombination'](VALID_PLAYER_LETTER, '^')).toBeFalse();
        });

        it('should return false if placeLetter is in lower case', () => {
            expect(service['isValidBlankTileCombination'](VALID_PLAYER_LETTER, 'a')).toBeFalse();
        });
    });

    describe('isNumber', () => {
        it('should return true if char is a number', () => {
            expect(service['isNumber']('6')).toBeTrue();
        });

        it('should return false if char is not a number', () => {
            const notNumberChars: string[] = ['a', 'F', '&', '^', ' '];

            for (const notNumberChar of notNumberChars) {
                expect(service['isNumber'](notNumberChar)).toBeFalse();
            }
            expect(service['isNumber']('6')).toBeTrue();
        });
    });

    describe('isPositionWithinBounds', () => {
        it('should retrun false if position is invalid', () => {
            const invalidPositions: Position[] = [
                { row: -2, column: 0 },
                { row: -2, column: -5 },
                { row: 5, column: 18 },
                { row: 88, column: 693 },
            ];

            for (const invalidPosition of invalidPositions) {
                expect(service['isPositionWithinBounds'](invalidPosition)).toBeFalse();
            }
        });

        it('should return true if position if is in bounds', () => {
            expect(service['isPositionWithinBounds'](VALID_POSITION)).toBeTrue();
        });
    });

    describe('isAction', () => {
        it('should return true if input starts with right indicator', () => {
            expect(service['isAction'](VALID_EXCHANGE_INPUT)).toBeTrue();
        });

        it('should return false if input does not start with right indicator', () => {
            expect(service['isAction'](VALID_MESSAGE_INPUT)).toBeFalse();
        });
    });

    describe('separateCommandWords', () => {
        it('should return right input words from command', () => {
            const expected = [ActionType.PLACE, VALID_LOCATION_INPUT, VALID_LETTERS_INPUT_MULTI];
            expect(service['separateCommandWords'](VALID_PLACE_INPUT)).toEqual(expected);
        });
    });

    describe('verifyActionValidity', () => {
        it('should throw error if actionType is undefined', () => {
            expect(() => {
                service['verifyActionValidity'](undefined as unknown as ActionType);
            }).toThrow(new CommandError(CommandErrorMessages.InvalidEntry));
        });

        it('should throw error if game is over', () => {
            gameServiceSpy.isGameOver = true;
            expect(() => {
                service['verifyActionValidity'](ActionType.RESERVE);
            }).toThrow(new CommandError(CommandErrorMessages.GameOver));
        });

        it("should throw error if on your turn command and it is not the player's turn", () => {
            gameServiceSpy.isGameOver = false;
            gameServiceSpy.isLocalPlayerPlaying.and.returnValue(false);
            expect(() => {
                service['verifyActionValidity'](ActionType.PASS);
            }).toThrow(new CommandError(CommandErrorMessages.NotYourTurn));
        });
    });

    describe('getStartPosition', () => {
        it('should call isPositionWithinBounds', () => {
            const isWithinBoundsSpy = spyOn<any>(service, 'isPositionWithinBounds').and.returnValue(true);
            service['getStartPosition'](VALID_LOCATION);
            expect(isWithinBoundsSpy).toHaveBeenCalledWith(VALID_POSITION);
        });

        it('should return right position with valid location', () => {
            expect(service['getStartPosition'](VALID_LOCATION)).toEqual(VALID_POSITION);
        });

        it('should throw if position is not within bounds', () => {
            spyOn<any>(service, 'isPositionWithinBounds').and.returnValue(false);
            expect(() => {
                service['getStartPosition'](VALID_LOCATION);
            }).toThrow(new CommandError(CommandErrorMessages.PositionFormat));
        });
    });

    describe('getLocalPlayer', () => {
        it('should call gameService.getLocalPlayer()', () => {
            gameServiceSpy.getLocalPlayer.and.returnValue(DEFAULT_PLAYER);
            service['getLocalPlayer']();
            expect(gameServiceSpy.getLocalPlayer).toHaveBeenCalled();
        });

        it('should return player if gameservice.localPlayer exits', () => {
            gameServiceSpy.getLocalPlayer.and.returnValue(DEFAULT_PLAYER);
            expect(service['getLocalPlayer']()).toEqual(DEFAULT_PLAYER);
        });

        it('should throw PLAYER_NOT_FOUND if gameservice.localPlayer does not exist', () => {
            gameServiceSpy.getLocalPlayer.and.returnValue(undefined);
            expect(() => service['getLocalPlayer']()).toThrowError(PLAYER_NOT_FOUND);
        });
    });
});
