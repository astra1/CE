import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AssetGroupObservableService } from 'projects/pacman-spa/src/app/core/services/asset-group-observable.service';
import { DataCacheService } from 'projects/pacman-spa/src/app/core/services/data-cache.service';
import { DomainTypeObservableService } from 'projects/pacman-spa/src/app/core/services/domain-type-observable.service';
import { WorkflowService } from 'projects/pacman-spa/src/app/core/services/workflow.service';
import { CommonResponseService } from 'projects/pacman-spa/src/app/shared/services/common-response.service';
import { ErrorHandlingService } from 'projects/pacman-spa/src/app/shared/services/error-handling.service';
import { FilterManagementService } from 'projects/pacman-spa/src/app/shared/services/filter-management.service';
import { FormService } from 'projects/pacman-spa/src/app/shared/services/form.service';
import { HttpService } from 'projects/pacman-spa/src/app/shared/services/http-response.service';
import { LoggerService } from 'projects/pacman-spa/src/app/shared/services/logger.service';
import { RefactorFieldsService } from 'projects/pacman-spa/src/app/shared/services/refactor-fields.service';
import { RouterUtilityService } from 'projects/pacman-spa/src/app/shared/services/router-utility.service';
import { UtilsService } from 'projects/pacman-spa/src/app/shared/services/utils.service';

import { PluginManagementDetailsComponent } from './plugin-management-details.component';

describe('PluginManagementDetailsComponent', () => {
  let component: PluginManagementDetailsComponent;
  let fixture: ComponentFixture<PluginManagementDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      declarations: [PluginManagementDetailsComponent],
      providers: [
        AssetGroupObservableService,
        CommonResponseService,
        DataCacheService,
        DomainTypeObservableService,
        ErrorHandlingService,
        FormService,
        FilterManagementService,
        HttpService,
        LoggerService,
        RefactorFieldsService,
        RouterUtilityService,
        UtilsService,
        WorkflowService,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PluginManagementDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
