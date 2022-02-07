import { EventEmitter, Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { GameConfigData } from '@app/classes/communication/game-config';
import { LobbyInfo } from '@app/classes/communication/lobby-info';
import { GameType } from '@app/classes/game-type';
import { GameDispatcherController } from '@app/controllers/game-dispatcher-controller/game-dispatcher.controller';
import { Subscription } from 'rxjs';
import { UNDEFINED_GAME_ID } from './game-dispatcher-errors';
// import 'mock-fs';

@Injectable({
    providedIn: 'root',
})
export class GameDispatcherService {
    gameId: string | undefined;
    joinRequestEvent: EventEmitter<string> = new EventEmitter();
    lobbiesUpdateEvent: EventEmitter<LobbyInfo[]> = new EventEmitter();
    lobbyFullEvent: EventEmitter<string> = new EventEmitter();
    canceledGameEvent: EventEmitter<string> = new EventEmitter();
    joinerLeaveGameEvent: EventEmitter<string> = new EventEmitter();

    createGameSubscription: Subscription;
    joinRequestSubscription: Subscription;
    lobbiesUpdateSubscription: Subscription;
    lobbyFullSubscription: Subscription;
    canceledGameSubscription: Subscription;
    joinerLeaveGameSubscription: Subscription;

    constructor(private gameDispatcherController: GameDispatcherController) {
        this.createGameSubscription = this.gameDispatcherController.createGameEvent.subscribe((gameId: string) => {
            this.gameId = gameId;
        });
        this.joinRequestSubscription = this.gameDispatcherController.joinRequestEvent.subscribe((opponentName: string) =>
            this.handleJoinRequest(opponentName),
        );
        this.lobbyFullSubscription = this.gameDispatcherController.lobbyFullEvent.subscribe((opponentName: string) =>
            this.handleLobbyFull(opponentName),
        );
        this.canceledGameSubscription = this.gameDispatcherController.canceledGameEvent.subscribe((hostName: string) =>
            this.handleCanceledGame(hostName),
        );
        this.joinerLeaveGameSubscription = this.gameDispatcherController.canceledGameEvent.subscribe((leaverName: string) =>
            this.handleJoinerLeaveGame(leaverName),
        );
        this.lobbiesUpdateSubscription = this.gameDispatcherController.lobbiesUpdateEvent.subscribe((lobbies: LobbyInfo[]) =>
            this.handleLobbiesUpdate(lobbies),
        );
    }

    handleCreateGame(playerName: string, gameParameters: FormGroup) {
        const gameConfig: GameConfigData = {
            playerName,
            playerId: this.gameDispatcherController.getId(),
            gameType: gameParameters.get('gameType')?.value as GameType,
            maxRoundTime: gameParameters.get('timer')?.value as number,
            dictionary: gameParameters.get('dict')?.value as string,
        };
        this.gameDispatcherController.handleMultiplayerGameCreation(gameConfig);
    }

    handleJoinRequest(opponentName: string) {
        this.joinRequestEvent.emit(opponentName);
    }

    handleCancelGame() {
        if (this.gameId) this.gameDispatcherController.handleCancelGame(this.gameId);
        else throw new Error(UNDEFINED_GAME_ID);
        this.gameId = undefined;
    }

    handleConfirmation(opponentName: string) {
        if (this.gameId) this.gameDispatcherController.handleConfirmationGameCreation(opponentName, this.gameId);
        else throw new Error(UNDEFINED_GAME_ID);
    }

    handleRejection(opponentName: string) {
        if (this.gameId) this.gameDispatcherController.handleRejectionGameCreation(opponentName, this.gameId);
        else throw new Error(UNDEFINED_GAME_ID);
        this.gameId = undefined;
    }

    handleLobbiesUpdate(lobbies: LobbyInfo[]) {
        this.lobbiesUpdateEvent.emit(lobbies);
    }

    handleLobbyFull(opponentName: string) {
        this.lobbyFullEvent.emit(opponentName);
        this.gameId = undefined;
    }

    handleCanceledGame(hostName: string) {
        this.canceledGameEvent.emit(hostName);
        this.gameId = undefined;
    }

    handleJoinerLeaveGame(leaverName: string) {
        this.joinerLeaveGameEvent.emit(leaverName);
    }

    handleJoinLobby(gameId: string, playerName: string) {
        this.gameId = gameId;
        this.gameDispatcherController.handleLobbyJoinRequest(gameId, playerName);
    }

    handleLobbyListRequest() {
        this.gameDispatcherController.handleLobbiesListRequest();
    }

    handleLeaveLobby() {
        // TODO: To fix: this.gameId is undefined because never set (only set when you create the game.)
        // we need it to know which game he is in to notify Host.
        if (this.gameId) this.gameDispatcherController.handleLeaveLobby(this.gameId);
        else throw new Error(UNDEFINED_GAME_ID);
        this.gameId = undefined;
    }
}
