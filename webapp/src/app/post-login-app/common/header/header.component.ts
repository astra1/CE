import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { Apollo } from 'apollo-angular';
import { NEVER, Subject } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { NOTIFICATIONS_SUBSCRIPTION } from 'src/app/core/graphql/subscriptions/notifications.gql';
import { AuthService } from 'src/app/core/services/auth.service';
import { DataCacheService } from 'src/app/core/services/data-cache.service';
import { PermissionGuardService } from 'src/app/core/services/permission-guard.service';
import { SettingsState } from 'src/app/core/store/settings/settings.state';
import { LoggerService } from 'src/app/shared/services/logger.service';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit, OnDestroy {
    showUserInfo = false;
    haveAdminPageAccess = false;
    userName: string;
    userEmail: string;
    profilePictureSrc = '/assets/icons/profile-picture.svg';

    haveNewNotification = false;

    private readonly NOTIFICATIONS_CHANNEL = 'InAppNotification';
    private destroy$ = new Subject<void>();

    constructor(
        private apollo: Apollo,
        private authenticateService: AuthService,
        private dataCacheService: DataCacheService,
        private domSanitizer: DomSanitizer,
        private loggerService: LoggerService,
        private matIconRegistry: MatIconRegistry,
        private permissions: PermissionGuardService,
        private route: ActivatedRoute,
        private router: Router,
        private store: Store,
    ) {
        this.matIconRegistry.addSvgIcon(
            'customSearchIcon',
            this.domSanitizer.bypassSecurityTrustResourceUrl('/assets/icons/header-search.svg'),
        );
    }

    ngOnInit() {
        try {
            this.haveAdminPageAccess = this.permissions.checkAdminPermission();
            this.userName = 'Guest';
            this.userEmail = 'Guest';
            const detailsData = this.dataCacheService.getUserDetailsValue();
            const userNameData = detailsData.getFirstName();
            const emailData = detailsData.getEmail();
            if (userNameData) {
                this.userName = userNameData;
            }
            if (emailData) {
                this.userEmail = emailData;
                this.userName = this.userEmail.split('@')[0].split('.')[0];
            }
        } catch (error) {
            this.loggerService.log('error', 'JS Error' + error);
        }

        this.store
            .select(SettingsState.inAppNotifications)
            .pipe(
                switchMap((enabled) =>
                    enabled
                        ? this.apollo.subscribe({
                              query: NOTIFICATIONS_SUBSCRIPTION,
                              variables: {
                                  name: this.NOTIFICATIONS_CHANNEL,
                              },
                          })
                        : NEVER,
                ),
            )
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => (this.haveNewNotification = true),
                error: (errors: Error[]) =>
                    this.loggerService.log('error', 'GraphQL error: ' + JSON.stringify(errors)),
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    handleSearch() {
        this.router.navigate(['/pl/omnisearch/omni-search-page'], {
            queryParams: this.route.snapshot.queryParams,
        });
    }

    openSettings() {
        this.router.navigate(['/pl', { outlets: { modal: ['user-settings'] } }], {
            queryParamsHandling: 'merge',
        });
    }

    logout() {
        this.authenticateService.doLogout();
    }

    openNotification() {
        if (this.haveNewNotification) {
            this.haveNewNotification = false;
        }
        this.router.navigate(['pl/notifications/notifications-list'], {
            queryParams: this.route.snapshot.queryParams,
        });
    }
}
