import { AbstractObjective } from '@app/classes/objectives/abstract-objective';
import { ObjectiveValidationParameters } from '@app/classes/objectives/validation-parameters';
import { VOWELS } from '@app/constants/services-constants/objective.const';

export const NAME = 'Voyelles au max';
export const DESCRIPTION = 'Former un mot qui contient 4 voyelles ou plus';
export const BONUS_POINTS = 30;
export const SHOULD_RESET = false;
export const MAX_PROGRESS = 1;

export const REQUIRED_NUMBER_OF_VOWELS = 4;

export class FourVowelsWordObjective extends AbstractObjective {
    constructor() {
        super(NAME, DESCRIPTION, BONUS_POINTS, SHOULD_RESET, MAX_PROGRESS);
    }

    updateProgress(validationParameters: ObjectiveValidationParameters): void {
        for (const createdWord of validationParameters.createdWords) {
            const numberOfVowels = createdWord.filter(([, tile]) => VOWELS().includes(tile.letter)).length;
            if (numberOfVowels >= REQUIRED_NUMBER_OF_VOWELS) {
                this.progress = this.maxProgress;
                break;
            }
        }
    }

    clone(): FourVowelsWordObjective {
        const clone = new FourVowelsWordObjective();
        clone.progress = this.progress;
        clone.state = this.state;
        clone.isPublic = this.isPublic;
        return clone;
    }
}
