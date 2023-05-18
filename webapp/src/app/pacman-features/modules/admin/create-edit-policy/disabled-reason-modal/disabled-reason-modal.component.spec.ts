import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisabledReasonModalComponent } from './disabled-reason-modal.component';

describe('DisabledReasonModalComponent', () => {
    let component: DisabledReasonModalComponent;
    let fixture: ComponentFixture<DisabledReasonModalComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DisabledReasonModalComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(DisabledReasonModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
