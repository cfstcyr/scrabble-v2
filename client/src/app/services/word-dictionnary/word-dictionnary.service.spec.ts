import { TestBed } from '@angular/core/testing';
import { WordDictionnaryService } from '@app/services';

describe('WordDictionnaryService', () => {
    let service: WordDictionnaryService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(WordDictionnaryService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
