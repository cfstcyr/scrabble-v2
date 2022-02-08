import { Square } from '@app/classes/square';
import { LetterValue } from '@app/classes/tile';
import { Vec2 } from '@app/classes/vec2';
import { COLORS } from '@app/constants/colors';

export const LETTER_VALUES: LetterValue[] = [
    'A',
    'B',
    'C',
    'D',
    'E',
    'F',
    'G',
    'H',
    'I',
    'J',
    'K',
    'L',
    'M',
    'N',
    'O',
    'P',
    'Q',
    'R',
    'S',
    'T',
    'U',
    'V',
    'W',
    'X',
    'Y',
    'Z',
    '*',
];

export const SQUARE_SIZE: Vec2 = { x: 1, y: 1 };
export const MARGIN_COLUMN_SIZE = 1;

export const DEFAULT_SQUARE_COLOR = COLORS.Beige;
export const UNDEFINED_TILE: { letter: '?'; value: number } = { letter: '?', value: -1 };
export const UNDEFINED_GRID_SIZE: Vec2 = { x: -1, y: -1 };
export const UNDEFINED_SQUARE_SIZE: Vec2 = { x: -1, y: -1 };
export const UNDEFINED_SQUARE: Square = {
    tile: null,
    position: { row: -1, column: -1 },
    scoreMultiplier: null,
    wasMultiplierUsed: false,
    isCenter: false,
};

export const SECONDS_TO_MILLISECONDS = 1000;
