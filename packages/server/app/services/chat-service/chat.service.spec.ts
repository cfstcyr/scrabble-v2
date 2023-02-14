/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable dot-notation */
/* eslint-disable no-unused-expressions */
/* eslint-disable @typescript-eslint/no-unused-expressions */
import { Application } from '@app/app';
import { ServerSocket } from '@app/classes/communication/socket-type';
import DictionaryService from '@app/services/dictionary-service/dictionary.service';
import { ServicesTestingUnit } from '@app/services/service-testing-unit/services-testing-unit.spec';
import { ChatClientEvents, ChatServerEvents } from '@common/events/chat.event';
import { createServer, Server } from 'http';
import { AddressInfo } from 'net';
import * as io from 'socket.io';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import { Container } from 'typedi';
import { ChatService } from './chat.service';
import * as Sinon from 'sinon';
import { expect } from 'chai';
import { DEFAULT_CHANNELS } from '@app/constants/chat';
import { Channel } from '@common/models/chat/channel';
import { ChatMessage } from '@common/models/chat/chat-message';
import { PublicUser, User, UserDatabase } from '@common/models/user';
import { ALREADY_EXISTING_CHANNEL_NAME, ALREADY_IN_CHANNEL, CHANNEL_DOES_NOT_EXISTS, NOT_IN_CHANNEL } from '@app/constants/services-errors';
import { Delay } from '@app/utils/delay/delay';
import { StatusCodes } from 'http-status-codes';
import { getSocketNameFromChannel } from '@app/utils/socket';
import { AuthentificationService } from '@app/services/authentification-service/authentification.service';
import DatabaseService from '@app/services/database-service/database.service';
import { USER_TABLE } from '@app/constants/services-constants/database-const';
import { SocketErrorResponse } from '@common/models/error';
import { SocketService } from '@app/services/socket-service/socket.service';

// const TIMEOUT_DELAY = 10000;
const RESPONSE_DELAY = 400;
const SERVER_URL = 'http://localhost:';

const USER: UserDatabase = {
    email: 'bob@example.com',
    idUser: 1,
    username: 'Bob',
    password: '',
};

const PUBLIC_USER: PublicUser = {
    email: USER.email,
    username: USER.username,
    avatar: '',
};

const testChannel: Channel = {
    idChannel: 0,
    name: 'test',
    canQuit: true,
    private: false,
    default: false,
};
const expectedMessage: ChatMessage = {
    sender: PUBLIC_USER,
    content: 'message cool',
    date: new Date(),
};

class TestClass {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    testFunc = () => {};
}

describe('ChatService', () => {
    afterEach(() => {
        Sinon.restore();
    });

    let service: ChatService;
    let sio: io.Server;
    let server: Server;
    let serverSocket: ServerSocket;
    let clientSocket: ClientSocket<ChatServerEvents, ChatClientEvents>;
    let testingUnit: ServicesTestingUnit;
    let databaseService: DatabaseService;

    const insertChannel = async (channel: Channel) => {
        await service['channelTable'].insert(channel);
    };

    const resetChannels = async () => {
        await service['userChatTable'].delete();
        await service['channelTable'].delete();
    };

    beforeEach(async () => {
        testingUnit = new ServicesTestingUnit()
            .withStubbed(DictionaryService)
            .withStubbed(AuthentificationService, {
                authenticateSocket: Promise.resolve(USER),
            })
            .withStubbed(SocketService)
            .withStubbedPrototypes(Application, { bindRoutes: undefined });
        await testingUnit.withMockDatabaseService();
        databaseService = Container.get(DatabaseService);
    });

    beforeEach((done) => {
        service = Container.get(ChatService);
        server = createServer();
        sio = new io.Server(server);
        server.listen(() => {
            const port: number = (server.address() as AddressInfo).port;
            clientSocket = ioClient(SERVER_URL + port);
            sio.on('connection', (socket: io.Socket) => (serverSocket = socket));
            clientSocket.on('connect', done);
        });
    });

    afterEach(() => {
        sio.close();
        serverSocket.disconnect();
        clientSocket.close();
        testingUnit.restore();
    });

    describe.only('constructor', () => {
        it('should call configureSockets when configureSocketsEvent emit initiliasation', () => {
            const spy = Sinon.spy(service, 'configureSocket');
            const socketServiceStub = testingUnit.getStubbedInstance(SocketService);

            socketServiceStub['configureSocketsEvent'].emit('initiliasation', serverSocket);
            expect(spy).to.have.been.called.with(serverSocket);
        });
    });

    describe('initialize', () => {
        it('should create default channels', async () => {
            expect(await service.getChannels()).to.have.length(0);

            await service.initialize();

            expect(await service.getChannels()).to.have.length(DEFAULT_CHANNELS.length);
        });

        it('should not create default channels if already exists', async () => {
            await service.initialize();

            expect(await service.getChannels()).to.have.length(DEFAULT_CHANNELS.length);

            await service.initialize();

            expect(await service.getChannels()).to.have.length(DEFAULT_CHANNELS.length);
        });
    });

    describe('configureSocket', () => {
        beforeEach(async () => {
            service.configureSocket(serverSocket);
            await insertChannel(testChannel);
            await databaseService.knex<User>(USER_TABLE).insert(USER);
        });

        describe('channel:newMessage', () => {
            describe('HAPPY - PATH', () => {
                it('should not emit message to client NOT in channel', async () => {
                    const testClass = new TestClass();
                    const funcSpy = Sinon.spy(testClass, 'testFunc');

                    clientSocket.on('channel:newMessage', () => {
                        testClass.testFunc();
                    });
                    clientSocket.on('end' as any, async () => Promise.resolve());

                    clientSocket.emit('channel:newMessage', { idChannel: testChannel.idChannel, message: expectedMessage });
                    await Delay.for(RESPONSE_DELAY);

                    expect(funcSpy.called).to.be.false;
                    serverSocket.emit('end' as any);
                });
            });
            describe('SAD PATH', () => {
                it('should throw error if channel does NOT exist', async () => {
                    await resetChannels();

                    return new Promise((resolve) => {
                        clientSocket.on('error' as any, (error: SocketErrorResponse) => {
                            expect(error.message).to.equal(CHANNEL_DOES_NOT_EXISTS);
                            expect(error.status).to.equal(StatusCodes.BAD_REQUEST);
                            resolve();
                        });
                        serverSocket.join(getSocketNameFromChannel(testChannel));

                        clientSocket.emit('channel:newMessage', { idChannel: testChannel.idChannel, message: expectedMessage });
                    });
                });

                it('should throw error if user not in channel', (done) => {
                    clientSocket.on('error' as any, (error: SocketErrorResponse) => {
                        expect(error.message).to.equal(NOT_IN_CHANNEL);
                        expect(error.status).to.equal(StatusCodes.FORBIDDEN);
                        done();
                    });
                    serverSocket.leave(getSocketNameFromChannel(testChannel));

                    clientSocket.emit('channel:newMessage', { idChannel: testChannel.idChannel, message: expectedMessage });
                });
            });
        });

        describe('channel:createChannel', () => {
            describe('HAPPY PATH', () => {
                it("should add channel to list of channels if it doesn't exist", async () => {
                    await resetChannels();

                    clientSocket.emit('channel:newChannel', testChannel.name);

                    await Delay.for(RESPONSE_DELAY);

                    expect(await service['channelTable'].select('*').where({ name: testChannel.name })).to.have.length(1);
                });
            });
            describe('SAD PATH', () => {
                it('should throw error if channel already exist', (done) => {
                    clientSocket.on('error' as any, (error: SocketErrorResponse) => {
                        expect(error.message).to.equal(ALREADY_EXISTING_CHANNEL_NAME);
                        expect(error.status).to.equal(StatusCodes.FORBIDDEN);
                        done();
                    });

                    clientSocket.emit('channel:newChannel', testChannel.name);
                });
            });
        });

        describe('channel:join', () => {
            describe('HAPPY PATH', () => {
                it('should add socket to channel room', async () => {
                    clientSocket.emit('channel:join', testChannel.idChannel);

                    await Delay.for(RESPONSE_DELAY);

                    expect(serverSocket.rooms.has(getSocketNameFromChannel(testChannel))).to.be.true;
                });
            });
            describe('SAD PATH', () => {
                it('should throw error if channel does NOT exist', async () => {
                    await resetChannels();

                    return new Promise((resolve) => {
                        clientSocket.on('error' as any, (error: SocketErrorResponse) => {
                            expect(error.message).to.equal(CHANNEL_DOES_NOT_EXISTS);
                            expect(error.status).to.equal(StatusCodes.BAD_REQUEST);
                            resolve();
                        });

                        clientSocket.emit('channel:join', testChannel.idChannel);
                    });
                });
                it('should throw error if user already in channel', (done) => {
                    clientSocket.on('error' as any, (error: SocketErrorResponse) => {
                        expect(error.message).to.equal(ALREADY_IN_CHANNEL);
                        expect(error.status).to.equal(StatusCodes.BAD_REQUEST);
                        done();
                    });
                    serverSocket.join(getSocketNameFromChannel(testChannel));

                    clientSocket.emit('channel:join', testChannel.idChannel);
                });
            });
        });

        describe('channel:quit', () => {
            describe('HAPPY PATH', () => {
                it('should remove socket from channel room of room exists', async () => {
                    serverSocket.join(getSocketNameFromChannel(testChannel));

                    clientSocket.emit('channel:quit', testChannel.idChannel);

                    await Delay.for(RESPONSE_DELAY);

                    expect(serverSocket.rooms.has(getSocketNameFromChannel(testChannel))).to.be.false;
                });
            });
            describe('SAD PATH', () => {
                it('should throw error if channel does NOT exist', async () => {
                    await resetChannels();

                    return new Promise((resolve) => {
                        clientSocket.on('error' as any, (error: SocketErrorResponse) => {
                            expect(error.message).to.equal(CHANNEL_DOES_NOT_EXISTS);
                            expect(error.status).to.equal(StatusCodes.BAD_REQUEST);
                            resolve();
                        });
                        serverSocket.join(getSocketNameFromChannel(testChannel));

                        clientSocket.emit('channel:quit', testChannel.idChannel);
                    });
                });
            });
        });
    });
});
