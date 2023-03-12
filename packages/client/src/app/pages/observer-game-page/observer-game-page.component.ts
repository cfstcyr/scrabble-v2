import { Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { BoardComponent } from '@app/components/board/board.component';
import { DefaultDialogComponent } from '@app/components/default-dialog/default-dialog.component';
import { TileRackComponent } from '@app/components/tile-rack/tile-rack.component';
import {
    DIALOG_END_OF_GAME_CLOSE_BUTTON,
    DIALOG_END_OF_GAME_OBSERVER_CONTENT,
    DIALOG_END_OF_GAME_OBSERVER_TITLE,
    DIALOG_NO_ACTIVE_GAME_BUTTON,
    DIALOG_NO_ACTIVE_GAME_CONTENT,
    DIALOG_NO_ACTIVE_GAME_TITLE,
    DIALOG_QUIT_BUTTON_CONFIRM,
    DIALOG_QUIT_CONTENT,
    DIALOG_QUIT_STAY,
    DIALOG_QUIT_TITLE,
} from '@app/constants/pages-constants';
import { ROUTE_HOME } from '@app/constants/routes-constants';
import { GameService } from '@app/services';
import { GameViewEventManagerService } from '@app/services/game-view-event-manager-service/game-view-event-manager.service';
import { ReconnectionService } from '@app/services/reconnection-service/reconnection.service';
import { Subject } from 'rxjs';

@Component({
    selector: 'app-observer-game-page',
    templateUrl: './observer-game-page.component.html',
    styleUrls: ['./observer-game-page.component.scss'],
})
export class ObserverGamePageComponent implements OnInit, OnDestroy {
    @ViewChild(BoardComponent, { static: false }) boardComponent: BoardComponent;
    @ViewChild(TileRackComponent, { static: false }) tileRackComponent: TileRackComponent;

    private mustDisconnectGameOnLeave: boolean;
    private componentDestroyed$: Subject<boolean>;

    constructor(
        public dialog: MatDialog,
        public gameService: GameService,
        private readonly reconnectionService: ReconnectionService,
        public surrenderDialog: MatDialog,
        private gameViewEventManagerService: GameViewEventManagerService,
    ) {
        this.mustDisconnectGameOnLeave = true;
        this.componentDestroyed$ = new Subject();
    }

    @HostListener('window:beforeunload')
    ngOnDestroy(): void {
        if (this.mustDisconnectGameOnLeave) {
            this.reconnectionService.disconnectGame(false);
        }
        this.componentDestroyed$.next(true);
        this.componentDestroyed$.complete();
    }

    ngOnInit(): void {
        this.gameViewEventManagerService.subscribeToGameViewEvent('noActiveGame', this.componentDestroyed$, () => this.noActiveGameDialog());
        this.gameViewEventManagerService.subscribeToGameViewEvent('endOfGame', this.componentDestroyed$, (winnerNames: string[]) =>
            this.endOfGameDialog(winnerNames),
        );
        if (!this.gameService.getGameId()) {
            this.reconnectionService.reconnectGame();
        }
    }

    quitButtonClicked(): void {
        const title = DIALOG_QUIT_TITLE;
        const content = DIALOG_QUIT_CONTENT;
        const buttonsContent = [DIALOG_QUIT_BUTTON_CONFIRM, DIALOG_QUIT_STAY];
        this.openDialog(title, content, buttonsContent);
    }

    changeObservingPlayer(playerNumber: number): void {
        this.gameService.setLocalPlayer(playerNumber);
    }

    private openDialog(title: string, content: string, buttonsContent: string[]): void {
        this.dialog.open(DefaultDialogComponent, {
            data: {
                title,
                content,
                buttons: [
                    {
                        content: buttonsContent[0],
                        redirect: ROUTE_HOME,
                        style: 'background-color: #FA6B84; color: rgb(0, 0, 0)',
                        // We haven't been able to test that the right function is called because this
                        // arrow function creates a new instance of the function. We cannot spy on it.
                        // It totally works tho, try it!
                        action: () => this.handlePlayerLeaves(),
                    },
                    {
                        content: buttonsContent[1],
                        closeDialog: true,
                        style: 'background-color: rgb(231, 231, 231)',
                    },
                ],
            },
        });
    }

    private noActiveGameDialog(): void {
        this.dialog.open(DefaultDialogComponent, {
            data: {
                title: DIALOG_NO_ACTIVE_GAME_TITLE,
                content: DIALOG_NO_ACTIVE_GAME_CONTENT,
                buttons: [
                    {
                        content: DIALOG_NO_ACTIVE_GAME_BUTTON,
                        closeDialog: false,
                        redirect: ROUTE_HOME,
                        style: 'background-color: rgb(231, 231, 231)',
                        // We haven't been able to test that the right function is called because this
                        // arrow function creates a new instance of the function. We cannot spy on it.
                        // It totally works tho, try it!
                        action: () => (this.mustDisconnectGameOnLeave = false),
                    },
                ],
            },
        });
    }

    private endOfGameDialog(winnerNames: string[]): void {
        this.dialog.open(DefaultDialogComponent, {
            data: {
                title: DIALOG_END_OF_GAME_OBSERVER_TITLE,
                content: DIALOG_END_OF_GAME_OBSERVER_CONTENT(winnerNames),
                buttons: [
                    {
                        content: DIALOG_QUIT_BUTTON_CONFIRM,
                        redirect: ROUTE_HOME,
                        style: 'background-color: rgb(231, 231, 231)',
                        // We haven't been able to test that the right function is called because this
                        // arrow function creates a new instance of the function. We cannot spy on it.
                        // It totally works tho, try it!
                        action: () => this.handlePlayerLeaves(),
                    },
                    {
                        content: DIALOG_END_OF_GAME_CLOSE_BUTTON,
                        closeDialog: true,
                        style: 'background-color: rgb(231, 231, 231)',
                    },
                ],
            },
        });
    }

    private handlePlayerLeaves(): void {
        this.mustDisconnectGameOnLeave = false;
    }
}
