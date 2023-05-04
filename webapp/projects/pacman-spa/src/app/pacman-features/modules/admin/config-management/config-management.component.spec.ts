import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { DataCacheService } from 'projects/pacman-spa/src/app/core/services/data-cache.service';
import { WorkflowService } from 'projects/pacman-spa/src/app/core/services/workflow.service';
import { ToastObservableService } from 'projects/pacman-spa/src/app/post-login-app/common/services/toast-observable.service';
import { CommonResponseService } from 'projects/pacman-spa/src/app/shared/services/common-response.service';
import { ErrorHandlingService } from 'projects/pacman-spa/src/app/shared/services/error-handling.service';
import { FormService } from 'projects/pacman-spa/src/app/shared/services/form.service';
import { HttpService } from 'projects/pacman-spa/src/app/shared/services/http-response.service';
import { LoggerService } from 'projects/pacman-spa/src/app/shared/services/logger.service';
import { RefactorFieldsService } from 'projects/pacman-spa/src/app/shared/services/refactor-fields.service';
import { RouterUtilityService } from 'projects/pacman-spa/src/app/shared/services/router-utility.service';
import { ToastObservableService as SharedToastObservableService  } from 'projects/pacman-spa/src/app/shared/services/toast-observable.service';
import { UtilsService } from 'projects/pacman-spa/src/app/shared/services/utils.service';
import { ToastNotificationComponent } from 'projects/pacman-spa/src/app/shared/toast-notification/toast-notification.component';

import { ConfigManagementComponent } from './config-management.component';

describe('ConfigManagementComponent', () => {
  let component: ConfigManagementComponent;
  let fixture: ComponentFixture<ConfigManagementComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      declarations: [ ConfigManagementComponent, ToastNotificationComponent ],
      providers: [
        CommonResponseService,
        DataCacheService,
        ErrorHandlingService,
        FormService,
        HttpService,
        LoggerService,
        UtilsService,
        RefactorFieldsService,
        RouterUtilityService,
        SharedToastObservableService,
        ToastObservableService,
        WorkflowService,
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfigManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
