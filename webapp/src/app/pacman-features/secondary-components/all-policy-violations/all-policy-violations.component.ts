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
import { Subscription } from 'rxjs';
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
import { AutorefreshService } from '../../services/autorefresh.service';

@Component({
    selector: 'app-all-policy-violations',
    templateUrl: './all-policy-violations.component.html',
    styleUrls: ['./all-policy-violations.component.css'],
    providers: [CommonResponseService, AutorefreshService],
})
export class AllPolicyViolationsComponent implements OnInit, OnDestroy {
    @Input() breadcrumbPresent;
    @Input() pageLevel = 0;
    @Input() ruleID: any;

    outerArr: any;
    allColumns: any;

    whitelistColumns: string[];

    selectedAssetGroup: string;
    selectedDomain: string;
    apiData: any;
    applicationValue: any;
    errorMessage: any;
    dataComing = true;
    showLoader = true;
    tableHeaderData: any;
    seekdata = false;
    durationParams: any;
    autoRefresh: boolean;
    totalRows = 0;
    bucketNumber = 0;
    popRows: any = ['Download Data'];
    dataTableData: any = [];
    tableDataLoaded = false;
    currentBucket: any = [];
    paginatorSize = 10;
    firstPaginator = 1;
    lastPaginator: number;
    currentPointer = 0;
    searchTxt = '';
    errorValue = 0;
    showGenericMessage = false;
    pageTitle = 'List of Violations';
    headerColName;
    direction;

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

    constructor(
        private activatedRoute: ActivatedRoute,
        private assetGroupObservableService: AssetGroupObservableService,
        private autorefreshService: AutorefreshService,
        private commonResponseService: CommonResponseService,
        private domainObservableService: DomainTypeObservableService,
        private downloadService: DownloadService,
        private errorHandling: ErrorHandlingService,
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

        this.durationParams = this.autorefreshService.getDuration();
        this.durationParams = parseInt(this.durationParams, 10);
        this.autoRefresh = this.autorefreshService.autoRefresh;
    }

    ngOnInit() {
        const state = this.tableStateService.getState('all-policy-violations');
        this.whitelistColumns = state?.whiteListColumns || Object.keys(this.columnWidths);
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
        this.outerArr = [];
        this.searchTxt = '';
        this.currentBucket = [];
        // this.bucketNumber = 0;
        this.firstPaginator = 1;
        // this.currentPointer = 0;
        this.dataTableData = [];
        this.tableDataLoaded = false;
        this.showLoader = true;
        this.dataComing = false;
        this.seekdata = false;
        this.errorValue = 0;
        this.showGenericMessage = false;
        this.getData();
    }

    getData() {
        /* All functions to get data should go here */
        this.getAllPatchingDetails();
    }

    handlePopClick(rowText) {
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

    getAllPatchingDetails() {
        /* comment ends here */
        if (this.ruleID !== undefined) {
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
                            this.errorValue = 1;
                            this.tableDataLoaded = true;
                            this.showLoader = false;
                            this.seekdata = false;
                            this.dataTableData = response.data.response;
                            this.dataComing = true;
                            this.totalRows = response.data.total;
                            this.firstPaginator = this.bucketNumber * this.paginatorSize + 1;
                            this.lastPaginator =
                                this.bucketNumber * this.paginatorSize + this.paginatorSize;

                            this.currentPointer = this.bucketNumber;

                            if (this.lastPaginator > this.totalRows) {
                                this.lastPaginator = this.totalRows;
                            }
                            const updatedResponse = this.massageData(response.data.response);
                            this.currentBucket[this.bucketNumber] = updatedResponse;
                            this.processData(updatedResponse);
                        } catch (e) {
                            this.errorValue = 0;
                            this.errorMessage = this.errorHandling.handleJavascriptError(e);
                            this.getErrorValues();
                        }
                    },
                    (error) => {
                        this.showGenericMessage = true;
                        this.outerArr = [];
                        this.errorMessage = error;
                        this.getErrorValues();
                    },
                );
        }
    }

    getErrorValues(): void {
        this.errorValue = -1;
        this.showLoader = false;
        this.dataComing = false;
        this.seekdata = true;
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
        this.outerArr = [];
        const getData = data;

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
                        colName: getCols[col],
                        hasPreImg: false,
                        imgLink: '',
                        valueText: cellData,
                        titleText: cellData,
                        text: getData[row][getCols[col]],
                    };
                } else if (
                    getCols[col].toLowerCase() === 'issue id' ||
                    getCols[col].toLowerCase() === 'issueid' ||
                    getCols[col].toLowerCase() === 'policy name'
                ) {
                    cellObj = {
                        isLink: true,
                        colName: getCols[col],
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
                        colName: getCols[col],
                        hasPreImg: false,
                        imgLink: '',
                        text: this.utils.calculateDateAndTime(cellData),
                        valText: this.utils.calculateDateAndTime(cellData),
                    };
                } else {
                    cellObj = {
                        isLink: false,
                        colName: getCols[col],
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
            this.outerArr.push(innerArr);
        }
        if (this.outerArr.length > getData.length) {
            const halfLength = this.outerArr.length / 2;
            this.outerArr = this.outerArr.splice(halfLength);
        }
        this.allColumns = Object.keys(totalVariablesObj);
    }

    goToDetails(row) {
        try {
            const updatedQueryParams = { ...this.activatedRoute.snapshot.queryParams };
            updatedQueryParams['headerColName'] = undefined;
            updatedQueryParams['direction'] = undefined;
            updatedQueryParams['bucketNumber'] = undefined;
            updatedQueryParams['searchValue'] = undefined;
            if (row.col.toLowerCase() === 'resource id') {
                this.workflowService.addRouterSnapshotToLevel(
                    this.router.routerState.snapshot.root,
                    0,
                    this.breadcrumbPresent,
                );
                this.router.navigate(
                    [
                        '../../../',
                        'assets',
                        'asset-list',
                        row.row['Asset Type'].text,
                        encodeURIComponent(row.row['Resource ID'].text),
                    ],
                    {
                        relativeTo: this.activatedRoute,
                        queryParams: updatedQueryParams,
                        queryParamsHandling: 'merge',
                    },
                );
            } else if (
                row.col.toLowerCase() === 'issue id' ||
                row.col.toLowerCase() === 'issueid'
            ) {
                this.workflowService.addRouterSnapshotToLevel(
                    this.router.routerState.snapshot.root,
                    0,
                    this.breadcrumbPresent,
                );
                this.router.navigate(
                    ['../../issue-listing/issue-details', row.row['Issue ID'].text],
                    {
                        relativeTo: this.activatedRoute,
                        queryParams: updatedQueryParams,
                        queryParamsHandling: 'merge',
                    },
                );
            } else if (row.col.toLowerCase() === 'policy name') {
                this.workflowService.addRouterSnapshotToLevel(
                    this.router.routerState.snapshot.root,
                    0,
                    this.breadcrumbPresent,
                );
                this.router.navigate(
                    [
                        '/pl/compliance/policy-knowledgebase-details',
                        row.row.nonDisplayableAttributes.text.PolicyId,
                        'false',
                    ],
                    {
                        relativeTo: this.activatedRoute,
                        queryParams: updatedQueryParams,
                        queryParamsHandling: 'merge',
                    },
                );
            }
        } catch (error) {
            this.errorMessage = this.errorHandling.handleJavascriptError(error);
            this.logger.log('error', error);
        }
    }

    nextPg() {
        if (this.currentPointer < this.bucketNumber) {
            this.currentPointer++;
            this.processData(this.currentBucket[this.currentPointer]);
            this.firstPaginator = this.currentPointer * this.paginatorSize + 1;
            this.lastPaginator = this.currentPointer * this.paginatorSize + this.paginatorSize;
            if (this.lastPaginator > this.totalRows) {
                this.lastPaginator = this.totalRows;
            }
        } else {
            this.bucketNumber++;
            this.getData();
        }
        this.getUpdatedUrl();
    }

    searchCalled(search) {
        this.searchTxt = search;
    }

    callNewSearch() {
        this.bucketNumber = 0;
        this.currentBucket = [];
        this.getData();
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
