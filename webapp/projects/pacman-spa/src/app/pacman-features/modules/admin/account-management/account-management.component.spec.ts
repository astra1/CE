import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { AssetGroupObservableService } from 'projects/pacman-spa/src/app/core/services/asset-group-observable.service';
import { DataCacheService } from 'projects/pacman-spa/src/app/core/services/data-cache.service';
import { WorkflowService } from 'projects/pacman-spa/src/app/core/services/workflow.service';
import { ButtonComponent } from 'projects/pacman-spa/src/app/shared/button/button.component';
import { DataTableComponent } from 'projects/pacman-spa/src/app/shared/data-table/data-table.component';
import { CommonResponseService } from 'projects/pacman-spa/src/app/shared/services/common-response.service';
import { ErrorHandlingService } from 'projects/pacman-spa/src/app/shared/services/error-handling.service';
import { FilterManagementService } from 'projects/pacman-spa/src/app/shared/services/filter-management.service';
import { HttpService } from 'projects/pacman-spa/src/app/shared/services/http-response.service';
import { LoggerService } from 'projects/pacman-spa/src/app/shared/services/logger.service';
import { RefactorFieldsService } from 'projects/pacman-spa/src/app/shared/services/refactor-fields.service';
import { RouterUtilityService } from 'projects/pacman-spa/src/app/shared/services/router-utility.service';
import { UtilsService } from 'projects/pacman-spa/src/app/shared/services/utils.service';
import { TitleBurgerHeadComponent } from 'projects/pacman-spa/src/app/shared/title-burger-head/title-burger-head.component';

import { AccountManagementComponent } from './account-management.component';

describe('AccountManagementComponent', () => {
  let component: AccountManagementComponent;
  let fixture: ComponentFixture<AccountManagementComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, FormsModule, RouterTestingModule],
      declarations: [
        AccountManagementComponent,
        ButtonComponent,
        DataTableComponent,
        TitleBurgerHeadComponent,
      ],
      providers: [
        AssetGroupObservableService,
        CommonResponseService,
        DataCacheService,
        ErrorHandlingService,
        FilterManagementService,
        HttpService,
        LoggerService,
        WorkflowService,
        RefactorFieldsService,
        RouterUtilityService,
        UtilsService,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AccountManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
