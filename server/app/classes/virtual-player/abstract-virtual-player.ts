import Player from '@app/classes/player/player';
import {
    FINAL_WAIT_TIME,
    MINIMUM_EXCHANGE_WORD_COUNT,
    PRELIMINARY_WAIT_TIME,
    VIRTUAL_PLAYER_ID_PREFIX,
} from '@app/constants/virtual-player-constants';
import { ActiveGameService } from '@app/services/active-game-service/active-game.service';
import WordFindingService from '@app/services/word-finding-service/word-finding.service';
import { Container } from 'typedi';
import { v4 as uuidv4 } from 'uuid';
import Range from '@app/classes/range/range';
import { VirtualPlayerService } from '@app/services/virtual-player-service/virtual-player.service';
import { Delay } from '@app/utils/delay';
import { Board } from '@app/classes/board';
import { ActionData } from '@app/classes/communication/action-data';

export abstract class AbstractVirtualPlayer extends Player {
    gameId: string;
    pointHistory: Map<number, number>;

    private wordFindingService: WordFindingService;
    private activeGameService: ActiveGameService;
    private virtualPlayerService: VirtualPlayerService;
    constructor(gameId: string, name: string) {
        super(VIRTUAL_PLAYER_ID_PREFIX + uuidv4(), name);
        this.pointHistory = new Map<number, number>();
        this.gameId = gameId;
        this.wordFindingService = Container.get(WordFindingService);
        this.activeGameService = Container.get(ActiveGameService);
        this.virtualPlayerService = Container.get(VirtualPlayerService);
    }

    getVirtualPlayerService(): VirtualPlayerService {
        return this.virtualPlayerService;
    }

    getWordFindingService(): WordFindingService {
        return this.wordFindingService;
    }

    getActiveGameService(): ActiveGameService {
        return this.activeGameService;
    }

    getGameBoard(gameId: string, playerId: string): Board {
        return this.getActiveGameService().getGame(gameId, playerId).board;
    }

    async playTurn(): Promise<void> {
        console.log('playTurn');
        const waitPreliminaryTime = async (): Promise<void> => {
            await Delay.for(PRELIMINARY_WAIT_TIME);
        };
        const waitFinalTime = async (): Promise<void> => {
            await Delay.for(FINAL_WAIT_TIME);
        };

        const play = async (): Promise<[ActionData, void]> => {
            return Promise.all([this.findAction(), waitPreliminaryTime()]);
        };
        const actionResult: [ActionData, void] | void = await Promise.race([play(), waitFinalTime()]);
        console.log(`actionResult: ${actionResult}`);

        this.getVirtualPlayerService().sendAction(this.gameId, this.id, actionResult ? actionResult[0] : this.alternativeMove());
    }

    protected isExchangePossible(): boolean {
        let total = 0;
        this.getActiveGameService()
            .getGame(this.gameId, this.id)
            .getTilesLeftPerLetter()
            .forEach((value: number) => {
                total += value;
            });
        return total >= MINIMUM_EXCHANGE_WORD_COUNT;
    }

    protected abstract findAction(): Promise<ActionData>;

    protected abstract findPointRange(): Range;

    protected abstract alternativeMove(): ActionData;
}
