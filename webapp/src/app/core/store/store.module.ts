import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { NgxsReduxDevtoolsPluginModule } from '@ngxs/devtools-plugin';
import { NgxsLoggerPluginModule } from '@ngxs/logger-plugin';
import { NgxsStoragePluginModule } from '@ngxs/storage-plugin';
import { NgxsModule } from '@ngxs/store';
import { SettingsState } from './settings/settings.state';
import { DEVTOOLS_REDUX_CONFIG, LOGGER_CONFIG, OPTIONS_CONFIG, STATES } from './store.config';

@NgModule({
    imports: [
        CommonModule,
        NgxsModule.forRoot(STATES, OPTIONS_CONFIG),
        NgxsStoragePluginModule.forRoot({
            namespace: 'ngxs',
            key: [SettingsState],
        }),
        NgxsReduxDevtoolsPluginModule.forRoot(DEVTOOLS_REDUX_CONFIG),
        NgxsLoggerPluginModule.forRoot(LOGGER_CONFIG),
    ],
    exports: [NgxsModule],
})
export class NgxsStoreModule {}
