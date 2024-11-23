import { Component, effect } from '@angular/core';

import { PlotControlsComponent } from './components/plot-controls/plot-controls.component';
import { PlotComponent } from './components/plot/plot.component';
import { MooketDataService } from './services/MooketData.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
    standalone: true,
    imports: [PlotComponent, PlotControlsComponent],
})
export class AppComponent {
    constructor(private readonly mookedDataService: MooketDataService) {
        const initialQueryRun = effect(() => {
            const databaseReady = this.mookedDataService.databaseReady();

            if (databaseReady) {
                this.mookedDataService.executeQuery(this.mookedDataService.sqlQuery());
                initialQueryRun.destroy();
            }
        });
    }
}
