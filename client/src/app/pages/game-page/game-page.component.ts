import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DefaultDialogComponent } from '@app/components/default-dialog/default-dialog.component';

@Component({
    selector: 'app-game-page',
    templateUrl: './game-page.component.html',
    styleUrls: ['./game-page.component.scss'],
})
export class GamePageComponent {
    constructor(public surrenderDialog: MatDialog) {}
    openDialog() {
        this.surrenderDialog.open(DefaultDialogComponent, {
            data: {
                title: 'Abandonner la partie',
                content: 'Voulez-vous vraiment ABANDONNER?',
                buttons: [
                    {
                        content: 'Abandonner la partie',
                        redirect: '/home',
                        style: 'background-color: #FA6B84; color: rgb(0, 0, 0)',
                    },
                    {
                        content: 'Continuer la partie',
                        closeDialog: true,
                        style: 'background-color: rgb(231, 231, 231)',
                    },
                ],
            },
        });
    }
}
