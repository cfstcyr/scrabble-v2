/* eslint-disable no-redeclare */
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface FocusableComponent<T> {
    onLoseFocusEvent?(): void;
    onFocusableEvent?(value: T): void;
}

export abstract class FocusableComponent<T> {
    private focusableEvent: Subject<T> = new Subject();
    private loseFocusEvent: Subject<void> = new Subject();
    private focusableComponentDestroyed$: Subject<boolean> = new Subject();

    emitFocusableEvent(value: T) {
        this.focusableEvent.next(value);
    }

    emitLoseFocusEvent() {
        this.loseFocusEvent.next();
    }

    protected subscribeToFocusableEvent(destroy$: Subject<boolean>, next: (value: T) => void) {
        this.focusableEvent.pipe(takeUntil(destroy$)).subscribe(next);
    }

    protected subscribeToLooseFocusEvent(destroy$: Subject<boolean>, next: () => void) {
        this.loseFocusEvent.pipe(takeUntil(destroy$)).subscribe(next);
    }

    protected subscribe(): void {
        this.focusableEvent.pipe(takeUntil(this.focusableComponentDestroyed$)).subscribe(this.onFocusableEvent);
        this.loseFocusEvent.pipe(takeUntil(this.focusableComponentDestroyed$)).subscribe(this.onLoseFocusEvent);
    }

    protected destroy(): void {
        this.focusableComponentDestroyed$.next(true);
        this.focusableComponentDestroyed$.complete();
    }
}
