import { HttpClient } from '@angular/common/http';
import { computed, effect, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';

import initSqlJs, { Database } from 'sql.js';
import { PlotConfigService } from './PlotConfig.service';

export const URL_MARKET_DB = 'https://holychikenz.github.io/MWIApi/market.db';
export const URL_MARKETAPI_JSON = 'https://holychikenz.github.io/MWIApi/milkyapi.json';

export type DbResponse = { columns: string[]; values: (string | number | null)[][] };

/** TODO: this shouldnt be hardcoded */
export const initialQuery = `
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
    providedIn: 'root',
})
export class MooketDataService {
    databaseReady = signal(false);
    database?: Database;

    lastResponse = signal<DbResponse | undefined>(undefined);

    sqlQuery = computed(() => {
        const currentLines = this.plotConfigService.currentLines();

        const expressionWithSelects: string[] = currentLines
            .filter(line => {
                return line.type === 'expression' && line.value.length > 0;
            })
            .map(line => {
                return `${line.value} as ${line.label}`;
            });

        const lineSelections = currentLines
            .filter(line => {
                return line.value.length > 0;
            })
            .map(line => {
                if (line.type === 'item') {
                    return `CASE WHEN "${line.value}" > ${line.max} OR "${line.value}" < ${line.min} THEN -1 ELSE "${line.value}" END AS "${line.label}"`;
                } else {
                    // return `expressions.${line.label}`; // skips CASE min/max checks
                    return `CASE WHEN expressions.${line.label} > ${line.max} OR expressions.${line.label} < ${line.min} THEN -1 ELSE expressions.${line.label} END AS "${line.label}"`;
                }
            });

        expressionWithSelects.unshift('time');
        lineSelections.unshift(`DATETIME(ask.time, "unixepoch") AS time`);

        const withClause = `WITH expressions AS (SELECT ${expressionWithSelects.join(
            ', ',
        )} from ask)`;

        const query = `${
            expressionWithSelects.length > 0 ? withClause : ''
        } SELECT ${lineSelections.join(
            ', ',
        )} FROM ask LEFT JOIN expressions ON ask.time = expressions.time;`;

        return query;
    });

    constructor(
        private readonly httpClient: HttpClient,
        private readonly plotConfigService: PlotConfigService,
    ) {
        void this.loadDatabase();

        // runs the query immediately after every time the sql changes
        // effect(() => {
        //     if (!this.databaseReady()) return;

        //     const query = this.sqlQuery();

        //     this.executeQuery(query);
        // });

        // updates the chart data every time a query is ran
        effect(() => {
            const response = this.lastResponse();

            if (!response || !plotConfigService.chart) return;

            plotConfigService.chart.data = {
                labels: response.values.map(row => row[0] as string),
                datasets: response.columns.slice(1).map((column, index) => ({
                    label: column,
                    data: response.values.map(row => {
                        const val = row[index + 1] as number;
                        return val === -1 ? null : val;
                    }),
                })),
            };

            plotConfigService.chart.update();
        });
    }

    async loadDatabase() {
        this.httpClient.get(URL_MARKET_DB, { responseType: 'blob' }).subscribe(async response => {
            const buffer = await response.arrayBuffer();
            const SQL = await initSqlJs();
            this.database = new SQL.Database(new Uint8Array(buffer));
            this.databaseReady.set(true);
            this.fetchItems();
        });
    }

    fetchItems(): void {
        if (!this.databaseReady() || !this.database) return;

        // Execute a query to get the structure of the ask table
        const query = 'SELECT * FROM ask LIMIT 1';
        const response = this.database.exec(query)[0] as DbResponse;

        if (response) {
            // Extract item names from the columns array, excluding the 'time' column
            this.plotConfigService.items = response.columns.slice(1);
            this.plotConfigService.itemsReady.set(true);
        }
    }

    executeQuery(query: string): void {
        if (!this.databaseReady() || !this.database) return;

        console.log(query);

        const response = this.database.exec(query)[0] as DbResponse;

        console.log(response);

        this.lastResponse.set(response);
    }

    fetchCurrentMarketData(): Observable<any> {
        return this.httpClient.get(URL_MARKETAPI_JSON);
    }
}
