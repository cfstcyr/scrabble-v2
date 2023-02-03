import { Component } from '@angular/core';
import { ClientChannel } from '@app/classes/chat/channel';
import { ChatService } from '@app/services/chat-service/chat.service';
import { Channel } from '@common/models/chat/channel';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-chatbox-wrapper',
    templateUrl: './chatbox-wrapper.component.html',
    styleUrls: ['./chatbox-wrapper.component.scss'],
})
export class ChatboxWrapperComponent {
    channels: ClientChannel[];
    joinedChannel: Observable<ClientChannel>;

    constructor(private readonly chatService: ChatService) {
        this.channels = this.chatService.channels;
        this.joinedChannel = this.chatService.joinedChannel;
    }

    handleSendMessage([channel, content]: [Channel, string]) {
        this.chatService.sendMessage(channel, content);
    }

    handleCreateChannel(channelName: string): void {
        this.chatService.createChannel(channelName);
    }

    handleJoinChannel(channelName: string): void {
        this.chatService.joinChannel(channelName);
    }

    handleQuitChannel(channelName: string): void {
        this.chatService.quitChannel(channelName);
    }
}
