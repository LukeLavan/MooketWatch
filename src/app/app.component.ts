import { Component, effect, OnInit } from '@angular/core';
import { MooketDataServiceService } from './services/MooketDataService.service';

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  constructor(private readonly mooketDataService: MooketDataServiceService) {
    effect(()=>{
      const databaseReady = mooketDataService.databaseReady();

      if(databaseReady){
        mooketDataService.testDatabase();
      }
    })
  }
}
