import {
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnInit,
    Output,
    ViewChild,
} from '@angular/core';
import { tableFilterAnimation } from '../table-filter.animation';

export interface FilterChipUpdateEvent {
    category: string;
    filterName: string;
    filterValue: boolean;
}

@Component({
    selector: 'app-table-filter-chip',
    templateUrl: './table-filter-chip.component.html',
    styleUrls: ['./table-filter-chip.component.css'],
    animations: [tableFilterAnimation],
})
export class TableFilterChipComponent implements OnInit {
    @Input() category: string;
    @Input() options: string[] = [];
    @Input() set appliedFiltersDict(values: { [key: string]: boolean }) {
        this._appliedFilters = Object.entries(values)
            .filter(([, value]) => value)
            .map(([name, value]) => ({
                name,
                value,
            }));
        this._appliedFiltersDict = values;
    }
    get appliedFiltersDict() {
        return this._appliedFiltersDict;
    }

    get appliedFilters() {
        return this._appliedFilters;
    }

    @Output() clear = new EventEmitter<string>();
    @Output() update = new EventEmitter<FilterChipUpdateEvent>();

    @ViewChild('filterChip') filterChip: ElementRef<HTMLDivElement>;

    readonly optionsMenuOffsetY = 7;
    readonly maxOptionChars = 30;

    isOptionsMenuOpen = false;

    optionFilterQuery = '';

    private _appliedFilters: { name: string; value: boolean }[] = [];
    private _appliedFiltersDict: { [key: string]: boolean } = {};

    constructor() {}

    ngOnInit(): void {}

    toggleOptionsMenu() {
        if (this.isOptionsMenuOpen) {
            return;
        }
        this.isOptionsMenuOpen = true;
    }

    updateFilterOption(filterName: string, filterValue: boolean) {
        this.update.next({
            category: this.category,
            filterName,
            filterValue,
        });
    }

    overlayKeyDown(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            this.isOptionsMenuOpen = false;
        }
    }

    overlayOutsideClick(event: MouseEvent) {
        const target = event.target as HTMLElement;
        const filterChip = this.filterChip.nativeElement;
        if (target === filterChip || target.parentElement === filterChip) {
            return;
        }
        this.isOptionsMenuOpen = false;
    }

    filterOptionsByQuery() {
        return this.options?.filter((f) =>
            f.toLowerCase().includes(this.optionFilterQuery.toLowerCase()),
        );
    }
}
