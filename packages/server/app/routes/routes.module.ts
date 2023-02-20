import {
    AuthentificationController,
    DatabaseController,
    DictionaryController,
    GameDispatcherController,
    GameHistoriesController,
    GamePlayController,
    HighScoresController,
    VirtualPlayerProfilesController,
} from '@app/controllers';
import { BaseController } from '@app/controllers/base-controller';

export type ClassType<T> = new (...args: unknown[]) => T;

export const PUBLIC_CONTROLLERS: ClassType<BaseController>[] = [AuthentificationController, DatabaseController];
export const PRIVATE_CONTROLLERS: ClassType<BaseController>[] = [
    DictionaryController,
    GameDispatcherController,
    GamePlayController,
    GameHistoriesController,
    HighScoresController,
    VirtualPlayerProfilesController,
];
