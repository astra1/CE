import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AssetGroupObservableService } from 'projects/pacman-spa/src/app/core/services/asset-group-observable.service';
import { DataCacheService } from 'projects/pacman-spa/src/app/core/services/data-cache.service';
import { DomainTypeObservableService } from 'projects/pacman-spa/src/app/core/services/domain-type-observable.service';
import { WorkflowService } from 'projects/pacman-spa/src/app/core/services/workflow.service';
import { ToastObservableService } from 'projects/pacman-spa/src/app/post-login-app/common/services/toast-observable.service';
import { BackNavigationComponent } from 'projects/pacman-spa/src/app/shared/back-navigation/back-navigation.component';
import { CommonResponseService } from 'projects/pacman-spa/src/app/shared/services/common-response.service';
import { DownloadService } from 'projects/pacman-spa/src/app/shared/services/download.service';
import { ErrorHandlingService } from 'projects/pacman-spa/src/app/shared/services/error-handling.service';
import { HttpService } from 'projects/pacman-spa/src/app/shared/services/http-response.service';
import { LoggerService } from 'projects/pacman-spa/src/app/shared/services/logger.service';
import { RefactorFieldsService } from 'projects/pacman-spa/src/app/shared/services/refactor-fields.service';
import { RouterUtilityService } from 'projects/pacman-spa/src/app/shared/services/router-utility.service';
import { UtilsService } from 'projects/pacman-spa/src/app/shared/services/utils.service';

import { RecommendationsDetailsComponent } from './recommendations-details.component';

describe('RecommendationsDetailsComponent', () => {
  let component: RecommendationsDetailsComponent;
  let fixture: ComponentFixture<RecommendationsDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      declarations: [RecommendationsDetailsComponent, BackNavigationComponent],
      providers: [
        AssetGroupObservableService,
        CommonResponseService,
        DataCacheService,
        DomainTypeObservableService,
        DownloadService,
        ErrorHandlingService,
        HttpService,
        LoggerService,
        RefactorFieldsService,
        RouterUtilityService,
        ToastObservableService,
        UtilsService,
        WorkflowService,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RecommendationsDetailsComponent);
    component = fixture.componentInstance;
    component.recommendationParams = {
      name: 'name',
    }
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
