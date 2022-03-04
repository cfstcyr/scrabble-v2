import Player from '@app/classes/player/player';
import { PointRange, WordFindingRequest } from '@app/classes/word-finding';
import { WordFindingService } from '@app/services/word-finding/word-finding';
import { ActiveGameService } from '@app/services/active-game-service/active-game.service';
import { Router } from 'express';

export abstract class AbstractVirtualPlayer extends Player {
    gameId: string;
    pointHistoric = new Map<number, number>();
    router: Router;

    private wordFindingService: WordFindingService;
    private activeGameService: ActiveGameService;
    constructor(gameId: string, id: string, name: string) {
        super(id, name);
        this.gameId = gameId;
    }

    getWordFindingService(): WordFindingService {
        return this.wordFindingService;
    }

    getActiveGameService(): ActiveGameService {
        return this.activeGameService;
    }

    playTurn(): void {
        this.findAction();
    }

    sendPayload() {
        // API call
        return;
    }

    generateWordFindingRequest(): WordFindingRequest {
        return {
            pointRange: this.findPointRange(),
            numberOfWordsToFind: 1,
            pointHistoric: this.pointHistoric,
        };
    }

    abstract findPointRange(): PointRange;

    abstract findAction(): void;
}
