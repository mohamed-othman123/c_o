import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CurrencyView, DateView } from '@/core/components';
import { TranslocoDirective } from '@jsverse/transloco';
import { Icon } from '@scb/ui/icon';

export interface DelegationExtraField {
  name: string;
  value: any;
  icon: string;
  translate: boolean;
  amount: any;
  date: string;
}

@Component({
  selector: 'app-delegation-extras',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, CurrencyView, TranslocoDirective, DateView],
  template: `<div class="gap-2xl grid">
    <!-- transfer -->
    @for (item of fields(); track item.name) {
      <div
        class="gap-sm flex items-center"
        *transloco="let t; prefix: 'products'">
        <icon
          [name]="item.icon"
          class="text-icon-secondary w-[18px]" />
        <div class="body-label-sm-m flex-1">{{ t(item.name) }}</div>
        <div class="body-md-s">
          @if (item.amount) {
            <currency-view
              [amount]="item.amount.value"
              [currency]="item.amount.currency" />
          } @else if (item.date) {
            <date-view
              [value]="item.date"
              format="d MMM yyyy, h:mm a" />
          } @else if (item.translate && item.value) {
            {{ t(item.value) }}
          } @else {
            {{ item.value }}
          }
        </div>
      </div>
    }
  </div>`,
})
export class DelegationExtras {
  readonly fields = input.required<DelegationExtraField[]>();
}
