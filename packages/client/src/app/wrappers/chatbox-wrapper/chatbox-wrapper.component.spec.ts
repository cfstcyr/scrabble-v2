/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ClientChannel } from '@app/classes/chat/channel';
import { ChatboxContainerComponent } from '@app/components/chatbox-container/chatbox-container.component';
import { ChatboxMessageComponent } from '@app/components/chatbox-message/chatbox-message.component';
import { ChatBoxComponent } from '@app/components/chatbox/chatbox.component';
import { IconButtonComponent } from '@app/components/icon-button/icon-button.component';
import { IconComponent } from '@app/components/icon/icon.component';
import { ChatService } from '@app/services/chat-service/chat.service';
import { Subject } from 'rxjs';

import { ChatboxWrapperComponent } from './chatbox-wrapper.component';

describe('ChatboxWrapperComponent', () => {
    let component: ChatboxWrapperComponent;
    let fixture: ComponentFixture<ChatboxWrapperComponent>;
    let chatService: jasmine.SpyObj<ChatService>;
    let ready: Subject<boolean>;
    let channels: Subject<ClientChannel[]>;
    let joinedChannel: Subject<ClientChannel>;

    beforeEach(async () => {
        ready = new Subject();
        channels = new Subject();
        joinedChannel = new Subject();

        chatService = jasmine.createSpyObj('ChatService', ['configureSocket', 'sendMessage', 'createChannel', 'joinChannel', 'getChannels'], {
            ready,
            channels,
            joinedChannel,
        });

        await TestBed.configureTestingModule({
            declarations: [
                ChatboxWrapperComponent,
                ChatboxContainerComponent,
                ChatBoxComponent,
                ChatboxMessageComponent,
                IconButtonComponent,
                IconComponent,
            ],
            imports: [ReactiveFormsModule, MatDialogModule],
            providers: [{ provide: ChatService, useValue: chatService }, FormBuilder, MatDialog],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ChatboxWrapperComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('handleSendMessage', () => {
        it('should call sendMessage', () => {
            component.handleSendMessage([{} as any, '']);
            expect(chatService.sendMessage).toHaveBeenCalled();
        });
    });

    describe('handleCreateChannel', () => {
        it('should call createChannel', () => {
            component.handleCreateChannel('');
            expect(chatService.createChannel).toHaveBeenCalled();
        });
    });

    describe('handleJoinChannel', () => {
        it('should call joinChannel', () => {
            component.handleJoinChannel('');
            expect(chatService.joinChannel).toHaveBeenCalled();
        });
    });
});
