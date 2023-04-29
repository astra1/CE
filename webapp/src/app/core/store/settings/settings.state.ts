import { Injectable } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import { SettingsActions } from './settings.actions';

export interface SettingsStateModel {
    inAppNotifications: boolean;
}

@State<SettingsStateModel>({
    name: 'settings',
    defaults: {
        inAppNotifications: true,
    },
})
@Injectable()
export class SettingsState {
    @Selector()
    static inAppNotifications(state: SettingsStateModel) {
        return state.inAppNotifications;
    }

    @Action(SettingsActions.SetInAppNotifications)
    setInAppNotifications(
        { patchState }: StateContext<SettingsStateModel>,
        { payload }: SettingsActions.SetInAppNotifications,
    ) {
        patchState({
            inAppNotifications: payload,
        });
    }
}
