import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-disabled-reason-modal',
    templateUrl: './disabled-reason-modal.component.html',
    styleUrls: ['./disabled-reason-modal.component.css'],
})
export class DisabledReasonModalComponent implements OnInit {
    constructor(private dialogRef: MatDialogRef<DisabledReasonModalComponent>) {}

    ngOnInit(): void {}

    close() {
        this.dialogRef.close();
    }

    disable() {
        this.dialogRef.close({
            reason: null,
            expiryDate: null,
        });
    }
}
