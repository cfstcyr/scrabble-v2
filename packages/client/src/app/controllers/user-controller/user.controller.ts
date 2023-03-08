import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AbstractController } from '@app/controllers/abstract-controller';
import { Observable } from 'rxjs';
import { PublicUserStatistics } from '@common/models/user-statistics';
import { GameHistoryForUser } from '@common/models/game-history';
import { PublicServerAction } from '@common/models/server-action';

@Injectable({
    providedIn: 'root',
})
export class UserController extends AbstractController {
    constructor(private readonly http: HttpClient) {
        super('/');
    }

    getUserStatistics(): Observable<PublicUserStatistics> {
        return this.http.get<PublicUserStatistics>(this.url('/users/statistics'));
    }

    getGameHistory(): Observable<GameHistoryForUser[]> {
        return this.http.get<GameHistoryForUser[]>(this.url('/gameHistories'));
    }

    getServerActions(): Observable<PublicServerAction[]> {
        return this.http.get<PublicServerAction[]>(this.url('/server-actions'));
    }
}
