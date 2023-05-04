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

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AssetGroupObservableService } from 'projects/pacman-spa/src/app/core/services/asset-group-observable.service';
import { DataCacheService } from 'projects/pacman-spa/src/app/core/services/data-cache.service';
import { WorkflowService } from 'projects/pacman-spa/src/app/core/services/workflow.service';
import { OverallVulnerabilitiesComponent } from 'projects/pacman-spa/src/app/pacman-features/secondary-components/overall-vulnerabilities/overall-vulnerabilities.component';
import { VulnerabilityAcrossApplicationComponent } from 'projects/pacman-spa/src/app/pacman-features/secondary-components/vulnerability-across-application/vulnerability-across-application.component';
import { VulnerabilityAssetsTrendComponent } from 'projects/pacman-spa/src/app/pacman-features/secondary-components/vulnerability-assets-trend/vulnerability-assets-trend.component';
import { VulnerabilityIssueComponent } from 'projects/pacman-spa/src/app/pacman-features/secondary-components/vulnerability-issue/vulnerability-issue.component';
import { SelectComplianceDropdown } from 'projects/pacman-spa/src/app/pacman-features/services/select-compliance-dropdown.service';
import { BackNavigationComponent } from 'projects/pacman-spa/src/app/shared/back-navigation/back-navigation.component';
import { ErrorMessageComponent } from 'projects/pacman-spa/src/app/shared/error-message/error-message.component';
import { CommonResponseService } from 'projects/pacman-spa/src/app/shared/services/common-response.service';
import { ErrorHandlingService } from 'projects/pacman-spa/src/app/shared/services/error-handling.service';
import { HttpService } from 'projects/pacman-spa/src/app/shared/services/http-response.service';
import { LoggerService } from 'projects/pacman-spa/src/app/shared/services/logger.service';
import { RefactorFieldsService } from 'projects/pacman-spa/src/app/shared/services/refactor-fields.service';
import { RouterUtilityService } from 'projects/pacman-spa/src/app/shared/services/router-utility.service';
import { UtilsService } from 'projects/pacman-spa/src/app/shared/services/utils.service';
import { TitleBurgerHeadComponent } from 'projects/pacman-spa/src/app/shared/title-burger-head/title-burger-head.component';

import { VulnerabilitiesComplianceComponent } from './vulnerabilities-compliance.component';

describe('VulnerabilitiesComplianceComponent', () => {
  let component: VulnerabilitiesComplianceComponent;
  let fixture: ComponentFixture<VulnerabilitiesComplianceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      declarations: [
        VulnerabilitiesComplianceComponent,
        BackNavigationComponent,
        ErrorMessageComponent,
        OverallVulnerabilitiesComponent,
        TitleBurgerHeadComponent,
        VulnerabilityAcrossApplicationComponent,
        VulnerabilityAssetsTrendComponent,
        VulnerabilityIssueComponent,
      ],
      providers: [
        AssetGroupObservableService,
        CommonResponseService,
        DataCacheService,
        ErrorHandlingService,
        HttpService,
        LoggerService,
        RefactorFieldsService,
        RouterUtilityService,
        SelectComplianceDropdown,
        UtilsService,
        WorkflowService,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VulnerabilitiesComplianceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
