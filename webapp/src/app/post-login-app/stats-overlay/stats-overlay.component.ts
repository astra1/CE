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

import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import html2canvas from 'html2canvas';
import { Subscription } from 'rxjs';
import { CommonResponseService } from 'src/app/shared/services/common-response.service';
import { ErrorHandlingService } from 'src/app/shared/services/error-handling.service';
import { CONFIGURATIONS } from 'src/config/configurations';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-stats-overlay',
    templateUrl: './stats-overlay.component.html',
    styleUrls: ['./stats-overlay.component.css'],
    providers: [CommonResponseService],
    // eslint-disable-next-line
    host: {
        '(window:resize)': 'onResize($event)',
    },
})
export class StatsOverlayComponent implements OnInit, OnDestroy {
    currentDate = new Date();
    selectedAssetGroup: string;
    apiData: any;
    applicationValue: any;
    errorMessage: string;
    dataComing = false;
    showLoader = true;
    tableHeaderData: any;
    placeHolderText: string;
    returnedSearch = '';
    seekdata = false;

    numberOfAwsAccounts = '';
    numberOfEventsProcessed = '';
    numberOfPolicyWithAutoFixes = '';
    numberOfPolicyEvaluations = '';
    numberOfPoliciesEnforced = '';
    totalNumberOfAssets = '';
    totalViolationsGraph: any = [];
    doughNutData: any = [];
    widgetWidth: number;
    widgetHeight: number;
    MainTextcolor = '';
    innerRadius = 60;
    outerRadius = 50;
    strokeColor = 'transparent';
    totalAutoFixesApplied = '';
    config;

    private dataSubscription: Subscription;

    constructor(
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private commonResponseService: CommonResponseService,
        private errorHandling: ErrorHandlingService,
    ) {
        this.config = CONFIGURATIONS;
    }

    takeScreenshot() {
        const page = document.getElementById('stats-overlay-screenshot');
        const pageClone: any = page.cloneNode(true);
        const back = pageClone.querySelector('#stats-overlay-back');
        back.style.opacity = 0;
        const download = pageClone.querySelector('#stats-overlay-download');
        download.style.opacity = 0;

        const statsOverlayPage = document.getElementById('stats-overlay-page');
        statsOverlayPage.appendChild(pageClone);

        html2canvas(pageClone).then(function (canvas) {
            statsOverlayPage.removeChild(pageClone);
            const url = canvas.toDataURL('image/png');
            const binStr = atob(url.split(',')[1]),
                len = binStr.length,
                arr = new Uint8Array(len);

            for (let i = 0; i < len; i++) {
                arr[i] = binStr.charCodeAt(i);
            }
            const blob = new Blob([arr]);
            const a = document.createElement('a');
            a.download = 'PacBot-Statistics.png';
            a.innerHTML = 'download';
            a.href = URL.createObjectURL(blob);

            a.click();
        });
    }

    onResize() {
        this.getDimensions();
    }

    getDimensions() {
        const element = document.getElementById('statsDoughnut');
        if (element) {
            this.widgetWidth =
                parseInt(
                    window.getComputedStyle(element, null).getPropertyValue('width').split('px')[0],
                    10,
                ) + 20;
            this.widgetHeight =
                parseInt(
                    window
                        .getComputedStyle(element, null)
                        .getPropertyValue('height')
                        .split('px')[0],
                    10,
                ) - 20;
        }
    }

    ngOnInit() {
        this.updateComponent();
    }

    updateComponent() {
        this.showLoader = true;
        this.dataComing = false;
        this.seekdata = false;
        this.getData();
    }

    getData() {
        this.getStatsData();
    }

    getStatsData() {
        const queryParams = {};

        const statspageUrl = environment.statspage.url;
        const statspageMethod = environment.statspage.method;
        this.dataSubscription = this.commonResponseService
            .getData(statspageUrl, statspageMethod, {}, queryParams)
            .subscribe(
                (response) => {
                    try {
                        if (response.response.length === 0) {
                            this.getErrorValues();
                            this.errorMessage = 'noDataAvailable';
                        } else {
                            this.showLoader = false;
                            this.seekdata = false;
                            this.dataComing = true;
                            this.getDimensions();
                            this.processData(response);
                        }
                    } catch (e) {
                        this.errorMessage = this.errorHandling.handleJavascriptError(e);
                        this.getErrorValues();
                    }
                },
                (error) => {
                    this.errorMessage = error;
                    this.getErrorValues();
                },
            );
    }

    // error values
    getErrorValues(message?: string) {
        this.showLoader = false;
        this.dataComing = false;
        this.seekdata = true;
        if (message) {
            this.errorMessage = message;
        }
    }

    processData(data) {
        const response = data;
        this.numberOfAwsAccounts = response.response[0].numberOfAwsAccounts;
        this.numberOfEventsProcessed = response.response[0].numberOfEventsProcessed;
        this.numberOfPolicyEvaluations = response.response[0].numberOfPolicyEvaluations;
        this.numberOfPoliciesEnforced = response.response[0].numberOfPoliciesEnforced;
        this.totalNumberOfAssets = response.response[0].totalNumberOfAssets;
        this.totalViolationsGraph = response.response[0].totalViolations;
        this.numberOfPolicyWithAutoFixes = response.response[0].numberOfPolicyWithAutoFixes;
        this.totalAutoFixesApplied = response.response[0].totalAutoFixesApplied;

        /**
         ------ this is the data for statspage doughnut chart for policy with violations ---------
         */
        this.MainTextcolor = '#fff';
        this.strokeColor = 'eff3f6';
        const colorTransData = ['#D95140', '#FF8888', '#FFCFCF', '#F1D668'];
        const graphLegend = ['Critical', 'High', 'Medium', 'Low'];
        const graphDataArray = [];
        const legendTextcolor = '#fff';
        /**
         * Added by Trinanjan on 02/03/2018
         * Inorder to sort objkeys in a logical way, objKeys are hardcoded
         */
        const objKeys = ['critical', 'high', 'medium', 'low', 'totalViolations'];
        /* ****************************************************************** */
        objKeys.splice(objKeys.indexOf('totalViolations'), 1);
        objKeys.forEach((element) => {
            graphDataArray.push(this.totalViolationsGraph[element]);
        });
        this.innerRadius = 70;
        this.outerRadius = 50;
        const formattedObject = {
            color: colorTransData,
            data: graphDataArray,
            legend: graphLegend,
            totalCount: this.totalViolationsGraph.totalViolations,
            legendTextcolor: legendTextcolor,
            link: false,
            styling: {
                cursor: 'text',
            },
        };
        this.doughNutData = formattedObject;
    }

    /**
     * this function closes the stats model page and navigates to the last active route
     */

    closeStatsModal() {
        this.router.navigate(
            [
                // No relative path pagination
                {
                    outlets: {
                        modalBGMenu: null,
                    },
                },
            ],
            {
                relativeTo: this.activatedRoute.parent, // <-- Parent activated route
                queryParamsHandling: 'merge',
            },
        );
    }

    ngOnDestroy() {
        try {
            if (this.dataSubscription) {
                this.dataSubscription.unsubscribe();
            }
        } catch (error) {
            this.errorMessage = this.errorHandling.handleJavascriptError(error);
            this.getErrorValues();
        }
    }
}
