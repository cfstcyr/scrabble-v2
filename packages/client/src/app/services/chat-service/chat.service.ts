import { Injectable } from '@angular/core';
import { ClientChannel } from '@app/classes/chat/channel';
import { ClientSocket } from '@app/classes/communication/socket-type';
import SocketService from '@app/services/socket-service/socket.service';
import { UserService } from '@app/services/user-service/user.service';
import { Channel } from '@common/models/chat/channel';
import { ChannelMessage } from '@common/models/chat/chat-message';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
    providedIn: 'root',
})
export class ChatService {
    ready: Subject<boolean> = new Subject();
    joinedChannel: Subject<ClientChannel>;
    channels: BehaviorSubject<Map<string, ClientChannel>>;

    constructor(private readonly socketService: SocketService, private readonly userService: UserService) {
        this.channels = new BehaviorSubject(new Map());
        this.joinedChannel = new Subject();

        this.socketService.onConnect.subscribe((socket) => {
            this.channels.next(new Map());
            this.configureSocket(socket);
            this.ready.next(true);
        });

        this.socketService.onDisconnect.subscribe(() => {
            this.ready.next(false);
            this.channels.next(new Map());
        });
    }

    getChannelsId(): Observable<string[]> {
        return this.channels.pipe(map((channels) => [...channels.keys()]));
    }

    getChannels(): Observable<ClientChannel[]> {
        return this.channels.pipe(map((channels) => [...channels.values()]));
    }

    getChannel(id: string): Observable<ClientChannel | undefined> {
        return this.channels.pipe(map((channels) => channels.get(id)));
    }

    configureSocket(socket: ClientSocket): void {
        socket.on('channel:join', this.handleJoinChannel.bind(this));
        socket.on('channel:quit', this.handleChannelQuit.bind(this));
        socket.on('channel:newMessage', this.handleNewMessage.bind(this));
        socket.emit('channel:init');
    }

    sendMessage(channel: Channel, content: string): void {
        this.socketService.socket.emit('channel:newMessage', {
            channel,
            message: {
                content,
                sender: this.userService.getUser(),
                date: new Date(),
            },
        });
    }

    createChannel(channelName: string): void {
        this.socketService.socket.emit('channel:newChannel', channelName);
    }

    joinChannel(channel: string): void {
        this.socketService.socket.emit('channel:join', channel);
    }

    quitChannel(channel: string): void {
        this.socketService.socket.emit('channel:quit', channel);
    }

    handleJoinChannel(channel: Channel): void {
        const newChannel = { ...channel, messages: [] };
        this.channels.value.set(channel.name, newChannel);
        this.channels.next(this.channels.value);
        this.joinedChannel.next(newChannel);
    }

    handleChannelQuit(channel: Channel): void {
        this.channels.value.delete(channel.name);
        this.channels.next(this.channels.value);
        // const index = this.channels.findIndex(({ id }) => id === channel.id);
        // if (index >= 0) this.channels.splice(index, 1);
    }

    handleNewMessage(channelMessage: ChannelMessage): void {
        const message = channelMessage.message;
        this.channels.value.get(channelMessage.channel.name)?.messages.push({ ...message, date: new Date(message.date) });
        this.channels.next(this.channels.value);
    }
}
