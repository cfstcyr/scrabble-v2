import { CdkDragMove } from '@angular/cdk/drag-drop';
import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { Position } from '@app/classes/board-navigator/position';
import { TilePlacement } from '@app/classes/tile';
import { TilePlacementService } from '@app/services/tile-placement-service/tile-placement.service';
import { DragAndDropService } from './drag-and-drop.service';

const DEFAULT_PLACEMENT: TilePlacement = {
    position: { row: 0, column: 0 },
    tile: { letter: 'A', value: 1 },
};
const DEFAULT_EVENT: CdkDragMove<HTMLElement> = {
    pointerPosition: { x: 0, y: 0 },
} as CdkDragMove<HTMLElement>;

const createSquare = (document: Document, position: Position = DEFAULT_PLACEMENT.position) => {
    const square = document.createElement('div');
    square.classList.add('square');
    square.setAttribute('column', `${position.column}`);
    square.setAttribute('row', `${position.row}`);
    return square;
};

describe('DragAndDropService', () => {
    let service: DragAndDropService;
    let tilePlacementService: TilePlacementService;
    let document: Document;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [MatDialogModule],
        });
        service = TestBed.inject(DragAndDropService);
        tilePlacementService = TestBed.inject(TilePlacementService);
        document = TestBed.inject(DOCUMENT);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('onRackTileDrop', () => {
        it('should add tile to tilePlacements if is square', () => {
            const square = createSquare(document);
            spyOn(document, 'elementFromPoint').and.returnValue(square);

            service.onRackTileMove(DEFAULT_EVENT);
            service.onRackTileDrop(DEFAULT_PLACEMENT.tile);

            expect(tilePlacementService.tilePlacements).toHaveSize(1);
        });

        it('should not add tile to tilePlacements if is not square', () => {
            const square = document.createElement('div');
            spyOn(document, 'elementFromPoint').and.returnValue(square);

            service.onRackTileMove(DEFAULT_EVENT);
            service.onRackTileDrop(DEFAULT_PLACEMENT.tile);

            expect(tilePlacementService.tilePlacements).toHaveSize(0);
        });
    });

    describe('onBoardTileDrop', () => {
        let newPosition: Position;

        beforeEach(() => {
            newPosition = { row: 1, column: 1 };
        });

        it('should move tile if is square', () => {
            const square = createSquare(document, newPosition);
            spyOn(document, 'elementFromPoint').and.returnValue(square);

            tilePlacementService.placeTile(DEFAULT_PLACEMENT);

            service.onBoardTileMove(DEFAULT_EVENT);
            service.onBoardTileDrop(DEFAULT_PLACEMENT.tile, DEFAULT_PLACEMENT.position);

            expect(
                tilePlacementService.tilePlacements.find(
                    (placement) => placement.position.column === newPosition.column && placement.position.row === newPosition.row,
                ),
            ).toBeTruthy();
            expect(
                tilePlacementService.tilePlacements.find(
                    (placement) =>
                        placement.position.column === DEFAULT_PLACEMENT.position.column && placement.position.row === DEFAULT_PLACEMENT.position.row,
                ),
            ).toBeFalsy();
        });

        it('should not move tile if is not square', () => {
            const square = document.createElement('div');
            spyOn(document, 'elementFromPoint').and.returnValue(square);

            tilePlacementService.placeTile(DEFAULT_PLACEMENT);

            service.onBoardTileMove(DEFAULT_EVENT);
            service.onBoardTileDrop(DEFAULT_PLACEMENT.tile, DEFAULT_PLACEMENT.position);

            expect(
                tilePlacementService.tilePlacements.find(
                    (placement) => placement.position.column === newPosition.column && placement.position.row === newPosition.row,
                ),
            ).toBeFalsy();
            expect(
                tilePlacementService.tilePlacements.find(
                    (placement) =>
                        placement.position.column === DEFAULT_PLACEMENT.position.column && placement.position.row === DEFAULT_PLACEMENT.position.row,
                ),
            ).toBeTruthy();
        });

        it('should remove tile from tilePlacements if is tileRack', () => {
            const tileRack = document.createElement('div');
            tileRack.classList.add('tile-rack');
            spyOn(document, 'elementFromPoint').and.returnValue(tileRack);

            tilePlacementService.placeTile(DEFAULT_PLACEMENT);

            service.onBoardTileMove(DEFAULT_EVENT);
            service.onBoardTileDrop(DEFAULT_PLACEMENT.tile, DEFAULT_PLACEMENT.position);

            expect(tilePlacementService.tilePlacements).toHaveSize(0);
        });
    });
});
