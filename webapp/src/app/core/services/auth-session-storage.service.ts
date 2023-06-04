/*
 *Copyright 2018 T Mobile, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); You may not use
 * this file except in compliance with the License. A copy of the License is located at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * or in the "license" file accompanying this file. This file is distributed on
 * an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or
 * implied. See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Injectable } from '@angular/core';
import { LoggerService } from 'src/app/shared/services/logger.service';
import { DataCacheService } from './data-cache.service';

@Injectable()
export class AuthSessionStorageService {
    constructor(private dataStore: DataCacheService, private loggerService: LoggerService) {}

    saveUserDetails(fetchedResult) {
        this.dataStore.setCurrentUserLoginDetails(JSON.stringify(fetchedResult));
        this.dataStore.setUserDefaultAssetGroup(fetchedResult.userInfo.defaultAssetGroup);

        const email = this.dataStore.getUserDetailsValue().getEmail() || 'guestUser';

        crypto.subtle.digest('SHA-256', new TextEncoder().encode(email)).then((res) => {
            const hashedArray = Array.from(new Uint8Array(res));
            const hashedEmail = hashedArray.map((b) => b.toString(16).padStart(2, '0')).join('');
            this.dataStore.setHashedIdOfUser(hashedEmail);

            // Below local storage key is added and removed to
            // transfer storage to other tabs on successful login */
            localStorage.setItem('loginsuccess', '.');
            localStorage.removeItem('loginsuccess');
        });
    }
}
