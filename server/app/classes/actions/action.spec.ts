/* eslint-disable no-unused-expressions */
/* eslint-disable @typescript-eslint/no-unused-expressions */

import { GameUpdateData } from '@app/classes/communication/game-update-data';
import Game from '@app/classes/game/game';
import Player from '@app/classes/player/player';
import { FeedbackMessage } from '@app/services/game-play-service/feedback-messages';
import { expect } from 'chai';
import { Action, ActionHelp, ActionInfo, ActionPass, ActionPlay } from '.';

const DEFAULT_MESSAGE = 'message';

class MockAction extends Action {
    willEndTurn(): boolean {
        return true;
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    execute(): void | GameUpdateData {}

    getMessage(): FeedbackMessage {
        return { message: DEFAULT_MESSAGE };
    }
}

describe('Action', () => {
    describe('ActionPlay', () => {
        let action: ActionPlay;

        beforeEach(() => {
            action = new ActionPass(null as unknown as Player, null as unknown as Game);
        });

        it('should end round', () => {
            expect(action.willEndTurn()).to.be.true;
        });
    });

    describe('ActionInfo', () => {
        let action: ActionInfo;

        beforeEach(() => {
            action = new ActionHelp(null as unknown as Player, null as unknown as Game);
        });

        it('should not end round', () => {
            expect(action.willEndTurn()).to.be.false;
        });
    });

    describe('getOpponentMessage', () => {
        let action: Action;

        beforeEach(() => {
            action = new MockAction(null as unknown as Player, null as unknown as Game);
        });

        it('should return getMessage if method not overloaded', () => {
            expect(action.getOpponentMessage()).to.deep.equal(action.getMessage());
        });
    });
});
