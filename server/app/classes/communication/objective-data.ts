import { ObjectiveState } from '@app/classes/objectives/objective-state';

export interface ObjectiveData {
    name: string;
    bonusPoints: number;
    state: ObjectiveState;
    isPublic: boolean;
    progress: number;
    maxProgress: number;
}
