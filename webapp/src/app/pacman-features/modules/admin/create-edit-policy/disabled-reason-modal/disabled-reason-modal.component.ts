import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-disabled-reason-modal',
    templateUrl: './disabled-reason-modal.component.html',
    styleUrls: ['./disabled-reason-modal.component.css'],
})
export class DisabledReasonModalComponent implements OnInit {
    minDate: Date;

    reasonForm = new FormGroup({
        reason: new FormControl(null, [Validators.required, Validators.minLength(3)]),
        expiryDate: new FormControl(null, [Validators.required]),
    });

    constructor(private dialogRef: MatDialogRef<DisabledReasonModalComponent>) {
        const today = new Date();
        today.setDate(today.getDate() + 1);

        this.reasonForm.get('expiryDate').addValidators(Validators.min(today.getTime()));
        this.minDate = today;
    }

    ngOnInit(): void {}

    close() {
        this.dialogRef.close();
    }

    disable() {
        this.dialogRef.close(this.reasonForm.value);
    }
}
