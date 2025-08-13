import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Icon } from '@scb/ui/icon';

@Component({
  selector: '[timelineTitle]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  host: {
    class: 'gap-md body-md-s flex',
  },
})
export class TimelineTitle {}

@Component({
  selector: '[timelineSub]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  host: {
    class: 'body-md text-text-tertiary',
  },
})
export class TimelineSub {}

@Component({
  selector: 'app-timeline',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `<div class="gap-xl ng-star-inserted flex">
    <div class="flex w-3xl flex-col items-center">
      @switch (status()) {
        @case ('default') {
          <div class="h-xl bg-brand ng-star-inserted m-sm w-xl rounded-full"></div>
        }
        @case ('pending') {
          <div class="h-xl ng-star-inserted m-sm border-border-primary w-xl rounded-full border"></div>
        }
        @case ('active') {
          <icon
            name="timeline-pending"
            class="ng-star-inserted inline-block" />
        }
        @case ('approved') {
          <icon
            name="check-green"
            class="p-sm ng-star-inserted inline-block" />
        }
        @case ('rejected') {
          <icon
            name="rejected"
            class="ng-star-inserted inline-block" />
        }
      }
      @if (!isLast()) {
        <div class="border-border-hard ng-star-inserted w-[1px] flex-1 border border-dashed"></div>
      }
    </div>
    <div class="gap-md pb-3xl flex flex-col">
      <ng-content select="[timelineTitle]" />
      <ng-content select="[timelineSub]" />
      <div class="body-md text-text-secondary gap-md flex flex-col">
        <ng-content />
      </div>
    </div>
  </div>`,
})
export class Timeline {
  readonly isLast = input(false);
  readonly status = input<'pending' | 'approved' | 'rejected' | 'default' | 'active'>('default');
}
