import { Component } from '@angular/core';
import {
    FormArray,
    FormBuilder,
    FormControl,
    FormGroup,
    ReactiveFormsModule,
} from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { initialLines, Line, PlotConfigService } from '../../services/PlotConfig.service';
import { LineControlsComponent } from '../line-controls/line-controls.component';
import { MooketDataService } from '../../services/MooketData.service';

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
    ) {
        this.lines = formBuilder.nonNullable.array(
            initialLines.map(line => formBuilder.nonNullable.group(line)),
        );

        this.lines.valueChanges.subscribe(() => {
            this.plotConfigService.currentLines.set(this.getLines());
        });
    }

    lines: FormArray<LineFormGroup>;

    addLine(): void {
        this.lines.push(
            this.formBuilder.nonNullable.group({
                type: this.formBuilder.nonNullable.control('expression' as 'item' | 'expression'),
                value: this.formBuilder.nonNullable.control(''),
                label: this.formBuilder.nonNullable.control(''),
                min: this.formBuilder.nonNullable.control(0),
                max: this.formBuilder.nonNullable.control(999999),
                color: this.formBuilder.nonNullable.control('#ffffff'),
            }),
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
}
