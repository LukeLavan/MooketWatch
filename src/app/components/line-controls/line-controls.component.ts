import {
    Component,
    DestroyRef,
    effect,
    EventEmitter,
    forwardRef,
    input,
    OnInit,
    output,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
    ControlValueAccessor,
    FormBuilder,
    FormControl,
    FormGroup,
    NG_VALUE_ACCESSOR,
    ReactiveFormsModule,
} from '@angular/forms';
import {
    MatAutocompleteModule,
    MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Line, PlotConfigService } from '../../services/PlotConfig.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { LineFormGroup } from '../plot-controls/plot-controls.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NgClass } from '@angular/common';
import { distinctUntilChanged, filter, map, merge, startWith } from 'rxjs';
import { HighlightSearchPipe } from '../../pipes/HighlightSearch.pipe';

@Component({
    selector: 'line-controls',
    templateUrl: './line-controls.component.html',
    styleUrls: ['./line-controls.component.scss'],
    standalone: true,
    imports: [
        ReactiveFormsModule,
        MatSelectModule,
        MatAutocompleteModule,
        MatInputModule,
        MatFormFieldModule,
        MatButtonModule,
        MatIconModule,
        HighlightSearchPipe,
    ],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => LineControlsComponent),
            multi: true,
        },
    ],
})
export class LineControlsComponent implements OnInit {
    formGroup = input.required<LineFormGroup>();

    itemSearch = new FormControl('', { nonNullable: true });
    itemSelected = new EventEmitter<boolean>(false);

    filteredItems = toSignal(
        merge(
            this.itemSelected.pipe(
                takeUntilDestroyed(),
                distinctUntilChanged(),
                filter((itemSelected): itemSelected is true => {
                    return itemSelected === true;
                }),
                map(() => {
                    return this.plotConfigService!.items!;
                }),
            ),
            this.itemSearch.valueChanges.pipe(
                takeUntilDestroyed(),
                map(searchString => {
                    if (!this.plotConfigService?.items) {
                        return [];
                    }

                    return this.plotConfigService.items.filter(item =>
                        item.toLowerCase().includes(searchString.toLowerCase().trim()),
                    );
                }),
            ),
        ),
    );

    remove = output();

    constructor(
        protected readonly plotConfigService: PlotConfigService,
        private readonly destroyRef: DestroyRef,
    ) {
        // load initial value into search field and load autocomplete items once when items are ready
        const itemsLoading = effect(() => {
            const itemsReady = this.plotConfigService.itemsReady();

            if (itemsReady) {
                this.onItemSelect(this.formGroup().getRawValue().value);
                itemsLoading.destroy();
            }
        });
    }

    ngOnInit(): void {
        // disable label field when type is 'item'
        this.formGroup()
            .controls.type.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(newType => {
                if (newType === 'item') {
                    this.formGroup().controls.label.disable();
                } else {
                    this.formGroup().controls.label.enable();
                }
            });

        // set label to value when type is 'item'
        this.formGroup()
            .controls.value.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(newValue => {
                if (this.formGroup().controls.type.value === 'item') {
                    this.formGroup().controls.label.setValue(newValue);
                }
            });

        // keep itemSelected up to date on user input
        this.itemSearch.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
            this.itemSelected.emit(false);
        });

        // mark value field with error when item not selected
        this.itemSelected.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(itemSelected => {
            if (!itemSelected && this.formGroup().value.type === 'item') {
                this.formGroup().controls.value.setErrors({ required: true });
                this.itemSearch.setErrors({ required: true });
            }
        });
    }

    onItemSelect(item: string): void {
        this.formGroup().controls.value.setValue(item);
        this.formGroup().controls.value.setErrors(null);
        this.itemSearch.setValue(item, { emitEvent: false }); // Emit event false to avoid valueChanges emit since selecting an item is handled separately
        this.itemSearch.setErrors(null);
        this.itemSelected.emit(true);
    }
}
