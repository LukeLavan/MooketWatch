import { ExpressionValidation } from './ExpressionValidation.utils';
import { Line, PlotConfigService } from '../services/PlotConfig.service';

import { expect, describe, it, beforeEach } from '@jest/globals';
import { TestBed } from '@angular/core/testing';

describe('ExpressionValidation', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                { provide: PlotConfigService, useValue: {} },
                ExpressionValidation
            ]
        });
    })
    describe('getLabels', () => {
        it('should extract labels from double-quoted strings', () => {
            const expression = 'label1 "label2" label3 "label4"';
            const labels = ExpressionValidation.getLabels(expression);
            expect(labels).toEqual(['label2', 'label4']);
        });

        it('should return an empty array if no labels are found', () => {
            const expression = 'label1 label2 label3 label4';
            const labels = ExpressionValidation.getLabels(expression);
            expect(labels).toEqual([]);
        });
    });

    describe('validateAllowedCharacters', ()=>{
        it('should return true for expressions with allowed characters', () => {
            expect(ExpressionValidation.validateAllowedCharacters('"B" + "C"')).toBe(true);
            expect(ExpressionValidation.validateAllowedCharacters('"B" + "C" / 2')).toBe(true);
            expect(ExpressionValidation.validateAllowedCharacters('3*"Z" - ("C" + 2)')).toBe(true);
        });

        it('should return false for expressions with disallowed characters', () => {
            expect(ExpressionValidation.validateAllowedCharacters('"B" + "C" % 2')).toBe(false);
            expect(ExpressionValidation.validateAllowedCharacters('"B" + "C" ^ 2')).toBe(false);
        });
    })

    describe('validateQuotes', () => {
        it('should return true for even number of quotes', () => {
            const expression = 'label1 "label2" label3 "label4"';
            const result = ExpressionValidation.validateQuotes(expression);
            expect(result).toBe(true);
        });

        it('should return false for odd number of quotes', () => {
            const expression = 'label1 "label2" label3 "label4';
            const result = ExpressionValidation.validateQuotes(expression);
            expect(result).toBe(false);
        });
    });

    describe('validateLabelsExist', () => {
        it('should return true for existing labels', () => {
            const labels = ['A', 'B', 'C'];
            const currentLines = [
                { label: 'A', type: 'item', value: '1' },
                { label: 'B', type: 'item', value: '2' },
                { label: 'C', type: 'item', value: '3' },
            ] as unknown as Line[];
            const result = ExpressionValidation.validateLabelsExist(labels, currentLines);
            expect(result).toBe(true);
        });

        it('should return false for non-existing labels', () => {
            const labels = ['A', 'B', 'C'];
            const currentLines = [
                { label: 'A', type: 'item', value: '1' },
                { label: 'B', type: 'item', value: '2' },
            ] as unknown as Line[];
            const result = ExpressionValidation.validateLabelsExist(labels, currentLines);
            expect(result).toBe(false);
        });
    });

    describe('validateNoCircularLabelReferences', () => {
        it('should return false for self-referencing expression', () => {
            const currentLines = [
                { label: 'A', type: 'expression', value: '"A"' },
            ] as unknown as Line[];
                        const expression = currentLines[0];

            const result = ExpressionValidation.validateNoCircularLabelReferences(expression, currentLines);
            expect(result).toBe(false);
        });

        it('should return false for circular label references', () => {
            const currentLines = [
                { label: 'A', type: 'expression', value: '"B"' },
                { label: 'B', type: 'expression', value: '"C"' },
                { label: 'C', type: 'expression', value: '"A"' },
            ] as unknown as Line[];
                        const expression = currentLines[0];

            const result = ExpressionValidation.validateNoCircularLabelReferences(expression, currentLines);
            expect(result).toBe(false);
        });

        it('should return true for non-circular label references', () => {
            const currentLines = [
                { label: 'A', type: 'expression', value: '"B"' },
                { label: 'B', type: 'expression', value: '"C"' },
                { label: 'C', type: 'expression', value: '"D"' },
            ] as unknown as Line[];
                        const expression = currentLines[0];

            const result = ExpressionValidation.validateNoCircularLabelReferences(expression, currentLines);
            expect(result).toBe(true);
        });

        it('should return true when there are no expressions', () => {
            const currentLines = [
                { label: 'A', type: 'item', value: '1' },
                { label: 'B', type: 'item', value: '2' },
            ] as unknown as Line[];
                        const expression = currentLines[0];

            const result = ExpressionValidation.validateNoCircularLabelReferences(expression, currentLines);
            expect(result).toBe(true);
        });

        it('should handle complex non-circular references', () => {
            const currentLines = [
                { label: 'A', type: 'expression', value: '"B" * "C"' },
                { label: 'B', type: 'expression', value: '"D"' },
                { label: 'C', type: 'expression', value: '"E"' },
                { label: 'D', type: 'item', value: '1' },
                { label: 'E', type: 'item', value: '2' },
            ] as unknown as Line[];
            const expression = currentLines[0];
            const result = ExpressionValidation.validateNoCircularLabelReferences(expression, currentLines);
            expect(result).toBe(true);
        });
    });

    describe('validateNumericalOutput', () => {
        it('should return true for expressions that result in a numerical value', () => {
            expect(ExpressionValidation.validateNumericalOutput('"B" + "C"')).toBe(true);
            expect(ExpressionValidation.validateNumericalOutput('"B" + "C" / 2')).toBe(true);
            expect(ExpressionValidation.validateNumericalOutput('3*"Z" - ("C" + 2)')).toBe(true);
        });

        it('should return false for an expressions with incorrect math', () => {
            expect(ExpressionValidation.validateNumericalOutput('"B" + "C" / "D"')).toBe(false); // potential division by 0
            expect(ExpressionValidation.validateNumericalOutput('"B" + ("C" + "D"')).toBe(false);
        });
    });
    describe('validateExpression', () => {
        it('should return true for a valid expression with correct quotes and existing labels', () => {
            const currentLines = [
                { label: 'A', type: 'expression', value: '"B" + "C"' },
                { label: 'B', type: 'item', value: '1' },
                { label: 'C', type: 'item', value: '2' },
            ] as unknown as Line[];
            const expression = currentLines[0];
            const result = ExpressionValidation.validateExpression(expression, currentLines);
            expect(result).toBe(true);
        });

        it('should return false for an expression with incorrect quotes', () => {
            const currentLines = [
                { label: 'A', type: 'expression', value: '"B + "C"' },
                { label: 'B', type: 'item', value: '1' },
                { label: 'C', type: 'item', value: '2' },
            ] as unknown as Line[];
            const expression = currentLines[0];

            const result = ExpressionValidation.validateExpression(expression, currentLines);
            expect(result).toBe(false);
        });

        it('should return false for an expression with non-existing labels', () => {
            const currentLines = [
                { label: 'A', type: 'expression', value: '"B" + "D"' },
                { label: 'B', type: 'item', value: '1' },
                { label: 'C', type: 'item', value: '2' },
            ] as unknown as Line[];
            const expression = currentLines[0];

            const result = ExpressionValidation.validateExpression(expression, currentLines);
            expect(result).toBe(false);
        });

        it('should return false for an expression with circular references', () => {
            const currentLines = [
                { label: 'A', type: 'expression', value: '"B"' },
                { label: 'B', type: 'expression', value: '"A"' },
            ] as unknown as Line[];
            const expression = currentLines[0];

            const result = ExpressionValidation.validateExpression(expression, currentLines);
            expect(result).toBe(false);
        });

        it('should return true for a complex valid expression', () => {
            const currentLines = [
                { label: 'A', type: 'expression', value: '"B" * ("C" + "D")' },
                { label: 'B', type: 'item', value: '1' },
                { label: 'C', type: 'item', value: '2' },
                { label: 'D', type: 'item', value: '3' },
            ] as unknown as Line[];
            const expression = currentLines[0];

            const result = ExpressionValidation.validateExpression(expression, currentLines);
            expect(result).toBe(true);
        });

        it('should return false for an expression with mixed valid and invalid labels', () => {
            const currentLines = [
                { label: 'A', type: 'expression', value: '"B" + "E"' },
                { label: 'B', type: 'item', value: '1' },
                { label: 'C', type: 'item', value: '2' },
                { label: 'D', type: 'item', value: '3' },
            ] as unknown as Line[];
            const expression = currentLines[0];

            const result = ExpressionValidation.validateExpression(expression, currentLines);
            expect(result).toBe(false);
        });
    });

    describe('getSafeOrderOfEvaluation', () => {
        it('should return a safe order of evaluation for a simple expression', () => {
            const currentLines = [
                { label: 'A', type: 'expression', value: '"B" + "C"' },
                { label: 'B', type: 'item', value: '1' },
                { label: 'C', type: 'item', value: '2' },
            ] as unknown as Line[];

            const result = ExpressionValidation.getSafeOrderOfEvaluation(currentLines);
            expect(result.map(line=>line.label)).toEqual(['B', 'C', 'A']);
        });

        it('should return a safe order of evaluation for a complex expression', () => {
            const currentLines = [
                { label: 'A', type: 'expression', value: '"B" * ("C" + "D")' },
                { label: 'B', type: 'item', value: '1' },
                { label: 'C', type: 'item', value: '2' },
                { label: 'D', type: 'item', value: '3' },
            ] as unknown as Line[];

            const result = ExpressionValidation.getSafeOrderOfEvaluation(currentLines);
            expect(result.map(line=>line.label)).toEqual(['B', 'C', 'D', 'A']);
        });
    })
});
