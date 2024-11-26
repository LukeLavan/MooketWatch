import { HttpClient } from '@angular/common/http';
import { computed, effect, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';

import initSqlJs, { Database } from 'sql.js';
import { Line, PlotConfigService } from './PlotConfig.service';
import { ExpressionValidation } from '../utils/ExpressionValidation.utils';

export const URL_MARKET_DB = 'https://holychikenz.github.io/MWIApi/market.db';
export const URL_MARKETAPI_JSON = 'https://holychikenz.github.io/MWIApi/milkyapi.json';

export type DbResponseRow = (string | number | null)[];
export type DbResponse = { columns: string[]; values: DbResponseRow[] };

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

        // TODO: clean this up
        const lineSelectionsAsk = currentLines
            .filter(line => {
                return line.value.length > 0 && line.type === 'item' && line.table === 'ask';
            })
            .map(line => {
                return `CASE WHEN "${line.value}" > ${line.max} OR "${line.value}" < ${line.min} THEN -1 ELSE "${line.value}" END AS "${line.label}"`;

            });

            const lineSelectionsBid = currentLines
            .filter(line => {
                return line.value.length > 0 && line.type === 'item' && line.table === 'bid';
            })
            .map(line => {
                return `CASE WHEN "${line.value}" > ${line.max} OR "${line.value}" < ${line.min} THEN -1 ELSE "${line.value}" END AS "${line.label}"`;

            });

        lineSelectionsAsk.unshift(`DATETIME(ask.time, "unixepoch") AS time`);
        lineSelectionsBid.unshift(`DATETIME(bid.time, "unixepoch") AS time`);

        const query = `SELECT ${lineSelectionsAsk.join(
            ', ',
        )} FROM ask; SELECT ${lineSelectionsBid.join(
            ', ',
        )} FROM bid;`;

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

        console.log('executing query:', query);

        const response = this.database.exec(query)[0] as DbResponse;

        console.log('got response:', response);

        const hydratedResponse = this.hydrateExpressionValues(response);

        console.log('hydrated response:', hydratedResponse);

        this.lastResponse.set(hydratedResponse);
    }

    hydrateExpressionValues(response: DbResponse): DbResponse {
        const currentLines = ExpressionValidation.getSafeOrderOfEvaluation(this.plotConfigService.currentLines());

        const allColumns = ['time', ...currentLines.map(line => line.label)];

        // items should stay in order and be first, append expression values to each row
        const hydratedValues: DbResponseRow[] = response.values.map(row => { return this.calcRowValues(row, currentLines) });

        return { columns: allColumns, values: hydratedValues };
    }

    calcRowValues(row: DbResponseRow, currentLines: Line[]): DbResponseRow {
        const expressions = currentLines.filter(line => line.type === 'expression');

        // if item values are -1, that literally means they're missing
        const hydratedRow: DbResponseRow = row.map(value => value === -1 ? null : value);

        expressions.forEach((expression, index) => {
            const requiredLabels = ExpressionValidation.getLabels(expression.value);

            const bindings = requiredLabels.reduce((acc, label) => {
                const indexOfLabel = currentLines.findIndex(line => line.label === label) + 1, // time column is index 0
                    valueOfLabel = hydratedRow[indexOfLabel] as number | null; // the only string column is time

                // if any dependent value is missing, propogate the null through to treat it as missing
                if (valueOfLabel === null) { acc[label] = null }
                else { acc[label] = valueOfLabel; }
                return acc;
            }, {} as Record<string, number | null>);

            const value = ExpressionValidation.evaluate(expression.value, bindings);

            if (!value || value > expression.max || value < expression.min) {
                hydratedRow.push(null);
            }
            else {
                hydratedRow.push(value);
            }
        });
        return hydratedRow;

    }

    fetchCurrentMarketData(): Observable<any> {
        return this.httpClient.get(URL_MARKETAPI_JSON);
    }
}
