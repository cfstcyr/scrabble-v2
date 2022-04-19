import { Injectable, OnDestroy } from '@angular/core';
import SocketService from '@app/services/socket-service/socket.service';
import { BehaviorSubject, Observable, Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DatabaseService } from '@app/services/database-service/database.service';
import { ConnectionState } from '@app/classes/connection-state-service/connection-state';

export enum InitializeState {
    Loading = "Chargement de l'application",
    Ready = "L'application est prête",
    ServerNotReachable = "Impossible d'établir une connexion avec serveur",
    DatabaseNotReachable = "Impossible d'établir une connexion avec la base de donné",
}

export const DEFAULT_STATE_VALUE: InitializeState = InitializeState.Loading;

@Injectable({
    providedIn: 'root',
})
export class InitializerService implements OnDestroy {
    private state$: BehaviorSubject<InitializeState>;
    private destroyed$: Subject<boolean>;

    constructor(private readonly socketService: SocketService, private readonly databaseService: DatabaseService) {
        this.state$ = new BehaviorSubject(DEFAULT_STATE_VALUE);
        this.destroyed$ = new Subject();

        this.socketService.subscribe(this.destroyed$, (state) => this.handleSocketUpdate(state));
        this.databaseService.subscribe(this.destroyed$, (state) => this.handleDatabaseUpdate(state));
    }

    ngOnDestroy(): void {
        this.destroyed$.next(true);
        this.destroyed$.complete();
    }

    initialize() {
        this.socketService.initializeService();
    }

    subscribe(destroy$: Observable<boolean>, next: (state: InitializeState) => void): Subscription {
        return this.state$.pipe(takeUntil(destroy$)).subscribe(next);
    }

    private isStateError(): boolean {
        return [InitializeState.DatabaseNotReachable, InitializeState.ServerNotReachable].includes(this.state$.value);
    }

    private handleSocketUpdate(state: ConnectionState) {
        switch (state) {
            case ConnectionState.Connected:
                if (this.state$.value !== InitializeState.Ready) {
                    this.state$.next(InitializeState.Loading);
                    this.databaseService.checkDatabase();
                }
                break;
            case ConnectionState.Error:
                this.state$.next(InitializeState.ServerNotReachable);
                break;
        }
    }

    private handleDatabaseUpdate(state: ConnectionState) {
        switch (state) {
            case ConnectionState.Connected:
                if (this.canSwitchToReadyFromDatabaseUpdate()) this.state$.next(InitializeState.Ready);
                break;
            case ConnectionState.Error:
                if (!this.isStateError()) this.state$.next(InitializeState.DatabaseNotReachable);
                break;
        }
    }

    private canSwitchToReadyFromDatabaseUpdate(): boolean {
        return this.state$.value !== InitializeState.Ready && this.state$.value !== InitializeState.ServerNotReachable;
    }
}
