/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable dot-notation */
import { CommonModule } from '@angular/common';
import { EventEmitter } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Square, SquareView } from '@app/classes/square';
import { Vec2 } from '@app/classes/vec2';
import { UNDEFINED_SQUARE } from '@app/constants/game';
import { AppMaterialModule } from '@app/modules/material.module';
import { BoardService } from '@app/services';
import { BoardComponent } from './board.component';

class MockBoardService {
    static boardServiceGridSize: Vec2 = { x: 5, y: 5 };
    pGrid: Square[][];
    boardInitializationEvent: EventEmitter<Square[][]> = new EventEmitter();
    boardUpdateEvent: EventEmitter<Square[]> = new EventEmitter();

    createGrid() {
        this.grid = [];
        for (let i = 0; i < this.getGridSize().y; i++) {
            this.grid.push([]);
            for (let j = 0; j < this.getGridSize().x; j++) {
                const mockSquare: Square = {
                    tile: null,
                    position: { row: i, column: j },
                    scoreMultiplier: null,
                    wasMultiplierUsed: false,
                    isCenter: false,
                };
                this.grid[i].push(mockSquare);
            }
        }
    }

    get grid(): Square[][] {
        return this.pGrid;
    }
    set grid(grid: Square[][]) {
        this.pGrid = grid;
    }

    getGridSize(): Vec2 {
        return MockBoardService.boardServiceGridSize;
    }
}

describe('BoardComponent', () => {
    let mockBoardService: MockBoardService;
    let component: BoardComponent;
    let fixture: ComponentFixture<BoardComponent>;

    const boardSizesToTest = [
        [
            { x: -1, y: -1 },
            { x: 0, y: 0 },
        ],
        [
            { x: 0, y: 0 },
            { x: 0, y: 0 },
        ],
        [
            { x: 15, y: 15 },
            { x: 15, y: 15 },
        ],
        [
            { x: 15, y: 10 },
            { x: 15, y: 10 },
        ],
    ];

    beforeEach(() => {
        mockBoardService = new MockBoardService();
    });

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                MatGridListModule,
                MatCardModule,
                MatProgressSpinnerModule,
                MatIconModule,
                MatButtonModule,
                ReactiveFormsModule,
                CommonModule,
                MatInputModule,
                BrowserAnimationsModule,
                AppMaterialModule,
                MatFormFieldModule,
                FormsModule,
                MatDialogModule,
            ],
            declarations: [BoardComponent],
            providers: [{ provide: BoardService, useValue: mockBoardService }],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(BoardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();

        mockBoardService.createGrid();
        component['initializeBoard'](mockBoardService.grid);
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('Component should call initializeBoard on init', () => {
        const initSpy = spyOn<any>(component, 'initializeBoard');
        component.ngOnInit();
        expect(initSpy).toHaveBeenCalled();
    });

    boardSizesToTest.forEach((testCase) => {
        const boardSize: Vec2 = testCase[0];
        const expectedBoardSize: Vec2 = testCase[1];

        if (!expectedBoardSize) {
            return;
        }
        it(
            'Initializing board of size ' +
                boardSize.x +
                ' : ' +
                boardSize.y +
                ' should create board of size ' +
                expectedBoardSize.x +
                ' : ' +
                expectedBoardSize.y,
            () => {
                spyOn<any>(mockBoardService, 'getGridSize').and.returnValue(boardSize);
                mockBoardService.createGrid();
                // Recreate the component so it reads the new grid size
                fixture = TestBed.createComponent(BoardComponent);
                component = fixture.componentInstance;
                fixture.detectChanges();

                component['initializeBoard'](mockBoardService.grid);

                let actualRowAmount = 0;
                let actualColAmount = 0;

                if (component.squareGrid) {
                    actualRowAmount = component.squareGrid.length;
                    /*
                    If the Grid size is supposed to be smaller or equal to 0,
                    then each row of the grid will not be initialized.
                    So if the row is undefined, its length is 0
                    If the expected size is greater than 0, then the row length is defined
                */
                    actualColAmount = component.squareGrid[0] ? component.squareGrid[0].length : 0;
                }
                const actualBoardSize: Vec2 = { x: actualColAmount, y: actualRowAmount };
                expect(actualBoardSize).toEqual(expectedBoardSize);
            },
        );
    });

    it('Call to BoardService getGridSize should assign right value to gridSize', () => {
        expect(component.gridSize).toEqual(mockBoardService.getGridSize());
    });

    it('If BoardService returns grid with null squares, should assign UNDEFINED_SQUARE to board', () => {
        const grid = [
            [UNDEFINED_SQUARE, null],
            [UNDEFINED_SQUARE, null],
        ];
        const expectedGrid = [
            [UNDEFINED_SQUARE, UNDEFINED_SQUARE],
            [UNDEFINED_SQUARE, UNDEFINED_SQUARE],
        ];
        spyOn<any>(mockBoardService, 'getGridSize').and.returnValue({ x: 2, y: 2 });

        // We need to spy on the property otherwise we cannot return a grid with null
        // values because of TypeScript's type enforcing
        spyOnProperty(mockBoardService, 'grid', 'get').and.returnValue(grid);

        fixture = TestBed.createComponent(BoardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        component['initializeBoard'](mockBoardService.grid);

        const actualSquareGrid = component.squareGrid.map((row: SquareView[]) => {
            return row.map((sv: SquareView) => sv.square);
        });
        expect(actualSquareGrid).toEqual(expectedGrid);
    });

    it('BoardService update event should update board', () => {
        const updateSpy = spyOn<any>(component, 'updateBoard');
        mockBoardService.boardUpdateEvent.emit(mockBoardService.grid[0]);
        expect(updateSpy).toHaveBeenCalledWith(mockBoardService.grid[0]);
    });

    it('Update Board with no squares in argument should return false', () => {
        expect(component['updateBoard']([])).toBeFalsy();
    });

    it('Update Board with more squares that in the grid should return false', () => {
        const squaresToUpdate: Square[] = Array.from(Array(component.gridSize.x * component.gridSize.y + 1), () => UNDEFINED_SQUARE);
        expect(component['updateBoard'](squaresToUpdate)).toBeFalsy();
    });

    it('Update Board with with one square should only change that square', () => {
        const currentSquareView: SquareView = component.squareGrid[0][0];
        const squaresToUpdate: Square[] = [
            {
                tile: null,
                position: { row: 0, column: 0 },
                scoreMultiplier: null,
                wasMultiplierUsed: !currentSquareView.square.wasMultiplierUsed,
                isCenter: false,
            },
        ];
        component['updateBoard'](squaresToUpdate);
        expect(component.squareGrid[0][0].square).toEqual(squaresToUpdate[0]);
    });

    it('Update Board with with multiple squares should change all the squares', () => {
        const squaresToUpdate: Square[] = [
            {
                tile: null,
                position: { row: 0, column: 0 },
                scoreMultiplier: null,
                wasMultiplierUsed: true,
                isCenter: false,
            },
            {
                tile: null,
                position: { row: 1, column: 0 },
                scoreMultiplier: null,
                wasMultiplierUsed: false,
                isCenter: true,
            },
            {
                tile: { letter: 'A', value: 0 },
                position: { row: 0, column: 1 },
                scoreMultiplier: null,
                wasMultiplierUsed: false,
                isCenter: false,
            },
        ];
        component['updateBoard'](squaresToUpdate);
        expect(component.squareGrid[0][0].square).toEqual(squaresToUpdate[0]);
        expect(component.squareGrid[1][0].square).toEqual(squaresToUpdate[1]);
        expect(component.squareGrid[0][1].square).toEqual(squaresToUpdate[2]);
    });

    it('Update Board with with squares not in the board should not update the board', () => {
        const initBoard = [...component.squareGrid];
        const squaresToUpdate: Square[] = [
            {
                tile: null,
                position: { row: component.gridSize.x + 1, column: 0 },
                scoreMultiplier: null,
                wasMultiplierUsed: true,
                isCenter: false,
            },
            {
                tile: null,
                position: { row: 1, column: component.gridSize.y + 1 },
                scoreMultiplier: null,
                wasMultiplierUsed: false,
                isCenter: true,
            },
            {
                tile: { letter: 'A', value: 0 },
                position: { row: component.gridSize.x + 1, column: component.gridSize.y + 1 },
                scoreMultiplier: null,
                wasMultiplierUsed: false,
                isCenter: false,
            },
            {
                tile: { letter: 'Z', value: 1 },
                position: { row: -1, column: -1 },
                scoreMultiplier: null,
                wasMultiplierUsed: false,
                isCenter: false,
            },
        ];
        component['updateBoard'](squaresToUpdate);
        expect(component.squareGrid).toEqual(initBoard);
    });
});
