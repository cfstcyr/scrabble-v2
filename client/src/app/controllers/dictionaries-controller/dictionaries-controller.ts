import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { Dictionary } from '@app/classes/dictionary';
import { BasicDictionaryData, DictionaryData, DictionaryUpdateInfo } from '@app/classes/dictionary/dictionary-data';
import SocketService from '@app/services/socket-service/socket.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class DictionariesController implements OnDestroy {
    private dictionaryUpdateEvent: Subject<string> = new Subject();
    private dictionaryDownloadEvent: Subject<BasicDictionaryData> = new Subject();
    private dictionaryDeleteEvent: Subject<string> = new Subject();
    private dictionaryUploadEvent: Subject<string> = new Subject();
    private getAllDictionariesEvent: Subject<Map<string, Dictionary>> = new Subject();

    private serviceDestroyed$: Subject<boolean> = new Subject();

    constructor(private http: HttpClient, public socketService: SocketService) {
        this.configureSocket();
    }

    ngOnDestroy(): void {
        this.serviceDestroyed$.next(true);
        this.serviceDestroyed$.complete();
    }

    // change back dictionary when resposne is received to avoid updating a value that shouldn't have been updated
    handleUpdateDictionary(dictionaryUpdateInfo: DictionaryUpdateInfo): void {
        const endpoint = `${environment.serverUrl}/dictionaries`;
        this.http.patch<string>(endpoint, { dictionaryUpdateInfo }).subscribe((response) => {
            this.dictionaryUpdateEvent.next(response);
        });
    }

    handleDownloadDictionary(dictionaryId: string): void {
        const endpoint = `${environment.serverUrl}/dictionaries/${dictionaryId}`;
        this.http.get<{ dictionary: BasicDictionaryData }>(endpoint).subscribe((response) => {
            this.dictionaryDownloadEvent.next(response.dictionary);
        });
    }

    handleDeleteDictionary(dictionaryId: string): void {
        const endpoint = `${environment.serverUrl}/dictionaries`;
        this.http.delete<string>(endpoint, { body: dictionaryId }).subscribe((response) => {
            this.dictionaryDeleteEvent.next(response);
        });
    }

    handleUploadDictionary(dictionaryData: DictionaryData): void {
        const endpoint = `${environment.serverUrl}/dictionaries`;
        this.http.post<string>(endpoint, { dictionaryData }).subscribe((response) => {
            this.dictionaryUploadEvent.next(response);
        });
    }

    handleGetAllDictionariesEvent(): void {
        const endpoint = `${environment.serverUrl}/dictionaries`;
        this.http.post<Map<string, Dictionary>>(endpoint, {}).subscribe((dictionaries) => {
            this.getAllDictionariesEvent.next(dictionaries);
        });
    }

    subscribeToDictionaryUpdateEvent(serviceDestroyed$: Subject<boolean>, callback: (response: string) => void): void {
        this.dictionaryUpdateEvent.pipe(takeUntil(serviceDestroyed$)).subscribe(callback);
    }

    subscribeToDictionaryDownloadEvent(serviceDestroyed$: Subject<boolean>, callback: (dictionaryData: BasicDictionaryData) => void): void {
        this.dictionaryDownloadEvent.pipe(takeUntil(serviceDestroyed$)).subscribe(callback);
    }

    subscribeToDictionaryDeleteEvent(serviceDestroyed$: Subject<boolean>, callback: (response: string) => void): void {
        this.dictionaryDeleteEvent.pipe(takeUntil(serviceDestroyed$)).subscribe(callback);
    }

    subscribeToDictionaryUploadEvent(serviceDestroyed$: Subject<boolean>, callback: (response: string) => void): void {
        this.dictionaryUploadEvent.pipe(takeUntil(serviceDestroyed$)).subscribe(callback);
    }

    subscribeToGetAllDictionariesEvent(serviceDestroyed$: Subject<boolean>, callback: (dictionaries: Map<string, Dictionary>) => void): void {
        this.getAllDictionariesEvent.pipe(takeUntil(serviceDestroyed$)).subscribe(callback);
    }

    private configureSocket(): void {
        this.socketService.on('dictionaryUpdate', (response: string) => {
            this.dictionaryUpdateEvent.next(response);
        });
        this.socketService.on('dictionaryDownload', (dictionaryData: DictionaryData) => {
            this.dictionaryDownloadEvent.next(dictionaryData);
        });
        this.socketService.on('dictionaryDelete', (response: string) => {
            this.dictionaryDeleteEvent.next(response);
        });
        this.socketService.on('dictionaryUpload', (response: string) => {
            this.dictionaryUploadEvent.next(response);
        });
    }
}
