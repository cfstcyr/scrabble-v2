import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NameFieldComponent } from './name-field.component';
import { NAME_TOO_SHORT, NAME_TOO_LONG, NAME_NO_MATCH_REGEX } from '@app/constants/name-field';

const fakeNameChange = () => {
    return false;
};

describe('NameFieldComponent', () => {
    let component: NameFieldComponent;
    let fixture: ComponentFixture<NameFieldComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [NameFieldComponent],
            imports: [BrowserAnimationsModule, FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(NameFieldComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('onNameChange should change the playerName', () => {
        const expected = 'ThOm';
        component.playerName = 'Charles';
        component.onNameChange(expected);
        expect(component.playerName).toBe(expected);
    });

    it('onNameChange should emit isInputNameValid true with a valid name', () => {
        const spy = spyOn(component.isInputNameValid, 'emit').and.callFake(fakeNameChange);
        component.formParameters.patchValue({ inputName: 'testName' });
        component.onNameChange('testName');
        expect(spy).toHaveBeenCalled();
        expect(component.isInputNameValid.emit).toHaveBeenCalledWith(true);
    });

    it('onNameChange should emit isInputNameValid false with an invalid name', () => {
        const spy = spyOn(component.isInputNameValid, 'emit').and.callFake(fakeNameChange);
        component.formParameters.patchValue({ inputName: '!nval!dName' });
        component.onNameChange('!nval!dName');
        expect(spy).toHaveBeenCalled();
        expect(component.isInputNameValid.emit).toHaveBeenCalledWith(false);
    });
    // Html add a space on each side as it is the only text in the <mat-error> tag
    const MESSAGE_NAME_TOO_SHORT = ' ' + NAME_TOO_SHORT + ' ';
    const MESSAGE_NAME_TOO_LONG = ' ' + NAME_TOO_LONG + ' ';
    const MESSAGE_NAME_NO_MATCH_REGEX = ' ' + NAME_NO_MATCH_REGEX + ' ';
    const expectedMessage = [
        MESSAGE_NAME_TOO_SHORT,
        MESSAGE_NAME_TOO_LONG,
        MESSAGE_NAME_NO_MATCH_REGEX,
        MESSAGE_NAME_TOO_SHORT,
        MESSAGE_NAME_TOO_LONG,
        MESSAGE_NAME_NO_MATCH_REGEX,
        MESSAGE_NAME_NO_MATCH_REGEX,
    ];
    const inputNames = ['a', 'abcdefghijklmnopqrstuvwxyz', '#sp!cy  name', '#', '!@#$%^&*()!@#$%^&*()!@#$%^&*', ' Michel', 'Michel  Gagnon'];
    const testedCase = [
        'too short',
        'too long',
        'special characters',
        ' too short and does not match regex',
        ' too long and does not match regex',
        'starting with a space',
        '2 spaces in a row',
    ];
    for (let i = 0; i < expectedMessage.length; i++) {
        it(`an Invalid Name should be display the correct error message (${testedCase[i]})`, () => {
            fixture.whenStable().then(() => {
                component.formParameters.get('inputName')?.setValue(inputNames[i]);
                component.formParameters.get('inputName')?.markAsDirty();
                fixture.detectChanges();
                const errorMessage = fixture.debugElement.query(By.css('.alert'));
                expect(errorMessage).toBeTruthy();
                expect(errorMessage.nativeElement.innerHTML).toBe(expectedMessage[i]);
            });
        });
    }
    it('a valid Name should not display an error message', () => {
        fixture.whenStable().then(() => {
            component.formParameters.get('inputName')?.setValue('Michel');
            component.formParameters.get('inputName')?.markAsDirty();
            fixture.detectChanges();
            const errorMessage = fixture.debugElement.query(By.css('.alert'));
            expect(errorMessage).toBeFalsy();
        });
    });
});
