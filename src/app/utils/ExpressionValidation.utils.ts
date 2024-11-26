import { number, parser } from 'mathjs';

import { Line, PlotConfigService } from '../services/PlotConfig.service';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Injectable, Signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ExpressionValidation {
    /** Returns the content of quotes within expression; assumes well-formed input. */
    static getLabels(expression: string): string[] {
        const regex = /"([^"]*)"/g;
        const matches = [];
        let match;

        while ((match = regex.exec(expression)) !== null) {
            matches.push(match[1] || match[2]);
        }

        return matches;
    }

    /** Validates if only allowed characters are used within the given expression. */
    static validateAllowedCharacters(expression: string): boolean {
        const allowedCharactersRegex = /^[0-9a-zA-Z\+\-\*\/\(\)\"\ ]*$/;
        return allowedCharactersRegex.test(expression);
    }

    /**
     * Validates if quotes are used correctly in the expression.
     */
    static validateQuotes(expression: string): boolean {
        const quoteCount = (expression.match(/"/g) || []).length;
        return quoteCount % 2 === 0;
    }

    /**
     * Validates that the given labels exist within the given line configuration.
     */
    static validateLabelsExist(labels: string[], currentLines: Line[]): boolean {
        const currentLabels = currentLines.map(line => line.label);
        return labels.every(label => currentLabels.includes(label));
    }

    /**
     * Validates that no circular references exist in the given line configuration.
     */
    static validateNoCircularLabelReferences(expression: Line, currentLines: Line[]): boolean {
        const visited = new Set<string>();
        const stack = new Set<string>();

        const hasCircularReference = (label: string): boolean => {
            if (stack.has(label)) {
                return true;
            }
            if (visited.has(label)) {
                return false;
            }

            visited.add(label);
            stack.add(label);

            const line = currentLines.find(line => line.label === label);
            if (line && line.type === 'expression') {
                const labels = ExpressionValidation.getLabels(line.value);
                for (const lbl of labels) {
                    if (hasCircularReference(lbl)) {
                        return true;
                    }
                }
            }

            stack.delete(label);
            return false;
        };

        return !hasCircularReference(expression.label)

    }

    /**
     * Re-arranges the given lines to ensure that expressions are evaluated in a safe order.
     * All item type lines are listed first, followed by expressions in a safe order of evaluation.
     * This function assumes well formed input (ie, already checked for circular references).
     */
    static getSafeOrderOfEvaluation(currentLines: Line[]): Line[] {
        const itemLines = currentLines.filter(line => line.type === 'item');
        const expressionLines = currentLines.filter(line => line.type === 'expression');

        const safeOrder: Line[] = [];

        const evaluateExpression = (line: Line): void => {
            const labels = ExpressionValidation.getLabels(line.value);
            labels.forEach(label => {
                const dependentLine = currentLines.find(l => l.label === label);
                if (dependentLine && dependentLine.type === 'expression') {
                    evaluateExpression(dependentLine);
                }
            });

            safeOrder.push(line);
        };

        expressionLines.forEach(line => evaluateExpression(line));

        return [...itemLines, ...safeOrder];
    }

    /** Validates that the given expression will result in a numerical value
     * TODO: this should call evaluate
     */
    static validateNumericalOutput(expression: string): boolean {
        const transformedLabels = ExpressionValidation.getLabels(expression).map(label =>
            label.replace(/\s+/g, ''),
        );
        // each label is bound to 0 to prevent dividing by an expression
        const quoteParser = parser();

        try {
            transformedLabels.forEach(label => {
                quoteParser.set(label, 0);
            });
            const cleanedExpression = expression.replace(/"([^"]*)"/g, (_match, p1) =>
                p1.replace(/\s+/g, ''),
            );
            const result = number(quoteParser.evaluate(cleanedExpression));
            return !isNaN(result);
        } catch (e) {
            console.log('validating numerical output of expression resulted in an error:', e);
            return false;
        }
    }

    static evaluate(expression: string, bindings: Record<string, number | null>): number | null {
        // propogate null values as missing
        if(Object.values(bindings).find(value => value === null) !== undefined) return null;

        try {
            const quoteParser = parser();
            
            Object.keys(bindings).forEach(binding => {
                quoteParser.set(binding.replace(/\s+/g, ''), bindings[binding])
            })

            const cleanedExpression = expression.replace(/"([^"]*)"/g, (_match, p1) =>
                p1.replace(/\s+/g, ''),
            );

            const result = number(quoteParser.evaluate(cleanedExpression));

            if (isNaN(result)) throw new Error('Expression did not evaluate to a number');

            return result;
        } catch (e) {
            console.error('Evaulating numerical output of expression resulted in an error:', e);

            return null;
        }
    }

    /**
     * Validates the specified expression against the given line configuration.
     * Note the specified expression is expected to exist inside the currentLines array.
     */
    static validateExpression(expression: Line, currentLines: Line[]): boolean {
        const value = expression.value;

        return (
            this.validateAllowedCharacters(value) &&
            this.validateQuotes(value) &&
            this.validateLabelsExist(this.getLabels(value), currentLines) &&
            this.validateNoCircularLabelReferences(expression, currentLines) &&
            this.validateNumericalOutput(value)
        );
    }

    constructor(private readonly plotConfigService: PlotConfigService) { }

    Validator(): ValidatorFn {
        return (control: AbstractControl<Line>): ValidationErrors | null => {
            const expression = control.value, value = expression.value;

            if (!value) {
                return { required: 'Expressions must contain a value' };
            }

            // no further checks required for non-expressions
            if (expression.type === 'item') {
                return null;
            }

            if (!ExpressionValidation.validateAllowedCharacters(value)) {
                return {
                    invalidCharacters:
                        'Expressions must only contain numbers, letters, +, -, *, /, (, ), ", and spaces',
                };
            }

            if (!ExpressionValidation.validateQuotes(value)) {
                return { unbalancedQuotes: 'Expression must have an even number of quotes' };
            }

            if (!ExpressionValidation.validateLabelsExist(ExpressionValidation.getLabels(value), this.plotConfigService.currentLines())) {
                return {
                    nonExistentLabels:
                        'Expressions must reference labels that exist in the current configuration',
                };
            }

            if (!ExpressionValidation.validateNoCircularLabelReferences(expression, this.plotConfigService.currentLines())) {
                return { circularReference: 'Expressions must not contain circular references' };
            }

            if (!ExpressionValidation.validateNumericalOutput(value)) {
                return { invalidOutput: 'Expressions must evaluate to a numerical value' };
            }

            return null;
        };
    }
}