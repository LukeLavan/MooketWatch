import { Component, DestroyRef, forwardRef, input, OnInit, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
        NgClass,
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

    remove = output();

    constructor(
        protected readonly plotConfigService: PlotConfigService,
        private readonly destroyRef: DestroyRef,
    ) {}

    ngOnInit(): void {
        this.itemSearch.setValue(this.formGroup().getRawValue().value);

        this.formGroup()
            .controls.type.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(newType => {
                if (newType === 'item') {
                    this.formGroup().controls.label.disable();
                } else {
                    this.formGroup().controls.label.enable();
                }
            });

        this.formGroup()
            .controls.value.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(newValue => {
                if (this.formGroup().controls.type.value === 'item') {
                    this.formGroup().controls.label.setValue(newValue);
                }
            });
    }

    onItemSelect(item: MatAutocompleteSelectedEvent): void {
        this.formGroup().controls.value.setValue(item.option.value);
    }
}
