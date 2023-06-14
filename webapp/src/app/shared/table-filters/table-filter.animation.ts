import { animate, style, transition, trigger } from '@angular/animations';

export const tableFilterAnimation = trigger('fade', [
    transition(':enter', [
        style({
            opacity: 0,
            scale: 0.8,
        }),
        animate(
            '120ms ease',
            style({
                opacity: 1,
                scale: 1,
            }),
        ),
    ]),
    transition(':leave', [
        animate(
            '100ms ease',
            style({
                opacity: 0,
                scale: 0.8,
            }),
        ),
    ]),
]);
