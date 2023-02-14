import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from '@app/services/authentication-service/authentication.service';
import { UserService } from '@app/services/user-service/user.service';
import { PublicUser } from '@common/models/user';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
    selector: 'app-page-header',
    templateUrl: './page-header.component.html',
    styleUrls: ['./page-header.component.scss'],
})
export class PageHeaderComponent {
    @Input() hideBackButton: boolean = false;
    @Input() title: string;
    @Input() button: string = '';
    @Input() buttonRoute: string = '/';
    user: Observable<PublicUser | undefined>;
    username: Observable<string | undefined>;
    avatar: Observable<string | undefined>;

    constructor(
        private readonly userService: UserService,
        private readonly authenticationService: AuthenticationService,
        private readonly router: Router,
    ) {
        this.user = this.userService.user;
        this.username = this.userService.user.pipe(map((u) => u?.username));
        this.avatar = this.userService.user.pipe(map((u) => u?.avatar));
    }

    signOut() {
        this.authenticationService.signOut();
        this.router.navigate(['/login']);
    }
}
