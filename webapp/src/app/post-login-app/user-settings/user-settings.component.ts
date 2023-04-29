import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { SettingsActions } from 'src/app/core/store/settings/settings.actions';
import { SettingsState } from 'src/app/core/store/settings/settings.state';

@Component({
    selector: 'app-user-settings',
    templateUrl: './user-settings.component.html',
    styleUrls: ['./user-settings.component.css'],
})
export class UserSettingsComponent implements OnInit {
    settingsForm = new FormGroup({
        inAppNotifications: new FormControl(),
    });

    constructor(
        private activatedRoute: ActivatedRoute,
        private router: Router,
        private store: Store,
    ) {}

    ngOnInit(): void {
        this.settingsForm.setValue({
            inAppNotifications: this.store.selectSnapshot(SettingsState.inAppNotifications),
        });
    }

    closeModal() {
        this.router.navigate(
            [
                {
                    outlets: {
                        modal: null,
                    },
                },
            ],
            {
                queryParamsHandling: 'merge',
                relativeTo: this.activatedRoute.parent,
            },
        );

        if (this.settingsForm.dirty) {
            this.store.dispatch(
                new SettingsActions.SetInAppNotifications(
                    this.settingsForm.get('inAppNotifications').value,
                ),
            );
        }
    }
}
