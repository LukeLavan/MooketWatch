import { computed, Injectable, signal } from '@angular/core';

import { Chart } from 'chart.js/auto';

export type Line = {
    type: 'item' | 'expression';
    value: string;
    label: string;
    min: number;
    max: number;
    color: string;
};

export const initialLines: Line[] = [
    {
        type: 'item',
        value: 'Holy Cheese',
        label: 'Holy Cheese',
        min: 0,
        max: 5000,
        color: '',
    },
    {
        type: 'item',
        value: 'Holy Milk',
        label: 'Holy Milk',
        min: 0,
        max: 5000,
        color: '',
    },
    {
        type: 'expression',
        value: '("Holy Cheese" - "Holy Milk" * 2)',
        label: 'Margin',
        min: -5000,
        max: 5000,
        color: '',
    },
];

@Injectable({
    providedIn: 'root',
})
export class PlotConfigService {
    chart?: Chart;

    /**
     * Set during loading by `MooketDataServiceService.fetchItems()`
     */
    items?: string[];

    /**
     * Updated by `PlotControlsComponent`
     */
    currentLines = signal(initialLines);

    isZoomed(): boolean {
        if (!this.chart) return false;

        return this.chart.getZoomLevel() !== 1;
    }

    resetZoom(): void {
        if (!this.chart) return;

        this.chart.resetZoom();
        this.chart.zoom;
    }
}
