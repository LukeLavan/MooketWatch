import { Component } from '@angular/core';
import {
    FormArray,
    FormBuilder,
    FormControl,
    FormGroup,
    ReactiveFormsModule
} from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MooketDataService } from '../../services/MooketData.service';
import { initialLines, Line, PlotConfigService } from '../../services/PlotConfig.service';
import { ExpressionValidation } from '../../utils/ExpressionValidation.utils';
import { LineControlsComponent } from '../line-controls/line-controls.component';

export type LineFormGroup = FormGroup<
    NonNullable<{
        [K in keyof Line]: FormControl<NonNullable<Line[K]>>;
    }>
>;

@Component({
    selector: 'app-plot-controls',
    templateUrl: './plot-controls.component.html',
    styleUrls: ['./plot-controls.component.scss'],
    standalone: true,
    imports: [ReactiveFormsModule, LineControlsComponent, MatButtonModule, MatIconModule],
})
export class PlotControlsComponent {
    constructor(
        protected readonly plotConfigService: PlotConfigService,
        private readonly mooketDataService: MooketDataService,
        private readonly formBuilder: FormBuilder,
        private readonly expressionValidationService: ExpressionValidation,
    ) {
        this.lines = formBuilder.nonNullable.array(
            initialLines.map(line => {
                return formBuilder.nonNullable.group(line, {validators: [this.expressionValidationService.Validator()]});
            }),
        );

        this.lines.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
            this.plotConfigService.currentLines.set(this.getLines());

            // run label name collision check on every change
            this.handleLabelCollision();

            // run ExpressionValidation stuff on every change
            this.lines.controls.forEach((control) => {control.updateValueAndValidity({emitEvent: false})})
        });
    }

    lines: FormArray<LineFormGroup>;

    addLine(line?: Line): void {
        const lineInitialValues: Line = line ?? {
            type: 'expression',
            table: '',
            value: '',
            label: '',
            min: 0,
            max: 999999,
            color: '#ffffff',
        };

        this.lines.push(
            this.formBuilder.nonNullable.group({
                type: this.formBuilder.nonNullable.control(lineInitialValues.type),
                table: this.formBuilder.nonNullable.control(lineInitialValues.table),
                value: this.formBuilder.nonNullable.control(lineInitialValues.value),
                label: this.formBuilder.nonNullable.control(''),
                min: this.formBuilder.nonNullable.control(0),
                max: this.formBuilder.nonNullable.control(999999),
                color: this.formBuilder.nonNullable.control('#ffffff'),
            }, {validators: [this.expressionValidationService.Validator()]}),
        );
    }

    removeLine(index: number): void {
        this.lines.removeAt(index);
    }

    getLines(): Line[] {
        return this.lines.getRawValue();
    }

    runQuery(): void {
        if (!this.mooketDataService.databaseReady()) return;

        const query = this.mooketDataService.sqlQuery();

        this.mooketDataService.executeQuery(query);
    }

    handleLabelCollision(): void {
        const items = this.lines.controls.filter(control => control.getRawValue().type === 'item');

        const seen = new Set<string>();
        items.forEach(control => {
            const { value, table } = control.getRawValue();
            const key = `${value}-${table}`;
            if (seen.has(key)) {
            // Handle collision
            control.setErrors({duplicateItem: 'This item/table combination is already being used.'})
            } else {
            seen.add(key);
            control.setErrors(null);
            }
        });
    }
}
