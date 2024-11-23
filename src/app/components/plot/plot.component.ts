import { Component, ElementRef, input, OnInit, ViewChild } from '@angular/core';

import { Chart } from 'chart.js/auto';
import { DbResponse } from '../../services/MooketDataService.service';

@Component({
  selector: 'app-plot',
  templateUrl: `./plot.component.html`,
  styleUrl: './plot.component.scss',
  standalone: true
})
export class PlotComponent implements OnInit {
  data = input.required<DbResponse>();

  chart?: Chart;
  
  @ViewChild('canvas', {read: ElementRef, static: true}) canvas?: ElementRef;

  ngOnInit(){
    const data: {labels: string[], datasets: {label: string, data: (number | null)[]}[]} = {
      labels: this.data().values.map(row => row[0] as string),
      datasets: this.data().columns.slice(1).map((column, index) => ({
        label: column,
        data: this.data().values.map(row => {const val = row[index + 1] as number; return val === -1 ? null : val})
    }))};

    this.chart = new Chart(
      this.canvas!.nativeElement as HTMLCanvasElement,
      {
        type: 'line',
        data: data,
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
                text: 'Date'
              }
            },
            y: {
              min: 0,
              max: 2500
            }
          },
          plugins: {
            zoom: {
              zoom: {
              drag: {
                enabled: true
              },
              mode: 'x',
            },
          }
          }
        },
      }
    );
  }

  isZoomed(): boolean {
    if(!this.chart) return false;

    return this.chart.getZoomLevel() !== 1;
  }

  resetZoom(): void {
    if(!this.chart) return;

    this.chart.resetZoom();
    this.chart.zoom
  }
}
