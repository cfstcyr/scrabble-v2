import { Injectable, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { GameUpdateData, PlayerData } from '@app/classes/communication/';
import { InitializeGameData, StartGameData } from '@app/classes/communication/game-config';
import { Message } from '@app/classes/communication/message';
import { GameType } from '@app/classes/game-type';
import { IResetServiceData } from '@app/classes/i-reset-service-data';
import { AbstractPlayer } from '@app/classes/player';
import { PlayerContainer } from '@app/classes/player/player-container';
import { Round } from '@app/classes/round';
import { Square } from '@app/classes/square';
import { TileReserveData } from '@app/classes/tile/tile.types';
import { SYSTEM_ERROR_ID } from '@app/constants/game';
import { GameDispatcherController } from '@app/controllers/game-dispatcher-controller/game-dispatcher.controller';
import { GamePlayController } from '@app/controllers/game-play-controller/game-play.controller';
import BoardService from '@app/services/board/board.service';
import { GameViewEventManagerService } from '@app/services/game-view-event-manager/game-view-event-manager.service';
import RoundManagerService from '@app/services/round-manager/round-manager.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Injectable({
    providedIn: 'root',
})
export default class GameService implements OnDestroy, IResetServiceData {
    tileReserve: TileReserveData[];

    isGameSetUp: boolean;
    isGameOver: boolean;

    private gameId: string;
    private playerContainer?: PlayerContainer;
    private gameType: GameType;
    private dictionaryName: string;
    private serviceDestroyed$: Subject<boolean>;

    constructor(
        private router: Router,
        private boardService: BoardService,
        private roundManager: RoundManagerService,
        private gameDispatcherController: GameDispatcherController,
        private gameController: GamePlayController,
        private gameViewEventManagerService: GameViewEventManagerService,
    ) {
        this.serviceDestroyed$ = new Subject();
        this.gameDispatcherController.subscribeToInitializeGame(this.serviceDestroyed$, async (initializeValue: InitializeGameData | undefined) => {
            this.handleInitializeGame(initializeValue);
        });
        this.gameController.newMessageValue.pipe(takeUntil(this.serviceDestroyed$)).subscribe((newMessage) => {
            if (newMessage) this.handleNewMessage(newMessage);
        });
        this.gameController.gameUpdateValue.pipe(takeUntil(this.serviceDestroyed$)).subscribe((newData) => this.handleGameUpdate(newData));
    }

    ngOnDestroy(): void {
        this.serviceDestroyed$.next(true);
        this.serviceDestroyed$.complete();
    }

    async handleInitializeGame(initializeGameData: InitializeGameData | undefined): Promise<void> {
        if (!initializeGameData) return;
        await this.initializeGame(initializeGameData.localPlayerId, initializeGameData.startGameData);
        this.gameViewEventManagerService.emitGameViewEvent('gameInitialized', initializeGameData);
    }

    async initializeGame(localPlayerId: string, startGameData: StartGameData): Promise<void> {
        this.gameId = startGameData.gameId;
        this.playerContainer = new PlayerContainer(localPlayerId).initializePlayers(startGameData.player1, startGameData.player2);
        this.gameType = startGameData.gameType;
        this.dictionaryName = startGameData.dictionary;
        this.tileReserve = startGameData.tileReserve;

        this.roundManager.initialize(localPlayerId, startGameData);
        this.boardService.initializeBoard(startGameData.board);

        this.isGameSetUp = true;
        this.isGameOver = false;

        await this.handleReRouteOrReconnect(startGameData);
    }

    async handleReRouteOrReconnect(startGameData: StartGameData): Promise<void> {
        if (this.router.url !== '/game') {
            this.roundManager.initializeEvents();
            this.roundManager.startRound();
            await this.router.navigateByUrl('game');
        } else {
            this.reconnectReinitialize(startGameData);
        }
    }

    handleGameUpdate(gameUpdateData: GameUpdateData): void {
        if (gameUpdateData.player1) {
            this.handleUpdatePlayerData(gameUpdateData.player1);
        }
        if (gameUpdateData.player2) {
            this.handleUpdatePlayerData(gameUpdateData.player2);
        }
        if (gameUpdateData.board) {
            this.boardService.updateBoard(gameUpdateData.board);
        }
        if (gameUpdateData.round) {
            const round: Round = this.roundManager.convertRoundDataToRound(gameUpdateData.round);
            this.roundManager.updateRound(round);
        }
        if (gameUpdateData.tileReserve) {
            this.handleTileReserveUpdate(gameUpdateData.tileReserve);
        }
        if (gameUpdateData.isGameOver) {
            this.handleGameOver();
        }
    }

    handleUpdatePlayerData(playerData: PlayerData): void {
        if (this.playerContainer) {
            this.playerContainer.updatePlayersData(playerData);
        }
        this.gameViewEventManagerService.emitGameViewEvent('tileRackUpdate');
    }

    handleTileReserveUpdate(tileReserve: TileReserveData[]): void {
        this.tileReserve = [...tileReserve];
    }

    handleNewMessage(newMessage: Message): void {
        this.gameViewEventManagerService.emitGameViewEvent('newMessage', newMessage);
        if (newMessage.senderId === SYSTEM_ERROR_ID) this.gameViewEventManagerService.emitGameViewEvent('usedTiles', undefined);
    }

    getPlayingPlayerId(): string {
        return this.roundManager.getActivePlayer().id;
    }

    isLocalPlayerPlaying(): boolean {
        if (!this.playerContainer) return false;
        return this.getPlayingPlayerId() === this.playerContainer.getLocalPlayerId();
    }

    getGameId(): string {
        return this.gameId;
    }

    resetGameId(): void {
        this.gameId = '';
    }

    getPlayerByNumber(playerNumber: number): AbstractPlayer | undefined {
        if (!this.playerContainer) return undefined;
        return this.playerContainer.getPlayer(playerNumber);
    }

    getLocalPlayer(): AbstractPlayer | undefined {
        if (!this.playerContainer) return undefined;
        return this.playerContainer.getLocalPlayer();
    }

    getLocalPlayerId(): string | undefined {
        if (!this.playerContainer) return undefined;
        return this.playerContainer.getLocalPlayerId();
    }

    getTotalNumberOfTilesLeft(): number {
        if (!this.tileReserve) return 0;
        return this.tileReserve.reduce((prev, { amount }) => prev + amount, 0);
    }

    handleGameOver(): void {
        this.isGameOver = true;
        this.roundManager.resetTimerData();
    }

    resetServiceData(): void {
        this.gameType = undefined as unknown as GameType;
        this.dictionaryName = '';
        this.tileReserve = [];
        this.isGameOver = false;
        this.gameId = '';
        this.playerContainer = undefined;
    }

    private reconnectReinitialize(startGameData: StartGameData): void {
        if (this.playerContainer) {
            this.playerContainer.updatePlayersData(startGameData.player1, startGameData.player2);
        }
        this.gameViewEventManagerService.emitGameViewEvent('reRender');
        this.gameViewEventManagerService.emitGameViewEvent('tileRackUpdate');
        this.boardService.updateBoard(([] as Square[]).concat(...startGameData.board));
        this.roundManager.continueRound(this.roundManager.currentRound);
    }
}
