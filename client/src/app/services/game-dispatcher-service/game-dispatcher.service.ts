import { Injectable, OnDestroy } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { LobbyData, LobbyInfo } from '@app/classes/communication/';
import { GameConfigData } from '@app/classes/communication/game-config';
import { GameMode } from '@app/classes/game-mode';
import { GameType } from '@app/classes/game-type';
import { VirtualPlayerLevel } from '@app/classes/player/virtual-player-level';
import { GameDispatcherController } from '@app/controllers/game-dispatcher-controller/game-dispatcher.controller';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Injectable({
    providedIn: 'root',
})
export default class GameDispatcherService implements OnDestroy {
    currentName: string = '';
    currentLobby: LobbyInfo | undefined = undefined;

    private joinRequestEvent: Subject<string> = new Subject();
    private canceledGameEvent: Subject<string> = new Subject();
    private lobbyFullEvent: Subject<void> = new Subject();
    private lobbiesUpdateEvent: Subject<LobbyInfo[]> = new Subject();
    private joinerRejectedEvent: Subject<string> = new Subject();
    private serviceDestroyed$: Subject<boolean> = new Subject();

    constructor(private gameDispatcherController: GameDispatcherController, public router: Router) {
        this.gameDispatcherController.subscribeToJoinRequestEvent(this.serviceDestroyed$, (opponentName: string) =>
            this.handleJoinRequest(opponentName),
        );
        this.gameDispatcherController.subscribeToLobbyFullEvent(this.serviceDestroyed$, () => this.handleLobbyFull());
        this.gameDispatcherController.subscribeToLobbyRequestValidEvent(this.serviceDestroyed$, async () =>
            this.router.navigateByUrl('join-waiting-room'),
        );
        this.gameDispatcherController.subscribeToCanceledGameEvent(this.serviceDestroyed$, (hostName: string) => this.handleCanceledGame(hostName));
        this.gameDispatcherController.subscribeToJoinerRejectedEvent(this.serviceDestroyed$, (hostName: string) =>
            this.handleJoinerRejected(hostName),
        );
        this.gameDispatcherController.subscribeToLobbiesUpdateEvent(this.serviceDestroyed$, (lobbies: LobbyInfo[]) =>
            this.handleLobbiesUpdate(lobbies),
        );
        this.gameDispatcherController.subscribeToCreateGameEvent(this.serviceDestroyed$, (lobbyData: LobbyData) => {
            this.currentLobby = lobbyData;
        });
    }

    getCurrentLobbyId(): string {
        if (!this.currentLobby) return '';
        return this.currentLobby.lobbyId;
    }

    ngOnDestroy(): void {
        this.serviceDestroyed$.next(true);
        this.serviceDestroyed$.complete();
    }

    resetServiceData(): void {
        this.currentLobby = undefined;
        this.currentName = '';
    }

    handleJoinLobby(lobby: LobbyInfo, playerName: string): void {
        this.currentLobby = lobby;
        this.currentName = playerName;
        this.gameDispatcherController.handleLobbyJoinRequest(this.getCurrentLobbyId(), playerName);
    }

    handleLobbyListRequest(): void {
        this.gameDispatcherController.handleLobbiesListRequest();
    }

    handleCreateGame(playerName: string, gameParameters: FormGroup): void {
        const gameMode: GameMode = gameParameters.get('gameMode')?.value as GameMode;
        const gameConfig: GameConfigData = {
            playerName,
            playerId: this.gameDispatcherController.socketService.getId(),
            gameType: gameParameters.get('gameType')?.value as GameType,
            gameMode,
            maxRoundTime: gameParameters.get('timer')?.value as number,
            dictionary: gameParameters.get('dictionary')?.value as string,
        };
        if (gameMode === GameMode.Solo) {
            gameConfig.virtualPlayerName = gameParameters.get('virtualPlayerName')?.value as string;
            gameConfig.virtualPlayerLevel = gameParameters.get('level')?.value as VirtualPlayerLevel;
        }
        this.gameDispatcherController.handleGameCreation(gameConfig);
    }

    handleRecreateGame(gameParameters?: FormGroup): void {
        if (!this.currentLobby) return;

        const gameConfig: GameConfigData = {
            playerName: this.currentLobby?.hostName,
            playerId: this.gameDispatcherController.socketService.getId(),
            gameType: this.currentLobby?.gameType,
            gameMode: gameParameters ? GameMode.Solo : GameMode.Multiplayer,
            maxRoundTime: this.currentLobby?.maxRoundTime,
            dictionary: this.currentLobby?.dictionary,
        };
        if (gameParameters) {
            gameConfig.virtualPlayerName = gameParameters.get('virtualPlayerName')?.value as string;
            gameConfig.virtualPlayerLevel = gameParameters.get('level')?.value as VirtualPlayerLevel;
        }
        this.gameDispatcherController.handleGameCreation(gameConfig);
    }

    handleCancelGame(mustResetData: boolean = true): void {
        if (this.getCurrentLobbyId()) this.gameDispatcherController.handleCancelGame(this.getCurrentLobbyId());
        if (mustResetData) this.resetServiceData();
    }

    handleConfirmation(opponentName: string): void {
        if (this.getCurrentLobbyId()) this.gameDispatcherController.handleConfirmationGameCreation(opponentName, this.getCurrentLobbyId());
    }

    handleRejection(opponentName: string): void {
        if (this.getCurrentLobbyId()) this.gameDispatcherController.handleRejectionGameCreation(opponentName, this.getCurrentLobbyId());
    }

    handleJoinRequest(opponentName: string): void {
        this.joinRequestEvent.next(opponentName);
    }

    handleJoinerRejected(hostName: string): void {
        this.joinerRejectedEvent.next(hostName);
        this.resetServiceData();
    }

    handleLobbiesUpdate(lobbies: LobbyInfo[]): void {
        this.lobbiesUpdateEvent.next(lobbies);
    }

    handleLobbyFull(): void {
        this.lobbyFullEvent.next();
        this.resetServiceData();
    }

    handleCanceledGame(hostName: string): void {
        this.canceledGameEvent.next(hostName);
        this.resetServiceData();
    }

    subscribeToJoinRequestEvent(componentDestroyed$: Subject<boolean>, callback: (opponentName: string) => void): void {
        this.joinRequestEvent.pipe(takeUntil(componentDestroyed$)).subscribe(callback);
    }

    subscribeToCanceledGameEvent(componentDestroyed$: Subject<boolean>, callback: (hostName: string) => void): void {
        this.canceledGameEvent.pipe(takeUntil(componentDestroyed$)).subscribe(callback);
    }

    subscribeToLobbyFullEvent(componentDestroyed$: Subject<boolean>, callback: () => void): void {
        this.lobbyFullEvent.pipe(takeUntil(componentDestroyed$)).subscribe(callback);
    }

    subscribeToLobbiesUpdateEvent(componentDestroyed$: Subject<boolean>, callback: (lobbies: LobbyInfo[]) => void): void {
        this.lobbiesUpdateEvent.pipe(takeUntil(componentDestroyed$)).subscribe(callback);
    }

    subscribeToJoinerRejectedEvent(componentDestroyed$: Subject<boolean>, callback: (hostName: string) => void): void {
        this.joinerRejectedEvent.pipe(takeUntil(componentDestroyed$)).subscribe(callback);
    }
}
