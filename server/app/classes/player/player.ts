import { GameObjectivesData } from '@app/classes/communication/game-objectives-data';
import Game from '@app/classes/game/game';
import { AbstractObjective } from '@app/classes/objectives/abstract-objective';
import { ValidationParameters } from '@app/classes/objectives/validation-parameters';
import { Tile } from '@app/classes/tile';
import ObjectivesService from '@app/services/objectives-service/objectives.service';

export default class Player {
    name: string;
    score: number;
    tiles: Tile[];
    id: string;
    isConnected: boolean;
    private objectives: Set<AbstractObjective>;
    private readonly objectiveService: ObjectivesService;

    constructor(id: string, name: string) {
        this.id = id;
        this.name = name;
        this.score = 0;
        this.tiles = [];
        this.isConnected = true;
    }

    getTileRackPoints(): number {
        return this.tiles.reduce((prev, next) => prev + next.value, 0);
    }

    hasTilesLeft(): boolean {
        return this.tiles.length > 0;
    }

    endGameMessage(): string {
        return `${this.name} : ${this.tilesToString()}`;
    }

    tilesToString(): string {
        return this.tiles.reduce((prev, next) => prev + next.letter.toLocaleLowerCase(), '');
    }

    getObjectives(): AbstractObjective[] {
        return [...this.objectives.values()];
    }

    async initializeObjectives(objectives: Set<AbstractObjective>): Promise<void> {
        this.objectives = objectives;
    }

    updateObjectives(game: Game, validationParameters: ValidationParameters): GameObjectivesData {
        return this.objectiveService.validatePlayerObjectives(this, game, validationParameters);
    }
}
