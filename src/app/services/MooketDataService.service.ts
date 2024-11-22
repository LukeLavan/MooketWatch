import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';

import initSqlJs, { Database } from 'sql.js';

export const MOOKET_URL = 'https://holychikenz.github.io/MWIApi/market.db';

export const testSql = `SELECT DATETIME(time,"unixepoch") AS time, 
"Holy Cheese", "Holy Milk",
("Holy Cheese" - "Holy Milk"*2) AS "Margin"
FROM ask
`;

@Injectable({
  providedIn: 'root'
})
export class MooketDataServiceService {

  databaseReady = signal(false);
  database?: Database;

  constructor(private readonly httpClient: HttpClient) {
    void this.loadDatabase();
  }

  async loadDatabase() {
    this.httpClient.get(MOOKET_URL, { responseType: 'blob' }).subscribe(async (response) => {
      const buffer = await response.arrayBuffer();
      const SQL = await initSqlJs();
      this.database = new SQL.Database(new Uint8Array(buffer));
      this.databaseReady.set(true);
    });
  }

  async testDatabase(){
    if(!this.databaseReady() || !this.database) return;

    const testResponse = this.database.exec(testSql);

    testResponse.forEach((response)=>{
      console.log(response)
    })
  }

}
