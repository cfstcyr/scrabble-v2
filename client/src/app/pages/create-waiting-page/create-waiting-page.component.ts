import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { OnlinePlayer } from '@app/classes/player';
import { DefaultDialogComponent } from '@app/components/default-dialog/default-dialog.component';
import { GameDispatcherService } from '@app/services/game-dispatcher/game-dispatcher.service';
import { Subscription } from 'rxjs';
import {
    DIALOG_BUTTON_CONTENT,
    DIALOG_CONTENT,
    DIALOG_TITLE,
    HOST_WAITING_MESSAGE,
    OPPONENT_FOUND_MESSAGE,
} from './create-waiting-page.component.const';

@Component({
    selector: 'app-create-waiting-page',
    templateUrl: './create-waiting-page.component.html',
    styleUrls: ['./create-waiting-page.component.scss'],
})
export class CreateWaitingPageComponent implements OnInit, OnDestroy {
    @Input() opponent: string | undefined;
    @ViewChild(MatProgressSpinner, { static: false }) spinnerOpponentFound: MatProgressSpinner;

    joinRequestSubscription: Subscription;
    joinerLeaveGameSubscription: Subscription;

    host: OnlinePlayer;
    waitingRoomMessage: string = HOST_WAITING_MESSAGE;
    isOpponentFound: boolean;
    constructor(public dialog: MatDialog, public gameDispatcherService: GameDispatcherService) {}

    ngOnInit() {
        if (!this.gameDispatcherService.joinRequestEvent) return;
        this.joinRequestSubscription = this.gameDispatcherService.joinRequestEvent.subscribe((opponentName: string) =>
            this.setOpponent(opponentName),
        );

        if (!this.gameDispatcherService.joinerLeaveGameEvent) return;
        this.joinerLeaveGameSubscription = this.gameDispatcherService.joinerLeaveGameEvent.subscribe((leaverName: string) =>
            this.rejectOpponent(leaverName),
        );
    }

    ngOnDestroy() {
        if (this.joinRequestSubscription) {
            this.joinRequestSubscription.unsubscribe();
        }
        if (this.joinerLeaveGameSubscription) {
            this.joinerLeaveGameSubscription.unsubscribe();
        }
    }

    setOpponent(opponent: string) {
        this.opponent = opponent;
        this.waitingRoomMessage = this.opponent + OPPONENT_FOUND_MESSAGE;
        this.isOpponentFound = true;
    }

    disconnectOpponent() {
        if (this.opponent) {
            this.opponent = undefined;
            this.waitingRoomMessage = HOST_WAITING_MESSAGE;
            this.isOpponentFound = false;
        }
    }

    rejectOpponent(leaverName: string) {
        this.warnHostOpponentLeft(leaverName);
        this.opponent = undefined;
        this.waitingRoomMessage = HOST_WAITING_MESSAGE;
        this.isOpponentFound = false;
    }

    cancelGame() {
        this.gameDispatcherService.handleCancelGame();
    }

    warnHostOpponentLeft(opponentName: string) {
        this.dialog.open(DefaultDialogComponent, {
            data: {
                // Data type is DefaultDialogParameters
                title: DIALOG_TITLE,
                content: opponentName + DIALOG_CONTENT,
                buttons: [
                    {
                        content: DIALOG_BUTTON_CONTENT,
                        closeDialog: true,
                    },
                ],
            },
        });
    }

    confirmOpponentToServer() {
        if (this.opponent) {
            this.gameDispatcherService.handleConfirmation(this.opponent);
        }
    }

    confirmRejectionToServer() {
        if (this.opponent) {
            this.gameDispatcherService.handleRejection(this.opponent);
        }
        this.disconnectOpponent();
    }
}
