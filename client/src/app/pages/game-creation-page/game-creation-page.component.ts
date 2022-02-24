import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { GameMode } from '@app/classes/game-mode';
import { GameType } from '@app/classes/game-type';
import { VirtualPlayerLevel } from '@app/classes/player/virtual-player-level';
import { NameFieldComponent } from '@app/components/name-field/name-field.component';
import { DEFAULT_TIMER_VALUE } from '@app/constants/pages-constants';
import { GameDispatcherService } from '@app/services';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-game-creation-page',
    templateUrl: './game-creation-page.component.html',
    styleUrls: ['./game-creation-page.component.scss'],
})
export class GameCreationPageComponent implements OnInit, OnDestroy {
    @ViewChild(NameFieldComponent) child: NameFieldComponent;
    gameTypes = GameType;
    gameModes = GameMode;
    virtualPlayerLevels = VirtualPlayerLevel;
    // TODO : when dictionnaries and timers options are implemented, create mat-options with ngFor on the available lists
    dictionaryOptions: string[];
    serviceDestroyed$: Subject<boolean> = new Subject();

    gameParameters: FormGroup = new FormGroup({
        gameType: new FormControl(GameType.Classic, Validators.required),
        gameMode: new FormControl(GameMode.Multiplayer, Validators.required),
        level: new FormControl(VirtualPlayerLevel.Beginner, Validators.required),
        timer: new FormControl(DEFAULT_TIMER_VALUE, Validators.required),
        dictionary: new FormControl('', Validators.required),
    });

    constructor(private router: Router, private gameDispatcherService: GameDispatcherService) {}

    ngOnInit(): void {
        this.gameParameters
            .get('gameMode')
            ?.valueChanges.pipe(takeUntil(this.serviceDestroyed$))
            .subscribe((value) => {
                if (value === this.gameModes.Solo) {
                    this.gameParameters?.get('level')?.setValidators([Validators.required]);
                } else {
                    this.gameParameters?.get('level')?.clearValidators();
                }
                this.gameParameters?.get('level')?.updateValueAndValidity();
            });
    }

    ngOnDestroy(): void {
        this.serviceDestroyed$.next(true);
        this.serviceDestroyed$.complete();
    }

    isFormValid(): boolean {
        return this.gameParameters?.valid && this.child.formParameters?.valid;
    }

    onSubmit(): void {
        if (this.isFormValid()) {
            this.createGame();
        } else {
            this.child.formParameters.markAllAsTouched();
        }
    }

    createGame(): void {
        this.router.navigateByUrl('waiting-room');
        this.gameDispatcherService.handleCreateGame(this.child.playerName, this.gameParameters);
    }
}
