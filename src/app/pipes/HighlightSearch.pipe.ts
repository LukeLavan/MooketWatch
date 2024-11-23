import { Pipe, PipeTransform } from '@angular/core';

/**
 * Wraps matching text in a span with class '.highlight'.
 *
 * Note the global style for '.highlight' in src/styles.scss
 */
@Pipe({
    name: 'highlightSearch',
    standalone: true,
})
export class HighlightSearchPipe implements PipeTransform {
    transform(value: string, search: string): string {
        if (!value || !search) {
            return value;
        }
        const regex = new RegExp(`(${search})`, 'gi');
        return value.replace(regex, '<span class="highlight">$1</span>');
    }
}
