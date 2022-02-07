/* eslint-disable no-console */
import { HttpClient } from '@angular/common/http';
import { EventEmitter, Injectable } from '@angular/core';
import { GameConfigData, StartMultiplayerGameData } from '@app/classes/communication/game-config';
import { LobbyInfo } from '@app/classes/communication/lobby-info';
import { PlayerName } from '@app/classes/communication/player-name';
import { SocketController } from '@app/controllers/socket-controller/socket-client.controller';
import { GameService } from '@app/services';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class GameDispatcherController extends SocketController {
    createGameEvent: EventEmitter<string> = new EventEmitter();
    joinRequestEvent: EventEmitter<string> = new EventEmitter();
    canceledGameEvent: EventEmitter<string> = new EventEmitter();
    leaveLobbyEvent: EventEmitter<string> = new EventEmitter();
    lobbyFullEvent: EventEmitter<string> = new EventEmitter();
    lobbiesUpdateEvent: EventEmitter<LobbyInfo[]> = new EventEmitter();

    constructor(private http: HttpClient, private gameService: GameService) {
        super();
        this.connect();
        this.configureSocket();
    }

    configureSocket(): void {
        this.on('joinRequest', (opponent: PlayerName[]) => {
            this.joinRequestEvent.emit(opponent[0].name);
        });
        this.on('startGame', (startGameData: StartMultiplayerGameData[]) =>
            this.gameService.initializeMultiplayerGame(this.getId(), startGameData[0]),
        );
        this.on('lobbiesUpdate', (lobbies: LobbyInfo[][]) => {
            this.lobbiesUpdateEvent.emit(lobbies[0]);
        });
        this.on('lobbyFull', (opponent: PlayerName[]) => this.lobbyFullEvent.emit(opponent[0].name));
        this.on('canceledGame', (opponent: PlayerName[]) => this.canceledGameEvent.emit(opponent[0].name));
        this.on('joinerLeaveGame', (opponent: PlayerName[]) => {
            console.log('joinerLeaveGameCLIENT');
            console.log(opponent);
            this.leaveLobbyEvent.emit(opponent[0].name);
        });
    }

    handleMultiplayerGameCreation(gameConfig: GameConfigData): void {
        const endpoint = `${environment.serverUrl}/games/${this.getId()}`;
        this.http.post<{ gameId: string }>(endpoint, gameConfig).subscribe((response) => {
            this.createGameEvent.emit(response.gameId);
        });
    }

    handleConfirmationGameCreation(opponentName: string, gameId: string): void {
        console.log(opponentName);
        const endpoint = `${environment.serverUrl}/games/${gameId}/player/${this.getId()}/accept`;
        this.http.post(endpoint, { opponentName }).subscribe();
    }

    handleRejectionGameCreation(opponentName: string, gameId: string): void {
        const endpoint = `${environment.serverUrl}/games/${gameId}/player/${this.getId()}/reject`;
        this.http.post(endpoint, { opponentName }).subscribe();
    }

    handleCancelGame(gameId: string): void {
        const endpoint = `${environment.serverUrl}/games/${gameId}/player/${this.getId()}/cancel`;
        this.http.delete(endpoint).subscribe();
    }

    handleLeaveLobby(gameId: string): void {
        const endpoint = `${environment.serverUrl}/games/${gameId}/player/${this.getId()}/leave`;
        // patch?
        this.http.delete(endpoint).subscribe();
    }

    handleLobbiesListRequest(): void {
        const endpoint = `${environment.serverUrl}/games/${this.getId()}`;
        this.http.get(endpoint).subscribe();
    }

    handleLobbyJoinRequest(gameId: string, playerName: string): void {
        const endpoint = `${environment.serverUrl}/games/${gameId}/player/${this.getId()}/join`;
        this.http.post(endpoint, { playerName }).subscribe();
    }
}
