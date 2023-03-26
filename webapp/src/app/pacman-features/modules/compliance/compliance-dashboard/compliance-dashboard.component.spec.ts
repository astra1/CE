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

import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AssetGroupObservableService } from 'src/app/core/services/asset-group-observable.service';
import { DataCacheService } from 'src/app/core/services/data-cache.service';
import { DomainTypeObservableService } from 'src/app/core/services/domain-type-observable.service';
import { WorkflowService } from 'src/app/core/services/workflow.service';
import { IssueFilterService } from 'src/app/pacman-features/services/issue-filter.service';
import { PacmanIssuesService } from 'src/app/pacman-features/services/pacman-issues.service';
import { CommonResponseService } from 'src/app/shared/services/common-response.service';
import { DownloadService } from 'src/app/shared/services/download.service';
import { ErrorHandlingService } from 'src/app/shared/services/error-handling.service';
import { HttpService } from 'src/app/shared/services/http-response.service';
import { LoggerService } from 'src/app/shared/services/logger.service';
import { RefactorFieldsService } from 'src/app/shared/services/refactor-fields.service';
import { UtilsService } from 'src/app/shared/services/utils.service';

import { ComplianceDashboardComponent } from './compliance-dashboard.component';
import { SelectComplianceDropdown } from 'src/app/pacman-features/services/select-compliance-dropdown.service';
import { ToastObservableService } from 'src/app/post-login-app/common/services/toast-observable.service';
import { RouterUtilityService } from 'src/app/shared/services/router-utility.service';
import { of } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TableStateService } from 'src/app/core/services/table-state.service';

describe('ComplianceDashboardComponent', () => {
    let component: ComplianceDashboardComponent;
    let fixture: ComponentFixture<ComplianceDashboardComponent>;
    let fakeCommonResponseService,
        fakePacmanIssuesService,
        fakeIssueFilterService,
        pacmanResponse,
        errorResponse,
        tableResponse,
        pacmanErrorResponse,
        commonResponse,
        commonErrorResponse,
        issueFilterResponse,
        issueFilterErrorResponse;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [
                RouterTestingModule,
                MatSelectModule,
                HttpClientTestingModule,
                MatTableModule,
                BrowserAnimationsModule,
                FormsModule,
                ReactiveFormsModule,
            ],
            declarations: [ComplianceDashboardComponent],
            providers: [
                CommonResponseService,
                AssetGroupObservableService,
                LoggerService,
                ErrorHandlingService,
                WorkflowService,
                DomainTypeObservableService,
                PacmanIssuesService,
                ErrorHandlingService,
                UtilsService,
                RefactorFieldsService,
                DownloadService,
                IssueFilterService,
                DataCacheService,
                HttpService,
                SelectComplianceDropdown,
                TableStateService,
                ToastObservableService,
                RouterUtilityService,
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ComplianceDashboardComponent);
        component = fixture.componentInstance;
        component['domainObservableService'].updateDomainType('Infra Platforms', 'key123');
        component['assetGroupObservableService'].updateAssetGroup('aws');
        fakePacmanIssuesService = fixture.debugElement.injector.get(PacmanIssuesService);
        fakeIssueFilterService = fixture.debugElement.injector.get(IssueFilterService);

        pacmanResponse = {
            totalIssues: 162,
            severity: [
                {
                    critical: 35,
                },
                {
                    high: 117,
                },
                {
                    medium: 9,
                },
                {
                    low: 1,
                },
            ],
            category: [
                {
                    tagging: 12,
                },
                {
                    security: 88,
                },
            ],
            valuePercent: 21.604938271604937,
        };

        pacmanErrorResponse = {
            totalIssues: 0,
            severity: [],
            category: [],
            valuePercent: 0,
        };

        commonErrorResponse = {
            data: {
                response: [],
            },
        };

        commonResponse = {
            data: {
                total: 2,
                response: [
                    {
                        severity: 'low',
                        name: 'Assign Standard Region to Resource',
                        compliance_percent: 0.0,
                        lastScan: '2023-03-24T09:46:20.190Z',
                        policyCategory: 'operations',
                        resourcetType: 'subnet',
                        provider: 'aws',
                        policyId:
                            'NonStandardRegionRule_version-1_version-1_SubnetWithNonStandardRegion_subnet',
                        assetsScanned: 62,
                        passed: 0,
                        failed: 62,
                        contribution_percent: 0.0,
                        autoFixEnabled: 'false',
                        exempted: 0,
                        isAssetsExempted: false,
                    },
                    {
                        severity: 'high',
                        name: 'Assign Mandatory Tags to Subnets',
                        compliance_percent: 0.0,
                        lastScan: '2023-03-24T09:45:50.175Z',
                        policyCategory: 'tagging',
                        resourcetType: 'subnet',
                        provider: 'aws',
                        policyId: 'TaggingRule_version-1_SubnetTaggingRule_subnet',
                        assetsScanned: 62,
                        passed: 0,
                        failed: 62,
                        contribution_percent: 0.0,
                        autoFixEnabled: 'false',
                        exempted: 0,
                        isAssetsExempted: false,
                    },
                ],
            },
        };

        issueFilterResponse = {
            data: {
                response: [
                    {
                        optionName: 'Resource Type',
                        optionValue: 'targetType.keyword',
                        optionURL: '/compliance/v1/filters/targettype?ag=aws',
                    },
                ],
            },
            message: 'success',
        };

        errorResponse = {
            err: 'Error in Fetching Data',
        };
        fakeCommonResponseService = fixture.debugElement.injector.get(CommonResponseService);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('renders violation cards', () => {
        const { debugElement } = fixture;
        const violationCards = debugElement.query(By.css('app-violations-card'));
        expect(violationCards).toBeTruthy();
    });

    it('renders card', () => {
        const { debugElement } = fixture;
        const cards = debugElement.query(By.css('app-card'));
        expect(cards).toBeTruthy();
    });

    it('should tell ROUTER to navigate when row clicked', fakeAsync(() => {
        const router = TestBed.inject(Router);
        const activatedRoute = TestBed.inject(ActivatedRoute);
        spyOn(router, 'navigate').and.stub();
        const row = {
            rowSelected: {
                autofixEnabled: false,
                'Policy ID': {
                    valueText:
                        'NonStandardRegionRule_version-1_version-1_SubnetWithNonStandardRegion_subnet',
                },
            },
        };
        component.goToDetails(row);
        const queryParams = {
            searchValue: undefined,
        };
        tick();
        expect(router.navigate).toHaveBeenCalledWith(
            ['../policy-details', row.rowSelected['Policy ID'].valueText],
            {
                relativeTo: activatedRoute,
                queryParams: queryParams,
                queryParamsHandling: 'merge',
            },
        );
    }));

    it('should open overall compliance Trend modal on button click', fakeAsync(() => {
        const router = TestBed.inject(Router);
        spyOn(router, 'navigate').and.stub();
        component.openOverAllComplianceTrendModal();
        expect(router.navigate).toHaveBeenCalledWith(
            ['/pl', { outlets: { modal: ['overall-compliance-trend'] } }],
            { queryParamsHandling: 'merge' },
        );
    }));

    it('should open overall Policy Violations Trend modal on button click', fakeAsync(() => {
        const router = TestBed.inject(Router);
        spyOn(router, 'navigate').and.stub();
        component.openOverAllPolicyViolationsTrendModal();
        expect(router.navigate).toHaveBeenCalledWith(
            ['/pl', { outlets: { modal: ['policy-violations-trend'] } }],
            { queryParamsHandling: 'merge' },
        );
    }));

    it('should navigate to Asset Summary Page on view all Assets button click', fakeAsync(() => {
        const router = TestBed.inject(Router);
        spyOn(router, 'navigate').and.stub();
        component.navigateToAssetDistribution();
        expect(router.navigate).toHaveBeenCalledWith(['/pl/assets/asset-distribution/'], {
            queryParamsHandling: 'merge',
        });
    }));

    it('should subscribe and get data from CommonResponseService ', () => {
        spyOn(fakeCommonResponseService, 'getData').and.returnValue(of(commonResponse));
        component.getData();
        expect(fakeCommonResponseService.getData).toHaveBeenCalled;
    });

    it('should subscribe and get data from pacmanIssueService', () => {
        spyOn(fakePacmanIssuesService, 'getData').and.returnValue(of(pacmanResponse));
        component.getPacmanIssues();
        expect(fakePacmanIssuesService.getData).toHaveBeenCalled();
    });

    it('shoud throw an error if response contains error', () => {
        spyOn(fakePacmanIssuesService, 'getData').and.returnValue(of(errorResponse));
        const errorHandlingService = TestBed.inject(ErrorHandlingService);
        spyOn(errorHandlingService, 'handleJavascriptError').and.returnValue('jsError');
        component.getPacmanIssues();
        expect(component.policyDataError).toBe('apiResponseError');
        expect(component.getErrorValues).toHaveBeenCalled;
    });

    it('should update Url', () => {
        const event = {
            headerColName: 'a',
            direction: 'b',
        };
        component.handleHeaderColNameSelection(event);
        expect(event.headerColName).toEqual(component.headerColName);
        expect(event.direction).toEqual(component.direction);
        expect(component.getUpdatedUrl).toHaveBeenCalled;
    });

    it('shoud call updateUrl on if the searchTxt is not empty', () => {
        component.callNewSearch('admin');
        expect(component.searchTxt).toEqual('admin');
        expect(component.getUpdatedUrl).toHaveBeenCalled;
    });

    it('should updateUrl on calling callNewSearch', () => {
        component.callNewSearch('something');
        expect(component.getUpdatedUrl).toHaveBeenCalled;
    });

    // disabled due changed implementation
    xit('should have 0 total rows when the complianceTableData length is 0', () => {
        spyOn(fakeCommonResponseService, 'getData').and.returnValue(of(commonErrorResponse));
        component.getData();
        expect(component.totalRows).toEqual(0);
    });

    it('should set policyData with dataValue if datavalue length more than 0', () => {
        spyOn(fakePacmanIssuesService, 'getData').and.returnValue(of(pacmanResponse));
        component.getPacmanIssues();
        const expectedPolicyData = [35, 117, 9, 1];
        expect(component.policyData.data).toEqual(expectedPolicyData);
    });

    it('should set policyDataError with noDataAvailable if datavalue length less than 1', () => {
        spyOn(fakePacmanIssuesService, 'getData').and.returnValue(of(pacmanErrorResponse));
        component.getPacmanIssues();
        expect(component.policyDataError).toEqual('noDataAvailable');
    });

    it('should set breakpoints on resize', () => {
        const event = {
            target: {
                innerWidth: 500,
            },
        };
        component.onresize(event);

        expect(component.breakpoint1).toBe(2);
        expect(component.breakpoint2).toBe(1);
    });

    it('should get date', () => {
        const date = '2022-09-15T16:27:12.574Z';
        const expectedDate = '09-15-2022';
        const returnedDate = component.calculateDate(date);
        expect(returnedDate).toBe(expectedDate);
        const date2 = '2022-11-01T16:27:12.574Z';
        const expectedDate2 = '11-01-2022';
        const returnedDate2 = component.calculateDate(date2);
        expect(returnedDate2).toBe(expectedDate2);
    });

    it('should get filtersType and filterLabels', () => {
        spyOn(fakeIssueFilterService, 'getFilters').and.returnValue(
            of(issueFilterResponse.data.response),
        );
        component.getFilters();
        expect(fakeIssueFilterService.getFilters).toHaveBeenCalled;
    });
});
