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

import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { AssetGroupObservableService } from 'src/app/core/services/asset-group-observable.service';
import { DomainTypeObservableService } from 'src/app/core/services/domain-type-observable.service';
import { TableStateService } from 'src/app/core/services/table-state.service';
import { WorkflowService } from 'src/app/core/services/workflow.service';
import { CommonResponseService } from 'src/app/shared/services/common-response.service';
import { DownloadService } from 'src/app/shared/services/download.service';
import { ErrorHandlingService } from 'src/app/shared/services/error-handling.service';
import { LoggerService } from 'src/app/shared/services/logger.service';
import { RefactorFieldsService } from 'src/app/shared/services/refactor-fields.service';
import { UtilsService } from 'src/app/shared/services/utils.service';
import { environment } from 'src/environments/environment';
import { IssueFilterService } from '../../services/issue-filter.service';

@Component({
    selector: 'app-all-policy-violations',
    templateUrl: './all-policy-violations.component.html',
    styleUrls: ['./all-policy-violations.component.css'],
    providers: [CommonResponseService, IssueFilterService],
})
export class AllPolicyViolationsComponent implements OnInit, OnDestroy {
    @Input() breadcrumbPresent;
    @Input() pageLevel = 0;
    @Input() ruleID: string;

    allColumns: any;

    whitelistColumns: string[];

    filterTypeLabels = [];
    filterTagLabels = {};
    filterTypeOptions = {};
    filters = [];

    selectedAssetGroup: string;
    selectedDomain: string;
    errorMessage: string;
    tableHeaderData: any;
    totalRows = 0;
    bucketNumber = 0;
    tableDataLoaded = false;
    paginatorSize = 10;
    searchTxt = '';
    errorValue = 0;
    showGenericMessage = false;
    pageTitle = 'Policy Violations';
    headerColName;
    direction: string;

    onScrollDataLoaded = new Subject<any[]>();

    private subscriptionToAssetGroup: Subscription;
    private domainSubscription: Subscription;
    private dataSubscription: Subscription;
    columnWidths: { [key: string]: number } = {
        'Policy Name': 2,
        'Issue ID': 1,
        'Resource ID': 1,
        Severity: 1,
        Category: 1,
    };
    tableScrollTop: number;
    tableData: any[];

    constructor(
        private activatedRoute: ActivatedRoute,
        private assetGroupObservableService: AssetGroupObservableService,
        private commonResponseService: CommonResponseService,
        private domainObservableService: DomainTypeObservableService,
        private downloadService: DownloadService,
        private errorHandling: ErrorHandlingService,
        private filtersService: IssueFilterService,
        private logger: LoggerService,
        private refactorFieldsService: RefactorFieldsService,
        private router: Router,
        private tableStateService: TableStateService,
        private utils: UtilsService,
        private workflowService: WorkflowService,
    ) {
        this.headerColName = this.activatedRoute.snapshot.queryParams.headerColName;
        this.direction = this.activatedRoute.snapshot.queryParams.direction;
        this.bucketNumber = this.activatedRoute.snapshot.queryParams.bucketNumber || 0;

        this.subscriptionToAssetGroup = this.assetGroupObservableService
            .getAssetGroup()
            .subscribe((assetGroupName) => {
                this.selectedAssetGroup = assetGroupName;
            });

        this.domainSubscription = this.domainObservableService
            .getDomainType()
            .subscribe((domain) => {
                this.selectedDomain = domain;
                this.updateComponent();
            });
    }

    ngOnInit() {
        const state = this.tableStateService.getState('all-policy-violations');
        this.whitelistColumns = state?.whiteListColumns || Object.keys(this.columnWidths);
        this.getFilters();
    }

    getFilters() {
        const filterId = 9;
        this.filtersService
            .getFilters(
                {
                    filterId,
                    domain: this.selectedDomain,
                },
                environment.issueFilter.url,
                environment.issueFilter.method,
            )
            .subscribe((response) => {});
        this.updateComponent();
    }

    handleHeaderColNameSelection(event) {
        this.headerColName = event.headerColName;
        this.direction = event.direction;
        this.getUpdatedUrl();
    }

    getUpdatedUrl() {
        let updatedQueryParams = {};
        updatedQueryParams = {
            headerColName: this.headerColName,
            direction: this.direction,
            bucketNumber: this.bucketNumber,
        };

        this.router.navigate([], {
            relativeTo: this.activatedRoute,
            queryParams: updatedQueryParams,
            queryParamsHandling: 'merge',
        });
    }

    updateComponent() {
        /* All functions variables which are required to be set for component to be reloaded should go here */
        this.tableData = [];
        this.searchTxt = '';
        this.tableDataLoaded = false;
        this.errorValue = 0;
        this.showGenericMessage = false;
        this.getAllPatchingDetails();
    }

    downloadTableData(rowText) {
        const fileType = 'csv';

        try {
            const queryParams = {
                fileFormat: 'csv',
                serviceId: 1,
                fileType: fileType,
            };

            const downloadRequest = {
                ag: this.selectedAssetGroup,
                filter: { 'policyId.keyword': this.ruleID, domain: this.selectedDomain },
                from: 0,
                searchtext: this.searchTxt,
                size: this.totalRows,
            };

            const downloadUrl = environment.download.url;
            const downloadMethod = environment.download.method;

            this.downloadService.requestForDownload(
                queryParams,
                downloadUrl,
                downloadMethod,
                downloadRequest,
                this.pageTitle,
                this.totalRows,
            );
        } catch (error) {
            this.logger.log('error', error);
        }
    }

    getAllPatchingDetails(isNextPageCalled = false) {
        if (!this.ruleID) {
            return;
        }

        const payload = {
            ag: this.selectedAssetGroup,
            filter: { 'policyId.keyword': this.ruleID, domain: this.selectedDomain },
            from: this.bucketNumber * this.paginatorSize,
            searchtext: this.searchTxt,
            size: this.paginatorSize,
        };
        this.errorValue = 0;
        const policyViolationUrl = environment.policyViolation.url;
        const policyViolationMethod = environment.policyViolation.method;

        if (this.dataSubscription) {
            this.dataSubscription.unsubscribe();
        }

        this.dataSubscription = this.commonResponseService
            .getData(policyViolationUrl, policyViolationMethod, payload, {})
            .subscribe(
                (response) => {
                    this.showGenericMessage = false;
                    try {
                        if (!isNextPageCalled) {
                            this.tableData = [];
                        }
                        this.errorValue = 1;
                        this.tableDataLoaded = true;
                        this.totalRows = response.data.total;

                        const updatedResponse = this.massageData(response.data.response);
                        const processedData = this.processData(updatedResponse);

                        if (isNextPageCalled) {
                            this.onScrollDataLoaded.next(processedData);
                        } else {
                            this.tableData = processedData;
                        }
                    } catch (e) {
                        this.errorValue = 0;
                        this.errorMessage = this.errorHandling.handleJavascriptError(e);
                        this.getErrorValues();
                    }
                },
                (error) => {
                    this.showGenericMessage = true;
                    this.tableData = [];
                    this.errorMessage = error;
                    this.getErrorValues();
                },
            );
    }

    getErrorValues(): void {
        this.errorValue = -1;
        this.totalRows = 0;
    }

    massageData(data) {
        /*
         * added by Trinanjan 14/02/2017
         * the funciton replaces keys of the table header data to a readable format
         */
        const refactoredService = this.refactorFieldsService;
        const newData = [];
        data.map(function (rowObj) {
            const KeysTobeChanged = Object.keys(rowObj);
            let newObj = {};
            KeysTobeChanged.forEach((element) => {
                const elementnew =
                    refactoredService.getDisplayNameForAKey(element.toLocaleLowerCase()) || element;
                newObj = Object.assign(newObj, { [elementnew]: rowObj[element] });
            });
            newData.push(newObj);
        });
        return newData;
    }

    processData(data) {
        let innerArr = {};
        const totalVariablesObj = {};
        let cellObj = {};
        const getData = data;
        let processedData = [];

        const getCols = Object.keys(getData[0]);

        for (let row = 0; row < getData.length; row++) {
            innerArr = {};
            for (let col = 0; col < getCols.length; col++) {
                const cellData = getData[row][getCols[col]];
                if (
                    getCols[col].toLowerCase() === '_resourceid' ||
                    getCols[col].toLowerCase() === 'resourceid' ||
                    getCols[col].toLowerCase() === 'resource id'
                ) {
                    cellObj = {
                        isLink: true,
                        hasPreImg: false,
                        imgLink: '',
                        valueText: cellData,
                        titleText: cellData,
                        text: cellData,
                    };
                } else if (
                    getCols[col].toLowerCase() === 'issue id' ||
                    getCols[col].toLowerCase() === 'issueid' ||
                    getCols[col].toLowerCase() === 'policy name'
                ) {
                    cellObj = {
                        isLink: true,
                        hasPreImg: false,
                        imgLink: '',
                        valueText: cellData,
                        titleText: cellData,
                        text: cellData,
                    };
                } else if (
                    getCols[col].toLowerCase() === 'created on' ||
                    getCols[col].toLowerCase() === 'modified on'
                ) {
                    cellObj = {
                        isLink: false,
                        hasPreImg: false,
                        imgLink: '',
                        text: this.utils.calculateDateAndTime(cellData),
                        valText: this.utils.calculateDateAndTime(cellData),
                    };
                } else {
                    cellObj = {
                        isLink: false,
                        hasPreImg: false,
                        imgLink: '',
                        text: cellData,
                        valueText: cellData,
                        titleText: cellData,
                    };
                }

                innerArr[getCols[col]] = cellObj;
                totalVariablesObj[getCols[col]] = '';
            }
            processedData.push(innerArr);
        }
        if (processedData.length > getData.length) {
            const halfLength = processedData.length / 2;
            processedData = processedData.splice(halfLength);
        }
        this.allColumns = Object.keys(totalVariablesObj);
        return processedData;
    }

    goToDetails(row) {
        try {
            const rowName = row.col.toLowerCase();
            const selectedRow = row.rowSelected;
            let routeCommands = [];

            switch (rowName) {
                case 'resource id':
                    routeCommands = [
                        '/pl/assets/asset-list',
                        selectedRow['Asset Type'].text,
                        encodeURIComponent(selectedRow['Resource ID'].text),
                    ];
                    break;

                case 'issue id':
                case 'issueid':
                    routeCommands = [
                        '/pl/compliance/issue-listing/issue-details',
                        selectedRow['Issue ID'].text,
                    ];
                    break;

                case 'policy name':
                    routeCommands = [
                        '/pl/compliance/policy-knowledgebase-details',
                        selectedRow.nonDisplayableAttributes.text.PolicyId,
                        'false',
                    ];
                    break;

                default:
                    return;
            }

            this.workflowService.addRouterSnapshotToLevel(
                this.router.routerState.snapshot.root,
                0,
                this.breadcrumbPresent,
            );

            const updatedQueryParams = {
                ...this.activatedRoute.snapshot.queryParams,
                ...{
                    headerColName: undefined,
                    direction: undefined,
                    bucketNumber: undefined,
                    searchValue: undefined,
                },
            };

            this.router.navigate(routeCommands, {
                relativeTo: this.activatedRoute,
                queryParams: updatedQueryParams,
                queryParamsHandling: 'merge',
            });
        } catch (error) {
            this.errorMessage = this.errorHandling.handleJavascriptError(error);
            this.logger.log('error', error);
        }
    }

    nextPg(event: number) {
        this.tableScrollTop = event;
        this.bucketNumber++;
        this.getAllPatchingDetails(true);
        this.getUpdatedUrl();
    }

    searchCalled(search) {
        this.searchTxt = search;
    }

    callNewSearch() {
        this.bucketNumber = 0;
        this.getAllPatchingDetails();
    }

    ngOnDestroy() {
        try {
            this.subscriptionToAssetGroup.unsubscribe();
            this.domainSubscription.unsubscribe();
            this.dataSubscription.unsubscribe();
        } catch (error) {
            this.errorMessage = this.errorHandling.handleJavascriptError(error);
            this.getErrorValues();
        }
    }
}
