import { EXCHANGE_ACTION_THRESHOLD, PASS_ACTION_THRESHOLD } from '@app/constants/virtual-player-constants';
import { AbstractVirtualPlayer } from '@app/classes/virtual-player/abstract-virtual-player';
import { PointRange } from '@app/classes/word-finding';
import { ActionExchange, ActionPass, ActionPlace } from '@app/classes/actions';
import { ActionData } from '@app/classes/communication/action-data';
import WordFindingService from '@app/services/word-finding/word-finding';

export class BeginnerVirtualPlayer extends AbstractVirtualPlayer {
    findPointRange(): PointRange {
        throw new Error('Method not implemented.');
    }

    findAction(): ActionData {
        const randomAction = Math.random();
        if (randomAction <= PASS_ACTION_THRESHOLD) {
            return ActionPass.createPayload();
        } else if (randomAction <= EXCHANGE_ACTION_THRESHOLD) {
            return ActionExchange.createPayload(this.tiles);
        } else {
            // appeler la méthode de Raph et store le résultat dans pointHistoric
            // on a beosin des points pour historic et du mot + position pour le payload
            const wordFindingPayload = WordFindingService.findWord(this.generateWordFindingRequest());
            this.pointHistoric[newPoints]++;
            return ActionPlace.createPayload(this.tiles, wordFindingPayload);
        }
    }
}
