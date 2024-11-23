import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';

import initSqlJs, { Database } from 'sql.js';

export const URL_MARKET_DB = 'https://holychikenz.github.io/MWIApi/market.db';
export const URL_MARKETAPI_JSON = 'https://holychikenz.github.io/MWIApi/milkyapi.json';

export type DbResponse = {columns: string[], values: (string | number | null)[][]};

export const testSql = `
SELECT 
  DATETIME(time, "unixepoch") AS time, 
  "Holy Cheese", 
  "Holy Milk",
  CASE 
    WHEN "Holy Cheese" = -1 OR "Holy Milk" = -1 THEN -1 
    ELSE ("Holy Cheese" - "Holy Milk" * 2) 
  END AS "Margin"
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
    this.httpClient.get(URL_MARKET_DB, { responseType: 'blob' }).subscribe(async (response) => {
      const buffer = await response.arrayBuffer();
      const SQL = await initSqlJs();
      this.database = new SQL.Database(new Uint8Array(buffer));
      this.databaseReady.set(true);
    });
  }

  testDatabase(): DbResponse | undefined {
    if(!this.databaseReady() || !this.database) return;

    const response = this.database.exec(testSql)[0] as DbResponse;

    /**
     * If any values are above this value, treat the value like it's missing.
     */
    const arbitraryCutoff = 2499;

    response.values = response.values.map(row => {
      const values = row.slice(1) as number[];

      if(values.find(value=> value > arbitraryCutoff)){
        return [row[0], ...values.map(()=>null)]
      }

      return row;
    });

    return response;
  }

  fetchCurrentMarketData(): Observable<any> {
    return this.httpClient.get(URL_MARKETAPI_JSON);
  }

}
