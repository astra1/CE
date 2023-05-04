import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { DataCacheService } from 'projects/pacman-spa/src/app/core/services/data-cache.service';
import { WorkflowService } from 'projects/pacman-spa/src/app/core/services/workflow.service';
import { LoggerService } from 'projects/pacman-spa/src/app/shared/services/logger.service';
import { RefactorFieldsService } from 'projects/pacman-spa/src/app/shared/services/refactor-fields.service';
import { RouterUtilityService } from 'projects/pacman-spa/src/app/shared/services/router-utility.service';
import { UtilsService } from 'projects/pacman-spa/src/app/shared/services/utils.service';

import { ViolationsCardComponent } from './violations-card.component';

describe('ViolationsCardComponent', () => {
  let component: ViolationsCardComponent;
  let fixture: ComponentFixture<ViolationsCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [ ViolationsCardComponent ],
      providers: [
        DataCacheService,
        LoggerService,
        RefactorFieldsService,
        RouterUtilityService,
        UtilsService,
        WorkflowService,
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViolationsCardComponent);
    component = fixture.componentInstance;
    component.card = {
      name: 'name',
      subInfo: {},
    }
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
