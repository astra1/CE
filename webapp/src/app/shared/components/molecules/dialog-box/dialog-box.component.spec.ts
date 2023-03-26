import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TextComponent } from '../../atoms/text/text.component';

import { DialogBoxComponent } from './dialog-box.component';

describe('DialogBoxComponent', () => {
    let component: DialogBoxComponent;
    let fixture: ComponentFixture<DialogBoxComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DialogBoxComponent, TextComponent],
            providers: [
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: {
                        componentInstance: {
                            data: {
                                template: '',
                            },
                        },
                    },
                },
                { provide: MatDialogRef, useValue: DialogBoxComponent },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DialogBoxComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    // TODO: dialogRef.component.data.template is a wrong assignment
    xit('should create', () => {
        expect(component).toBeTruthy();
    });
});
