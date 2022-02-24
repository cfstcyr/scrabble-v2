/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable dot-notation */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { GameUpdateData, PlayerData } from '@app/classes/communication';
import { StartMultiplayerGameData } from '@app/classes/communication/game-config';
import { Message } from '@app/classes/communication/message';
import { GameType } from '@app/classes/game-type';
import { AbstractPlayer, Player } from '@app/classes/player';
import { PlayerContainer } from '@app/classes/player/player-container';
import { Round } from '@app/classes/round';
import { Square } from '@app/classes/square';
import { TileReserveData } from '@app/classes/tile/tile.types';
import { GameDispatcherController } from '@app/controllers/game-dispatcher-controller/game-dispatcher.controller';
import { BoardService, GameService } from '@app/services';
import { GameViewEventManagerService } from '@app/services/game-view-event-manager/game-view-event-manager.service';
import RoundManagerService from '@app/services/round-manager/round-manager.service';
import { Observable, Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import SpyObj = jasmine.SpyObj;

const DEFAULT_PLAYER_ID = 'cov-id';
const DEFAULT_SQUARE: Omit<Square, 'position'> = { tile: null, scoreMultiplier: null, wasMultiplierUsed: false, isCenter: false };
const DEFAULT_GRID_SIZE = 8;
const DEFAULT_PLAYER_1 = { name: 'phineas', id: 'id-1', score: 0, tiles: [] };
const DEFAULT_PLAYER_2 = { name: 'ferb', id: 'id-2', score: 0, tiles: [] };

@Component({
    template: '',
})
class TestComponent {}

describe('GameService', () => {
    let service: GameService;
    let boardServiceSpy: SpyObj<BoardService>;
    let roundManagerSpy: SpyObj<RoundManagerService>;
    let gameDispatcherControllerSpy: SpyObj<GameDispatcherController>;
    let gameViewEventManagerSpy: SpyObj<GameViewEventManagerService>;

    beforeEach(() => {
        boardServiceSpy = jasmine.createSpyObj('BoardService', ['initializeBoard', 'updateBoard']);
        roundManagerSpy = jasmine.createSpyObj('RoundManagerService', [
            'convertRoundDataToRound',
            'startRound',
            'updateRound',
            'getActivePlayer',
            'initialize',
            'resetTimerData',
            'continueRound',
            'initializeEvents',
        ]);
        gameDispatcherControllerSpy = jasmine.createSpyObj('GameDispatcherController', ['']);

        const tileRackUpdate$ = new Subject();
        const message$ = new Subject();
        const reRender$ = new Subject();
        const noActiveGame$ = new Subject();
        gameViewEventManagerSpy = jasmine.createSpyObj('GameViewEventManagerService', ['emitGameViewEvent', 'subscribeToGameViewEvent']);
        gameViewEventManagerSpy.emitGameViewEvent.and.callFake((eventType: string) => {
            switch (eventType) {
                case 'tileRackUpdate':
                    tileRackUpdate$.next();
                    break;
                case 'reRender':
                    reRender$.next();
                    break;
                case 'noActiveGame':
                    noActiveGame$.next();
                    break;
                case 'newMessage':
                    message$.next();
            }
        });

        gameViewEventManagerSpy.subscribeToGameViewEvent.and.callFake((eventType: string, destroy$: Observable<boolean>, next: any): Subscription => {
            switch (eventType) {
                case 'tileRackUpdate':
                    return tileRackUpdate$.pipe(takeUntil(destroy$)).subscribe(next);
                case 'reRender':
                    return reRender$.pipe(takeUntil(destroy$)).subscribe(next);
                case 'noActiveGame':
                    return noActiveGame$.pipe(takeUntil(destroy$)).subscribe(next);
                case 'newMessage':
                    return message$.pipe(takeUntil(destroy$)).subscribe(next);
            }
            return new Subscription();
        });
    });

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                HttpClientTestingModule,
                RouterTestingModule.withRoutes([
                    { path: 'game', component: TestComponent },
                    { path: 'other', component: TestComponent },
                ]),
            ],
            providers: [
                { provide: BoardService, useValue: boardServiceSpy },
                { provide: RoundManagerService, useValue: roundManagerSpy },
                { provide: GameDispatcherController, useValue: gameDispatcherControllerSpy },
                { provide: GameViewEventManagerService, useValue: gameViewEventManagerSpy },
            ],
        });
        service = TestBed.inject(GameService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('ngOnDestroy', () => {
        let serviceDestroyed$py: SpyObj<Subject<boolean>>;

        beforeEach(() => {
            serviceDestroyed$py = jasmine.createSpyObj('Subject', ['next', 'complete']);
            service['serviceDestroyed$'] = serviceDestroyed$py;
        });

        it('should call serviceDestroyed$.next', () => {
            service.ngOnDestroy();
            expect(serviceDestroyed$py.next).toHaveBeenCalledOnceWith(true);
        });

        it('should call serviceDestroyed$.complete', () => {
            service.ngOnDestroy();
            expect(serviceDestroyed$py.complete).toHaveBeenCalled();
        });
    });

    describe('initializeMultiplayerGame', () => {
        let defaultGameData: StartMultiplayerGameData;

        beforeEach(() => {
            defaultGameData = {
                player1: DEFAULT_PLAYER_1,
                player2: DEFAULT_PLAYER_2,
                gameType: GameType.Classic,
                maxRoundTime: 1,
                dictionary: 'default',
                gameId: 'game-id',
                board: new Array(DEFAULT_GRID_SIZE).map((_, y) => {
                    return new Array(DEFAULT_GRID_SIZE).map((__, x) => ({ ...DEFAULT_SQUARE, position: { row: y, column: x } }));
                }),
                tileReserve: [],
                round: {
                    playerData: DEFAULT_PLAYER_1,
                    startTime: new Date(),
                    limitTime: new Date(),
                    completedTime: null,
                },
            };
        });

        it('should set gameId', async () => {
            expect(service.getGameId()).not.toBeDefined();
            await service.initializeMultiplayerGame(DEFAULT_PLAYER_ID, defaultGameData);
            expect(service.getGameId()).toEqual(defaultGameData.gameId);
        });

        it('should set player 1', async () => {
            await service.initializeMultiplayerGame(DEFAULT_PLAYER_ID, defaultGameData);
            expect(service['playerContainer']!.getPlayer(1)).toBeDefined();
        });

        it('should set player 2', async () => {
            await service.initializeMultiplayerGame(DEFAULT_PLAYER_ID, defaultGameData);
            expect(service['playerContainer']!.getPlayer(2)).toBeDefined();
        });

        it('should set gameType', async () => {
            expect(service.gameType).not.toBeDefined();
            await service.initializeMultiplayerGame(DEFAULT_PLAYER_ID, defaultGameData);
            expect(service.gameType).toEqual(defaultGameData.gameType);
        });

        it('should set dictionnaryName', async () => {
            expect(service.dictionnaryName).not.toBeDefined();
            await service.initializeMultiplayerGame(DEFAULT_PLAYER_ID, defaultGameData);
            expect(service.dictionnaryName).toEqual(defaultGameData.dictionary);
        });

        it('should initialize roundManager', async () => {
            await service.initializeMultiplayerGame(DEFAULT_PLAYER_ID, defaultGameData);
            expect(roundManagerSpy.initialize).toHaveBeenCalled();
        });

        it('should set tileReserve', async () => {
            expect(service.tileReserve).not.toBeDefined();
            await service.initializeMultiplayerGame(DEFAULT_PLAYER_ID, defaultGameData);
            expect(service.tileReserve).toEqual(defaultGameData.tileReserve);
        });

        it('should call initializeBoard', async () => {
            await service.initializeMultiplayerGame(DEFAULT_PLAYER_ID, defaultGameData);
            expect(boardServiceSpy.initializeBoard).toHaveBeenCalledWith(defaultGameData.board);
        });

        it('should call startRound', fakeAsync(() => {
            const router: Router = TestBed.inject(Router);
            router.navigateByUrl('other');
            tick();
            service.initializeMultiplayerGame(DEFAULT_PLAYER_ID, defaultGameData);
            expect(roundManagerSpy.startRound).toHaveBeenCalled();
        }));

        it('should call initialize', fakeAsync(() => {
            const router: Router = TestBed.inject(Router);
            router.navigateByUrl('other');
            tick();
            service.initializeMultiplayerGame(DEFAULT_PLAYER_ID, defaultGameData);
            expect(roundManagerSpy.startRound).toHaveBeenCalled();
        }));

        it('should call navigateByUrl', fakeAsync(() => {
            const router: Router = TestBed.inject(Router);
            router.navigateByUrl('other');
            tick();
            const spy = spyOn(service['router'], 'navigateByUrl');
            service.initializeMultiplayerGame(DEFAULT_PLAYER_ID, defaultGameData);
            expect(spy).toHaveBeenCalledWith('game');
        }));

        it('should call reconnectReinitialize', fakeAsync(() => {
            const router: Router = TestBed.inject(Router);
            router.navigateByUrl('game');
            tick();
            const spy = spyOn(service, 'reconnectReinitialize').and.callFake(() => {
                return;
            });
            service.initializeMultiplayerGame(DEFAULT_PLAYER_ID, defaultGameData);
            expect(spy).toHaveBeenCalled();
        }));

        it('should call startRound', async () => {
            await service.initializeMultiplayerGame(DEFAULT_PLAYER_ID, defaultGameData);
            expect(roundManagerSpy.startRound).toHaveBeenCalled();
        });

        it('should call navigateByUrl', async () => {
            const spy = spyOn(service['router'], 'navigateByUrl');
            await service.initializeMultiplayerGame(DEFAULT_PLAYER_ID, defaultGameData);
            expect(spy).toHaveBeenCalledWith('game');
        });
    });

    describe('reconnectReinitialize', () => {
        let defaultGameData: StartMultiplayerGameData;

        beforeEach(() => {
            service['playerContainer'] = new PlayerContainer(DEFAULT_PLAYER_1.id);
            service['playerContainer']['players'].add(new Player(DEFAULT_PLAYER_1.id, DEFAULT_PLAYER_1.name, DEFAULT_PLAYER_1.tiles));
            service['playerContainer']['players'].add(new Player(DEFAULT_PLAYER_2.id, DEFAULT_PLAYER_2.name, DEFAULT_PLAYER_2.tiles));
            defaultGameData = {
                player1: DEFAULT_PLAYER_1,
                player2: DEFAULT_PLAYER_2,
                gameType: GameType.Classic,
                maxRoundTime: 1,
                dictionary: 'default',
                gameId: 'game-id',
                board: new Array(DEFAULT_GRID_SIZE).map((_, y) => {
                    return new Array(DEFAULT_GRID_SIZE).map((__, x) => ({ ...DEFAULT_SQUARE, position: { row: y, column: x } }));
                }),
                tileReserve: [],
                round: {
                    playerData: DEFAULT_PLAYER_1,
                    startTime: new Date(),
                    limitTime: new Date(),
                    completedTime: null,
                },
            };
        });

        it('should create player', () => {
            const player1Spy = spyOn(service['playerContainer']!.getPlayer(1), 'updatePlayerData');
            const player2Spy = spyOn(service['playerContainer']!.getPlayer(2), 'updatePlayerData');
            const emitSpy = gameViewEventManagerSpy.emitGameViewEvent;
            service.reconnectReinitialize(defaultGameData);

            expect(player1Spy).toHaveBeenCalled();
            expect(player2Spy).toHaveBeenCalled();
            expect(emitSpy).toHaveBeenCalledWith('reRender');
            expect(emitSpy).toHaveBeenCalledWith('tileRackUpdate');
            expect(boardServiceSpy.updateBoard).toHaveBeenCalled();
            expect(roundManagerSpy.continueRound).toHaveBeenCalled();
        });
    });

    describe('reconnectReinitialize', () => {
        it('reconnect if there is a cookie', () => {
            const getCookieSpy = spyOn(service['cookieService'], 'getCookie').and.returnValue('cookie');
            const eraseCookieSpy = spyOn(service['cookieService'], 'eraseCookie');
            const handleReconnectionSpy = spyOn(service['gameController'], 'handleReconnection');
            const socketIdSpy = spyOn(service['socketService'], 'getId');

            service.reconnectGame();
            expect(getCookieSpy).toHaveBeenCalled();
            expect(socketIdSpy).toHaveBeenCalled();
            expect(eraseCookieSpy).toHaveBeenCalled();
            expect(handleReconnectionSpy).toHaveBeenCalled();
        });

        it('not reconnect if there is no cookie and emit', () => {
            const getCookieSpy = spyOn(service['cookieService'], 'getCookie').and.returnValue('');
            const handleReconnectionSpy = spyOn(service['gameController'], 'handleReconnection');

            const emitSpy = gameViewEventManagerSpy.emitGameViewEvent;
            service.reconnectGame();

            expect(getCookieSpy).toHaveBeenCalled();
            expect(emitSpy).toHaveBeenCalledWith('noActiveGame');
            expect(handleReconnectionSpy).not.toHaveBeenCalled();
        });
    });

    describe('handleGameUpdate', () => {
        let player1: AbstractPlayer;
        let player2: AbstractPlayer;

        let gameUpdateData: GameUpdateData;
        let updateTileRackEventEmitSpy: jasmine.Spy;

        beforeEach(() => {
            gameUpdateData = {};
            service['playerContainer'] = new PlayerContainer(DEFAULT_PLAYER_1.id);
            player1 = new Player(DEFAULT_PLAYER_1.id, DEFAULT_PLAYER_1.name, DEFAULT_PLAYER_1.tiles);
            player2 = new Player(DEFAULT_PLAYER_2.id, DEFAULT_PLAYER_2.name, DEFAULT_PLAYER_2.tiles);
            service['playerContainer']['players'].add(player1);
            service['playerContainer']['players'].add(player2);

            updateTileRackEventEmitSpy = gameViewEventManagerSpy.emitGameViewEvent;
        });

        it('should call updatePlayerDate and emit with player1 if defined', () => {
            const spy = spyOn(player1, 'updatePlayerData');
            gameUpdateData.player1 = DEFAULT_PLAYER_1;
            service.handleGameUpdate(gameUpdateData);
            expect(spy).toHaveBeenCalledWith(DEFAULT_PLAYER_1);
            expect(updateTileRackEventEmitSpy).toHaveBeenCalled();
        });

        it('should not call updatePlayerDate and emit with player1 if undefined', () => {
            const spy = spyOn(player1, 'updatePlayerData');
            service.handleGameUpdate(gameUpdateData);
            expect(spy).not.toHaveBeenCalledWith(DEFAULT_PLAYER_1);
            expect(updateTileRackEventEmitSpy).not.toHaveBeenCalledWith('tileRackUpdate');
        });

        it('should call updatePlayerDate and emit with player2 if defined', () => {
            const spy = spyOn(player2, 'updatePlayerData');
            gameUpdateData.player2 = DEFAULT_PLAYER_2;
            service.handleGameUpdate(gameUpdateData);
            expect(spy).toHaveBeenCalledWith(DEFAULT_PLAYER_2);
            expect(updateTileRackEventEmitSpy).toHaveBeenCalled();
        });

        it('should not call updatePlayerDate and emit with player2 if undefined', () => {
            const spy = spyOn(player2, 'updatePlayerData');
            gameUpdateData.player2 = undefined as unknown as PlayerData;
            service.handleGameUpdate(gameUpdateData);
            expect(spy).not.toHaveBeenCalledWith(DEFAULT_PLAYER_2);
            expect(updateTileRackEventEmitSpy).not.toHaveBeenCalledWith('tileRackUpdate');
        });

        it('should call updateBoard if board is defined', () => {
            gameUpdateData.board = [];
            service.handleGameUpdate(gameUpdateData);
            expect(boardServiceSpy.updateBoard).toHaveBeenCalledWith(gameUpdateData.board);
        });

        it('should not call updateBoard if board is undefined', () => {
            service.handleGameUpdate(gameUpdateData);
            expect(boardServiceSpy.updateBoard).not.toHaveBeenCalled();
        });

        it('should call convertRoundDataToRound and updateRound if round is defined', () => {
            const round: Round = { player: player1, startTime: new Date(), limitTime: new Date(), completedTime: null };
            roundManagerSpy.convertRoundDataToRound.and.returnValue(round);
            gameUpdateData.round = { playerData: DEFAULT_PLAYER_1, startTime: new Date(), limitTime: new Date(), completedTime: null };
            service.handleGameUpdate(gameUpdateData);
            expect(roundManagerSpy.convertRoundDataToRound).toHaveBeenCalled();
            expect(roundManagerSpy.updateRound).toHaveBeenCalledWith(round);
        });

        it('should not call convertRoundDataToRound and updateRound if round is defined', () => {
            const round: Round = { player: player1, startTime: new Date(), limitTime: new Date(), completedTime: null };
            roundManagerSpy.convertRoundDataToRound.and.returnValue(round);
            service.handleGameUpdate(gameUpdateData);
            expect(roundManagerSpy.convertRoundDataToRound).not.toHaveBeenCalled();
            expect(roundManagerSpy.updateRound).not.toHaveBeenCalledWith(round);
        });

        it('should update tileReserve, tileReserveTotal and emit if tileReserve and tilReserveTotal are defined', () => {
            service.tileReserve = [];

            gameUpdateData.tileReserve = [];
            service.handleGameUpdate(gameUpdateData);

            expect(service.tileReserve).toEqual(gameUpdateData.tileReserve);
        });

        it('should not update tileReserve, tileReserveTotal and emit if tileReserve or tilReserveTotal are undefined', () => {
            const originalTileReserve: TileReserveData[] = [];
            service.tileReserve = originalTileReserve;

            gameUpdateData.tileReserve = undefined;
            service.handleGameUpdate(gameUpdateData);

            expect(service.tileReserve).toEqual(originalTileReserve);
        });

        it('should call gameOver if gameOver', () => {
            const spy = spyOn(service, 'handleGameOver');
            gameUpdateData.isGameOver = true;
            service.handleGameUpdate(gameUpdateData);
            expect(spy).toHaveBeenCalled();
        });

        it('should not call gameOver if gameOver is false or undefined', () => {
            const spy = spyOn(service, 'handleGameOver');
            service.handleGameUpdate(gameUpdateData);
            expect(spy).not.toHaveBeenCalled();
        });
    });

    describe('handleNewMessage', () => {
        it('should call newMessageValue next', () => {
            const spy = gameViewEventManagerSpy.emitGameViewEvent;

            const message: Message = {} as Message;
            service.handleNewMessage(message);
            expect(spy).toHaveBeenCalledWith('newMessage', message);
        });
    });

    describe('getPlayingPlayerId', () => {
        it('should return id or round manager active player', () => {
            const expected = 'expected-id';
            roundManagerSpy.getActivePlayer.and.returnValue({ id: expected } as AbstractPlayer);
            const result = service.getPlayingPlayerId();
            expect(result).toEqual(expected);
        });
    });

    describe('isLocalPlayerPlaying', () => {
        it('should return true if is local player', () => {
            const expected = 'expected-id';
            roundManagerSpy.getActivePlayer.and.returnValue({ id: expected } as AbstractPlayer);
            service['playerContainer'] = new PlayerContainer(expected);
            const result = service.isLocalPlayerPlaying();
            expect(result).toBeTrue();
        });

        it('should return false if is not local player', () => {
            const expected = 'expected-id';
            roundManagerSpy.getActivePlayer.and.returnValue({ id: expected } as AbstractPlayer);
            service['playerContainer'] = new PlayerContainer('NOT-expected-id');
            const result = service.isLocalPlayerPlaying();
            expect(result).toBeFalse();
        });
    });

    describe('getGameId', () => {
        it('should return gameId', () => {
            const expected = 'expected-id';
            service['gameId'] = expected;
            expect(service.getGameId()).toEqual(expected);
        });
    });

    describe('gameOver', () => {
        it('should change attribute "isGameOver" to true', () => {
            service.handleGameOver();
            expect(service['isGameOver']).toEqual(true);
        });

        it('should call roundManager.resetTimerData()', () => {
            service.handleGameOver();
            expect(roundManagerSpy.resetTimerData).toHaveBeenCalled();
        });
    });

    describe('getLocalPlayer and getLocalPlayerId', () => {
        let player1: Player;
        let player2: Player;

        beforeEach(() => {
            player1 = new Player(DEFAULT_PLAYER_1.id, DEFAULT_PLAYER_1.name, DEFAULT_PLAYER_1.tiles);
            player2 = new Player(DEFAULT_PLAYER_2.id, DEFAULT_PLAYER_2.name, DEFAULT_PLAYER_2.tiles);
        });

        it('should return player 1 if is local', () => {
            service['playerContainer'] = new PlayerContainer(player1.id);
            service['playerContainer']['players'].add(player1);
            service['playerContainer']['players'].add(player2);

            const result = service.getLocalPlayer();
            expect(result).toEqual(player1);
        });

        it('should return player 2 if is local', () => {
            service['playerContainer'] = new PlayerContainer(player2.id);
            service['playerContainer']['players'].add(player1);
            service['playerContainer']['players'].add(player2);

            const result = service.getLocalPlayer();
            expect(result).toEqual(player2);
        });

        it('should return undefined if no player', () => {
            service['playerContainer'] = new PlayerContainer(undefined as unknown as string);
            service['playerContainer']['players'].add(player1);
            service['playerContainer']['players'].add(player2);

            const result = service.getLocalPlayer();
            expect(result).not.toBeDefined();
        });

        it('should return player 1 id if is local', () => {
            service['playerContainer'] = new PlayerContainer(player1.id);
            service['playerContainer']['players'].add(player1);
            service['playerContainer']['players'].add(player2);

            const result = service.getLocalPlayerId();
            expect(result).toEqual(player1.id);
        });

        it('should return player 2 id if is local', () => {
            service['playerContainer'] = new PlayerContainer(player2.id);
            service['playerContainer']['players'].add(player1);
            service['playerContainer']['players'].add(player2);

            const result = service.getLocalPlayerId();
            expect(result).toEqual(player2.id);
        });

        it('should return undefined if no player', () => {
            service['playerContainer'] = new PlayerContainer(undefined as unknown as string);
            service['playerContainer']['players'].add(player1);
            service['playerContainer']['players'].add(player2);

            const result = service.getLocalPlayerId();
            expect(result).not.toBeDefined();
        });
    });

    describe('disconnectGame', () => {
        let localPlayerSpy: jasmine.Spy;
        let cookieGameSpy: jasmine.Spy;
        let gameControllerSpy: jasmine.Spy;
        beforeEach(() => {
            service['playerContainer'] = new PlayerContainer('p1');
            service['playerContainer']['players'].add(new Player('p1', 'jean', []));
            service['playerContainer']['players'].add(new Player('p2', 'paul', []));
            localPlayerSpy = spyOn(service, 'getLocalPlayerId').and.callThrough();

            cookieGameSpy = spyOn(service['cookieService'], 'setCookie').and.callFake(() => {
                return;
            });
            gameControllerSpy = spyOn(service['gameController'], 'handleDisconnection').and.callFake(() => {
                return;
            });
        });

        it('should call getLocalPlayerId();', () => {
            service.disconnectGame();
            expect(localPlayerSpy).toHaveBeenCalled();
        });

        it('should empty gameId, playerId1, playerId2 and localPlayerId', () => {
            service.disconnectGame();
            expect(service['gameId']).toEqual('');
            expect(service['playerContainer']).toBeUndefined();
        });

        it('!localPlayerId) throw new Error(NO_LOCAL_PLAYER);', () => {
            localPlayerSpy.and.callFake(() => {
                return undefined;
            });
            expect(() => service.disconnectGame()).toThrow();
        });

        it('should call cookieService.setCookie(GAME_ID_COOKIE, gameId, TIME_TO_RECONNECT);', () => {
            service.disconnectGame();
            expect(cookieGameSpy).toHaveBeenCalledTimes(2);
        });

        it('should call gameController.handleDisconnection);', () => {
            service.disconnectGame();
            expect(gameControllerSpy).toHaveBeenCalled();
        });
    });
});
