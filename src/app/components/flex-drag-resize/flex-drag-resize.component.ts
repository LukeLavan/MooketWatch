import { Component, HostListener, input } from '@angular/core';
import { Subject } from 'rxjs';

/**
 * TODO: add visual feedback during dragging
 */
@Component({
    selector: 'flex-drag-resize',
    templateUrl: './flex-drag-resize.component.html',
    styleUrls: ['./flex-drag-resize.component.scss'],
})
export class FlexDragResizeComponent {
    isDragging = false;

    containerOffsetLeft = input.required<number>();
    leftMinWidth = input.required<number>();

    leftWidth$ = new Subject<string>();

    @HostListener('mousedown', ['$event']) onMouseDown(event: MouseEvent) {
        this.isDragging = true;
    }

    @HostListener('mouseup', ['$event']) onMouseUp(event: MouseEvent) {
        this.emitNextWidth(event.clientX);
        this.isDragging = false;
    }

    emitNextWidth(clientX: number): void {
        if (!this.isDragging) return;

        var pointerRelativeX = clientX - this.containerOffsetLeft();

        const newWidth = Math.max(this.leftMinWidth(), pointerRelativeX - 8) + 'px'; // 8px for pseudo element spacing

        this.leftWidth$.next(newWidth);
    }
}
