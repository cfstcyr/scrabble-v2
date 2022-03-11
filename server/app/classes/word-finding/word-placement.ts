import { Orientation, Position } from '@app/classes/board';
import { Tile } from '@app/classes/tile';

export interface WordPlacement {
    tilesToPlace: Tile[];
    orientation: Orientation;
    startPosition: Position;
}

export interface ScoredWordPlacement extends WordPlacement {
    score: number;
}
