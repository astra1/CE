export namespace SettingsActions {
    export class SetInAppNotifications {
        static readonly type = '[Settings] Set In-App Notifications';
        constructor(public payload: boolean) {}
    }
}
