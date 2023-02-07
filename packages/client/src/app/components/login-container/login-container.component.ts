import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SNACK_BAR_ERROR_DURATION } from '@app/constants/dictionaries-components';
import { UserLoginCredentials } from '@common/models/user';

@Component({
    selector: 'app-login-container',
    templateUrl: './login-container.component.html',
    styleUrls: ['./login-container.component.scss'],
})
export class LoginContainerComponent implements OnChanges {
    @Input() errorMessage?: string = undefined;
    @Output() login: EventEmitter<UserLoginCredentials> = new EventEmitter();

    loginForm: FormGroup;
    isPasswordShown: boolean = false;

    constructor(private readonly snackBar: MatSnackBar) {
        this.loginForm = new FormGroup({
            email: new FormControl('', [Validators.required]),
            password: new FormControl('', [Validators.required]),
        });
    }

    ngOnChanges(): void {
        this.handleInvalidCredentials();
    }

    onSubmit(): void {
        this.clearErrorMessage();

        if (this.loginForm.invalid) return;

        const userCredentials: UserLoginCredentials = {
            email: this.loginForm.get('email')?.value,
            password: this.loginForm.get('password')?.value,
        };

        this.login.next(userCredentials);
    }

    clearErrorMessage(): void {
        this.errorMessage = undefined;
        this.handleInvalidCredentials();
    }

    private handleInvalidCredentials(): void {
        if (this.errorMessage) {
            this.snackBar.open(this.errorMessage, 'OK', { duration: SNACK_BAR_ERROR_DURATION, panelClass: ['error'] });
            this.loginForm.controls.email?.setErrors({ errors: true });
            this.loginForm.controls.password?.setErrors({ errors: true });

            this.loginForm.updateValueAndValidity();
        } else {
            this.loginForm.controls.email?.updateValueAndValidity();
            this.loginForm.controls.password?.updateValueAndValidity();
        }
    }
}
