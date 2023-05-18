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

import { ClipboardModule } from '@angular/cdk/clipboard';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { SharedModule } from 'src/app/shared/shared.module';
import { AdminService } from '../../services/all-admin.service';
import { AccountManagementDetailsComponent } from './account-management-details/account-management-details.component';
import { AccountManagementComponent } from './account-management/account-management.component';
import { AddAccountComponent } from './account-management/add-account/add-account.component';
import { AdminRoutingModule } from './admin-routing.module';
import { AssetGroupsComponent } from './asset-groups/asset-groups.component';
import { CreateAssetGroupsComponent } from './asset-groups/create-asset-groups/create-asset-groups.component';
import { DeleteAssetGroupsComponent } from './asset-groups/delete-asset-groups/delete-asset-groups.component';
import { CreateUpdateDomainComponent } from './asset-groups/domains/create-update-domain/create-update-domain.component';
import { DomainsComponent } from './asset-groups/domains/domains.component';
import { CreateUpdateTargetTypesComponent } from './asset-groups/target-types/create-update-target-types/create-update-target-types.component';
import { TargetTypesComponent } from './asset-groups/target-types/target-types.component';
import { PacmanLoaderComponent } from './commons/pacman-loader/pacman-loader.component';
import { ConfigManagementComponent } from './config-management/config-management.component';
import { CreateEditPolicyComponent } from './create-edit-policy/create-edit-policy.component';
import { DisabledReasonModalComponent } from './create-edit-policy/disabled-reason-modal/disabled-reason-modal.component';
import { EnableDisableRuleComponent } from './enable-disable-rule/enable-disable-rule.component';
import { InvokeRuleComponent } from './invoke-rule/invoke-rule.component';
import { CreateJobExecutionManagerComponent } from './job-execution-manager/create-job-execution-manager/create-job-execution-manager.component';
import { JobExecutionManagerComponent } from './job-execution-manager/job-execution-manager.component';
import { UpdateJobExecutionManagerComponent } from './job-execution-manager/update-job-execution-manager/update-job-execution-manager.component';
import { PluginManagementDetailsComponent } from './plugin-management-details/plugin-management-details.component';
import { PluginManagementComponent } from './plugin-management/plugin-management.component';
import { PoliciesComponent } from './policies/policies.component';
import { RolesAllocationComponent } from './roles-allocation/roles-allocation.component';
import { ConfigUsersComponent } from './roles/config-users/config-users.component';
import { CreateUpdateRolesComponent } from './roles/create-update-roles/create-update-roles.component';
import { RolesComponent } from './roles/roles.component';
import { RulesComponent } from './rules/rules.component';
import { CreateStickyExceptionsComponent } from './sticky-exceptions/create-sticky-exceptions/create-sticky-exceptions.component';
import { DeleteStickyExceptionsComponent } from './sticky-exceptions/delete-sticky-exceptions/delete-sticky-exceptions.component';
import { StickyExceptionsComponent } from './sticky-exceptions/sticky-exceptions.component';
import { SystemManagementComponent } from './system-management/system-management.component';
import { UserManagementComponent } from './user-management/user-management.component';

@NgModule({
    imports: [
        AdminRoutingModule,
        ClipboardModule,
        CommonModule,
        MatDatepickerModule,
        MatInputModule,
        MatNativeDateModule,
        MatSlideToggleModule,
        MatSlideToggleModule,
        SharedModule,
    ],
    declarations: [
        AccountManagementComponent,
        AccountManagementDetailsComponent,
        AddAccountComponent,
        AssetGroupsComponent,
        ConfigManagementComponent,
        ConfigUsersComponent,
        CreateAssetGroupsComponent,
        CreateEditPolicyComponent,
        CreateJobExecutionManagerComponent,
        CreateStickyExceptionsComponent,
        CreateUpdateDomainComponent,
        CreateUpdateRolesComponent,
        CreateUpdateTargetTypesComponent,
        DeleteAssetGroupsComponent,
        DeleteStickyExceptionsComponent,
        DisabledReasonModalComponent,
        DomainsComponent,
        EnableDisableRuleComponent,
        InvokeRuleComponent,
        JobExecutionManagerComponent,
        PacmanLoaderComponent,
        PluginManagementComponent,
        PluginManagementDetailsComponent,
        PoliciesComponent,
        RolesAllocationComponent,
        RolesComponent,
        RulesComponent,
        StickyExceptionsComponent,
        SystemManagementComponent,
        TargetTypesComponent,
        UpdateJobExecutionManagerComponent,
        UserManagementComponent,
    ],
    providers: [AdminService],
})
export class AdminModule {}
