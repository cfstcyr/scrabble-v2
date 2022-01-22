import { ActionPlay } from '@app/classes/actions/action-play';
import { Orientation } from '@app/classes/orientation';
import { Square } from '@app/classes/square';
import { Tile } from '@app/classes/tile';

export class ActionPlace implements ActionPlay {
    willEndTurn: boolean;
    tilesToPlace: Tile[];
    startingSquare: Square;
    orientation: Orientation;

    constructor(tilesToPlace: Tile[], startingSquare: Square, orientation: Orientation) {
        this.willEndTurn = true;
        this.tilesToPlace = tilesToPlace;
        this.startingSquare = startingSquare;
        this.orientation = orientation;
    }

    execute(): void {
        return;
    }

    getMessage(): string {
        return '';
    }
}
