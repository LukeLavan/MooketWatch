import {
    Component,
    DestroyRef,
    effect,
    ElementRef,
    HostListener,
    OnInit,
    ViewChild,
} from '@angular/core';

import { PlotControlsComponent } from './components/plot-controls/plot-controls.component';
import { PlotComponent } from './components/plot/plot.component';
import { MooketDataService } from './services/MooketData.service';
import { HeaderComponent } from './components/header/header.component';
import { FlexDragResizeComponent } from './components/flex-drag-resize/flex-drag-resize.component';
import { NgStyle } from '@angular/common';
import { debounceTime } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
    standalone: true,
    imports: [
        PlotComponent,
        PlotControlsComponent,
        HeaderComponent,
        FlexDragResizeComponent,
        NgStyle,
    ],
})
export class AppComponent implements OnInit {
    @ViewChild('resizer', { read: FlexDragResizeComponent, static: true })
    resizer?: FlexDragResizeComponent;

    @HostListener('mouseup', ['$event']) onMouseUp(event: MouseEvent) {
        this.resizer?.onMouseUp(event);
    }

    plotWidth: string = '75%';
    plotMinWidthPx = 600;

    constructor(
        private readonly mookedDataService: MooketDataService,
        protected readonly elementRef: ElementRef,
        private readonly destroyRef: DestroyRef,
    ) {
        const initialQueryRun = effect(() => {
            const databaseReady = this.mookedDataService.databaseReady();

            if (databaseReady) {
                this.mookedDataService.executeQuery(this.mookedDataService.sqlQuery());
                initialQueryRun.destroy();
            }
        });
    }

    ngOnInit(): void {
        this.resizer!.leftWidth$.pipe(
            takeUntilDestroyed(this.destroyRef),
            debounceTime(1000),
        ).subscribe(newWidth => {
            this.plotWidth = newWidth;
        });
    }
}
