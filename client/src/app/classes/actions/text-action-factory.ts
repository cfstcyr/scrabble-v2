import { Action } from '@app/classes/actions/action';
import { ActionPlay } from '@app/classes/actions/action-play';
import { ActionPass } from '@app/classes/actions/action-pass';
import { ActionPlace } from '@app/classes/actions/action-place';
import { ActionExchange } from '@app/classes/actions/action-exchange';
import { ActionClue } from '@app/classes/actions/action-clue';
import { ActionHelp } from '@app/classes/actions/action-help';
import { ActionReserve } from '@app/classes/actions/action-reserve';
import { Square } from '@app/classes/square';
import { Tile } from '@app/classes/tile';
import { Orientation } from '@app/classes/orientation';

// TODO: Who has the responsibility of parsing input command and retrieve the Player tiles and board.
// Right now, TextActionFactory and GUI have same createPlace method
export class TextActionFactory {
    createAction(userInput: string): Action {
        return new ActionPass();
    }
    createPass(): ActionPass {
        return new ActionPass();
    }
    createPlace(tileToPlace: Tile[], startingSquare: Square, orientation: Orientation): ActionPlace {
        return new ActionPlace(tileToPlace, startingSquare, orientation);
    }
    createExchange(tilesToExchange: Tile[]): ActionExchange {
        return new ActionExchange(tilesToExchange);
    }
    createHelp(): ActionHelp {
        return new ActionHelp();
    }
    createClue(): ActionClue {
        return new ActionClue();
    }
    createReserve(): ActionReserve {
        return new ActionReserve();
    }
}
