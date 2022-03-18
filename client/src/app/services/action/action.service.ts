import { Injectable } from '@angular/core';
import { ActionData, ActionPayload, ActionType, ExchangeActionPayload, PlaceActionPayload } from '@app/classes/actions/action-data';
import { Orientation } from '@app/classes/orientation';
import { Position } from '@app/classes/position';
import { Tile } from '@app/classes/tile';
import { GamePlayController } from '@app/controllers/game-play-controller/game-play.controller';
import { ActionPayloadToString } from '@app/utils/action-payload-to-string';

@Injectable({
    providedIn: 'root',
})
export class ActionService {
    constructor(private gamePlayController: GamePlayController) {}

    createPlaceActionPayload(tiles: Tile[], startPosition: Position, orientation: Orientation): PlaceActionPayload {
        return {
            tiles,
            startPosition,
            orientation,
        };
    }

    createExchangeActionPayload(tiles: Tile[]): ExchangeActionPayload {
        return { tiles };
    }

    createActionData(actionType: ActionType, actionPayload: ActionPayload, input?: string): ActionData {
        input = input ?? this.createInputFromPayload(actionType, actionPayload);
        return {
            type: actionType,
            input,
            payload: actionPayload,
        };
    }

    sendAction(gameId: string, playerId: string | undefined, actionData: ActionData): void {
        if (!playerId) return;

        if (actionData.type === ActionType.PLACE) this.convertBlankTilesLetter((actionData.payload as PlaceActionPayload).tiles);

        this.gamePlayController.sendAction(gameId, playerId, actionData);
    }

    private createInputFromPayload(actionType: ActionType, payload: ActionPayload): string {
        switch (actionType) {
            case ActionType.PLACE:
                return ActionPayloadToString.placeActionPayloadToString(payload as PlaceActionPayload);
            case ActionType.EXCHANGE:
                return ActionPayloadToString.exchangeActionPayloadToString(payload as ExchangeActionPayload);
            default:
                return ActionPayloadToString.simpleActionToString(actionType);
        }
    }

    private convertBlankTilesLetter(tiles: Tile[]): void {
        tiles.forEach((tile) => {
            if (tile.isBlank && tile.playedLetter) tile.letter = tile.playedLetter;
        });
    }
}
