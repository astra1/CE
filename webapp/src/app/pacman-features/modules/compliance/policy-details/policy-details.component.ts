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

import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AssetGroupObservableService } from 'src/app/core/services/asset-group-observable.service';
import { WorkflowService } from 'src/app/core/services/workflow.service';
import { IssueFilterService } from 'src/app/pacman-features/services/issue-filter.service';
import { SelectComplianceDropdown } from 'src/app/pacman-features/services/select-compliance-dropdown.service';
import { ErrorHandlingService } from 'src/app/shared/services/error-handling.service';
import { LoggerService } from 'src/app/shared/services/logger.service';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-policy-details',
    templateUrl: './policy-details.component.html',
    styleUrls: ['./policy-details.component.css'],
    providers: [IssueFilterService, LoggerService, ErrorHandlingService],
})
export class PolicyDetailsComponent implements OnInit, OnDestroy {
    @ViewChild('widget') widgetContainer: ElementRef;

    pageTitle = 'Policy Compliance';
    widgetWidth: number;
    widgetHeight: number;
    breadcrumbArray: any = [];
    breadcrumbLinks: any = [];
    breadcrumbPresent: any;
    complianceDropdowns: any = [];
    searchDropdownData: any = {};
    selectedDD = '';
    currentObj: any = {};
    filterArr: any = [];
    subscriptionToAssetGroup: Subscription;
    selectedAssetGroup: string;
    selectedComplianceDropdown: any;
    ruleID = '';
    setRuleIdObtained = false;
    issueFilterSubscription: Subscription;
    routeSubscription: Subscription;
    errorMessage: string;
    pageLevel = 0;
    backButtonRequired: boolean;

    constructor(
        private assetGroupObservableService: AssetGroupObservableService,
        private selectComplianceDropdown: SelectComplianceDropdown,
        private activatedRoute: ActivatedRoute,
        private router: Router,
        private issueFilterService: IssueFilterService,
        private logger: LoggerService,
        private errorHandling: ErrorHandlingService,
        private workflowService: WorkflowService,
    ) {
        this.subscriptionToAssetGroup = this.assetGroupObservableService
            .getAssetGroup()
            .subscribe((assetGroupName) => {
                this.backButtonRequired = this.workflowService.checkIfFlowExistsCurrently(
                    this.pageLevel,
                );
                this.selectedAssetGroup = assetGroupName;
                this.updateComponent();
            });

        this.selectComplianceDropdown.getCompliance().subscribe((complianceName) => {
            this.selectedComplianceDropdown = complianceName;
        });
    }

    ngOnInit() {
        try {
            const breadcrumbInfo = this.workflowService.getDetailsFromStorage()['level0'];

            if (breadcrumbInfo) {
                this.breadcrumbArray = breadcrumbInfo.map((item) => item.title);
                this.breadcrumbLinks = breadcrumbInfo.map((item) => item.url);
            }
            // gets the current page url,which is used to come back to the same page after navigate
            this.breadcrumbPresent = 'Policy Compliance';
            this.widgetWidth = parseInt(
                window
                    .getComputedStyle(this.widgetContainer.nativeElement, null)
                    .getPropertyValue('width'),
                10,
            );
        } catch (error) {
            this.errorMessage = this.errorHandling.handleJavascriptError(error);
            this.logger.log('error', error);
        }
    }

    updateComponent() {
        this.getRuleId();
        this.getFilters();
    }

    getFilters() {
        if (this.issueFilterSubscription) {
            this.issueFilterSubscription.unsubscribe();
        }
        const queryParams = {
            filterId: 6,
        };
        const issueFilterUrl = environment.issueFilter.url;
        const issueFilterMethod = environment.issueFilter.method;
        this.issueFilterSubscription = this.issueFilterService
            .getFilters(queryParams, issueFilterUrl, issueFilterMethod)
            .subscribe(
                (response) => {
                    try {
                        const filterData = response[0];
                        for (let i = 0; i < filterData.response.length; i++) {
                            this.complianceDropdowns.push(filterData.response[i].optionName);
                        }
                    } catch (e) {
                        this.logger.log('error', e);
                    }
                },
                (error) => {
                    this.logger.log('error', error);
                },
            );
    }

    getRuleId() {
        this.routeSubscription = this.activatedRoute.params.subscribe((params) => {
            this.ruleID = params['ruleID'];
        });
        if (this.ruleID !== undefined) {
            this.setRuleIdObtained = true;
        }
    }
    navigateBack() {
        try {
            this.workflowService.goBackToLastOpenedPageAndUpdateLevel(
                this.router.routerState.snapshot.root,
            );
        } catch (error) {
            this.logger.log('error', error);
        }
    }
    changedDropdown(val) {
        let isFirstDD = false;
        for (let i = 0; i < this.complianceDropdowns.length; i++) {
            if (val.text === this.complianceDropdowns[i]) {
                this.selectedDD = val.text;
                isFirstDD = true;
            }
        }
        if (!isFirstDD) {
            this.currentObj[this.selectedDD] = val.text;
            this.selectedDD = '';
            setTimeout(function () {
                const clear = document.getElementsByClassName('btn btn-xs btn-link pull-right');
                for (let len = 0; len < clear.length; len++) {
                    const element: HTMLElement = clear[len] as HTMLElement;
                    element.click();
                }
            }, 10);
        }

        this.filterArr = [];
        const keyArr = Object.keys(this.currentObj);
        for (let j = 0; j < keyArr.length; j++) {
            const thisObjInstance = {
                key: keyArr[j],
                value: this.currentObj[keyArr[j]],
            };
            this.filterArr.push(thisObjInstance);
        }
        this.selectComplianceDropdown.updateCompliance(this.currentObj);
    }

    removeFilter(obj) {
        delete this.currentObj[obj.array.key];
        this.filterArr.splice(obj.index, 1);
        this.selectComplianceDropdown.updateCompliance(this.currentObj);
    }

    clearAllFilters() {
        this.currentObj = {};
        this.selectComplianceDropdown.updateCompliance(this.currentObj);
        this.filterArr = [];
    }

    ngOnDestroy() {
        try {
            if (this.issueFilterSubscription) {
                this.issueFilterSubscription.unsubscribe();
            }
            if (this.subscriptionToAssetGroup) {
                this.subscriptionToAssetGroup.unsubscribe();
            }
            if (this.routeSubscription) {
                this.routeSubscription.unsubscribe();
            }
        } catch (error) {
            this.logger.log('error', '--- Error while unsubscribing ---');
        }
    }
}
