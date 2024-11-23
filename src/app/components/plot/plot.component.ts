import { Component, effect, ElementRef, input, OnInit, ViewChild } from '@angular/core';

import { Chart } from 'chart.js/auto';
import { DbResponse, MooketDataService } from '../../services/MooketData.service';
import { PlotConfigService } from '../../services/PlotConfig.service';

@Component({
    selector: 'app-plot',
    templateUrl: `./plot.component.html`,
    styleUrl: './plot.component.scss',
    standalone: true,
})
export class PlotComponent implements OnInit {
    @ViewChild('canvas', { read: ElementRef, static: true }) canvas?: ElementRef;

    constructor(
        private readonly plotConfigService: PlotConfigService,
        private readonly mookedDataService: MooketDataService,
    ) {}

    ngOnInit() {
        this.plotConfigService.chart = new Chart(this.canvas!.nativeElement as HTMLCanvasElement, {
            type: 'line',
            data: { labels: [''], datasets: [] },
            options: {
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            tooltipFormat: 'PPpp', // date-fns format string for tooltip
                            displayFormats: {
                                day: 'MMM dd',
                            },
                            unit: 'day',
                        },
                        title: {
                            display: true,
                            text: 'Date',
                        },
                    },
                },
                plugins: {
                    zoom: {
                        zoom: {
                            drag: {
                                enabled: true,
                            },
                            mode: 'x',
                        },
                    },
                },
            },
        });
    }
}
