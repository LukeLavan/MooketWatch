import { Injectable, signal } from '@angular/core';

import { Chart } from 'chart.js/auto';

/**
 * A line to be graphed on the main plot.
 *
 * Each line can represent either a single item (from either the ask or bid tables)
 * or an expression that is evaluated based on other lines.
 */
export type Line = {
    /** Whether this line represents a single item or an evaluated expression */
    type: 'item' | 'expression';
    /** only 'bid' or 'ask' if 'type' is 'item', only '' if 'type' is 'expression' */
    table: 'bid' | 'ask' | '';
    /** The value passed into the query, either an item name or an escaped expression that will be pre-processed */
    value: string;
    /** the column name returned from the query that represents this line; used in expressions to reference other lines */
    label: string;
    /** arbitrary cutoff; values below are treated as missing */
    min: number;
    /** arbitrary cutoff; values above are treated as missing */
    max: number;
    /** TODO: pull into plot config */
    color: string;
};

export const initialLines: Line[] = [
    {
        table: 'ask',
        type: 'item',
        value: 'Holy Cheese',
        label: 'Holy Cheese',
        min: 0,
        max: 5000,
        color: '',
    },
    {
        table: 'ask',
        type: 'item',
        value: 'Holy Milk',
        label: 'Holy Milk',
        min: 0,
        max: 5000,
        color: '',
    },
    {
        table: '',
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
    itemsReady = signal(false);

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
