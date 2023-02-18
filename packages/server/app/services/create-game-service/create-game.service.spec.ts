/* eslint-disable no-unused-expressions */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable dot-notation */
import { GameConfig, GameConfigData } from '@app/classes/game/game-config';
import { GameMode } from '@app/classes/game/game-mode';
import { GameType } from '@app/classes/game/game-type';
import WaitingRoom from '@app/classes/game/waiting-room';
import Player from '@app/classes/player/player';
import { VirtualPlayerLevel } from '@app/classes/player/virtual-player-level';
import * as BeginnerVirtualPlayer from '@app/classes/virtual-player/beginner-virtual-player/beginner-virtual-player';
import * as ExpertVirtualPlayer from '@app/classes/virtual-player/expert-virtual-player/expert-virtual-player';
import { GROUP_CHANNEL } from '@app/constants/chat';
import { TEST_DICTIONARY } from '@app/constants/dictionary-tests-const';
import { ActiveGameService } from '@app/services/active-game-service/active-game.service';
import { ServicesTestingUnit } from '@app/services/service-testing-unit/services-testing-unit.spec';
import * as chai from 'chai';
import { expect, spy } from 'chai';
import * as spies from 'chai-spies';
import * as sinon from 'sinon';
import { SinonStubbedInstance } from 'sinon';
import { Container } from 'typedi';
import * as uuid from 'uuid';
import { ChatService } from '@app/services/chat-service/chat.service';
import { CreateGameService } from './create-game.service';

chai.use(spies);

const DEFAULT_PLAYER_ID = 'playerId';
const DEFAULT_USER_ID = 1;

const DEFAULT_MAX_ROUND_TIME = 1;

const DEFAULT_PLAYER_NAME = 'player';
const DEFAULT_GAME_CONFIG_DATA: GameConfigData = {
    playerName: DEFAULT_PLAYER_NAME,
    playerId: DEFAULT_PLAYER_ID,
    gameType: GameType.Classic,
    gameMode: GameMode.Multiplayer,
    virtualPlayerLevel: VirtualPlayerLevel.Beginner,
    virtualPlayerName: DEFAULT_PLAYER_NAME,
    maxRoundTime: DEFAULT_MAX_ROUND_TIME,
    dictionary: TEST_DICTIONARY,
};

const DEFAULT_GAME_CONFIG_DATA_EXPERT: GameConfigData = {
    playerName: DEFAULT_PLAYER_NAME,
    playerId: DEFAULT_PLAYER_ID,
    gameType: GameType.Classic,
    gameMode: GameMode.Multiplayer,
    virtualPlayerLevel: VirtualPlayerLevel.Expert,
    virtualPlayerName: DEFAULT_PLAYER_NAME,
    maxRoundTime: DEFAULT_MAX_ROUND_TIME,
    dictionary: TEST_DICTIONARY,
};

const DEFAULT_GAME_CONFIG: GameConfig = {
    player1: new Player(DEFAULT_PLAYER_ID, DEFAULT_PLAYER_NAME),
    gameType: GameType.Classic,
    gameMode: GameMode.Multiplayer,
    maxRoundTime: DEFAULT_MAX_ROUND_TIME,
    dictionary: TEST_DICTIONARY,
};

describe('CreateGameService', () => {
    let createGameService: CreateGameService;
    let activeGameServiceStub: SinonStubbedInstance<ActiveGameService>;
    let testingUnit: ServicesTestingUnit;

    beforeEach(() => {
        testingUnit = new ServicesTestingUnit().withStubbed(ChatService);
        activeGameServiceStub = testingUnit.setStubbed(ActiveGameService);
        activeGameServiceStub.beginGame.resolves();
        createGameService = Container.get(CreateGameService);
        spy.on(uuid, 'v4', () => {
            return '';
        });
    });

    afterEach(() => {
        chai.spy.restore();
        sinon.restore();
        testingUnit.restore();
    });

    describe('createSoloGame', () => {
        it('should call activeGameService.beginGame', async () => {
            spy.on(uuid, 'v4', () => {
                return '';
            });
            spy.on(createGameService, 'generateGameConfig', () => {
                return {} as unknown as GameConfig;
            });
            spy.on(createGameService, 'generateReadyGameConfig', () => {
                return {} as unknown as GameConfig;
            });
            sinon.stub(BeginnerVirtualPlayer, 'BeginnerVirtualPlayer');

            await createGameService.createSoloGame(DEFAULT_GAME_CONFIG_DATA);
            expect(activeGameServiceStub.beginGame.calledOnce).to.be.true;
        });

        it('should add a Beginner player if it is the selected virtual player level', async () => {
            spy.on(createGameService, 'generateGameConfig', () => {
                return;
            });
            spy.on(createGameService, 'generateReadyGameConfig', () => {
                return;
            });

            const stub = sinon.stub(BeginnerVirtualPlayer, 'BeginnerVirtualPlayer');
            await createGameService.createSoloGame(DEFAULT_GAME_CONFIG_DATA);
            expect(stub.called).to.be.true;
        });

        it('should add an Expert player if it is the selected virtual player level', async () => {
            spy.on(createGameService, 'generateGameConfig', () => {
                return;
            });
            spy.on(createGameService, 'generateReadyGameConfig', () => {
                return;
            });

            const stub = sinon.stub(ExpertVirtualPlayer, 'ExpertVirtualPlayer');
            await createGameService.createSoloGame(DEFAULT_GAME_CONFIG_DATA_EXPERT);
            expect(stub.callCount).to.be.equal(3);
        });

        it('should call generateReadyGameConfig', async () => {
            spy.on(createGameService, 'generateGameConfig', () => {
                return DEFAULT_GAME_CONFIG;
            });

            const generateReadyGameConfigSpy = spy.on(createGameService, 'generateReadyGameConfig', () => {
                return;
            });
            sinon.stub(BeginnerVirtualPlayer, 'BeginnerVirtualPlayer');

            await createGameService.createSoloGame(DEFAULT_GAME_CONFIG_DATA);
            expect(generateReadyGameConfigSpy).to.have.been.called();
        });
    });

    describe('createMultiplayerGame', () => {
        let chatServiceStub: SinonStubbedInstance<ChatService>;

        beforeEach(() => {
            spy.on(createGameService, 'generateGameConfig', () => {
                return DEFAULT_GAME_CONFIG;
            });
            chatServiceStub = testingUnit.getStubbedInstance(ChatService);
            chatServiceStub.createChannel.resolves({ ...GROUP_CHANNEL, idChannel: 1, canQuit: true, default: false, private: true });
        });

        it('should return waiting room with config and channel id', async () => {
            const newWaitingRoom = await createGameService.createMultiplayerGame(DEFAULT_GAME_CONFIG_DATA, DEFAULT_USER_ID);
            expect(newWaitingRoom).to.be.an.instanceof(WaitingRoom);
            expect(newWaitingRoom['config']).to.deep.equal(DEFAULT_GAME_CONFIG);
            expect(newWaitingRoom['groupChannelId']).to.equal(1);
        });
    });

    describe('generateGameConfig', () => {
        it('should call generateGameConfig', () => {
            const configSpy = spy.on(createGameService, 'generateGameConfig');
            createGameService.createMultiplayerGame(DEFAULT_GAME_CONFIG_DATA, DEFAULT_USER_ID);
            expect(configSpy).to.have.been.called();
        });
    });

    describe('generateReadyGameConfig', () => {
        it('should return a ReadyGameConfig', () => {
            const DEFAULT_PLAYER_2 = new Player('testid2', 'DJ TESTO');
            const DEFAULT_PLAYER_3 = new Player('testid3', 'DJ TESTO');
            const DEFAULT_PLAYER_4 = new Player('testid4', 'DJ TESTO');
            const newReadyGameConfig = createGameService['generateReadyGameConfig'](
                DEFAULT_PLAYER_2,
                DEFAULT_PLAYER_3,
                DEFAULT_PLAYER_4,
                DEFAULT_GAME_CONFIG,
            );
            const DEFAULT_READY_GAME_CONFIG = {
                ...DEFAULT_GAME_CONFIG,
                player2: DEFAULT_PLAYER_2,
                player3: DEFAULT_PLAYER_3,
                player4: DEFAULT_PLAYER_4,
            };
            expect(newReadyGameConfig).to.deep.equal(DEFAULT_READY_GAME_CONFIG);
        });
    });
});
