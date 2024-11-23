import { Component, effect, OnInit } from '@angular/core';
import { DbResponse, MooketDataServiceService } from './services/MooketDataService.service';
import { PlotComponent } from './components/plot/plot.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  standalone: true,
  imports: [PlotComponent],
})
export class AppComponent {
  constructor(private readonly mooketDataService: MooketDataServiceService) {
    const databaseReadyEffectRef = effect(()=>{
      const databaseReady = mooketDataService.databaseReady();

      if(databaseReady){
        this.marketData = mooketDataService.testDatabase();
        databaseReadyEffectRef.destroy();
      }
    });
  }

  marketData?: DbResponse;

  onDatabaseReady(): void {
    this.mooketDataService.testDatabase();
  }
}
