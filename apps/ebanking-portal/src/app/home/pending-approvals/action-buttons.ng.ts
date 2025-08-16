import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SoftTokenService } from '@/core/components';
import { RolePermissionDirective } from '@/core/directives/role-permission.directive';
import { TranslocoDirective } from '@jsverse/transloco';
import { Button, ButtonSize } from '@scb/ui/button';
import { TransactionsHistoryData } from '../transactions-history/transactions-history';
import { PendingRequestsApprovalsService } from './pending-approvals.service';

@Component({
  selector: 'app-action-buttons',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [TransactionsHistoryData],
  imports: [FormsModule, Button, FormsModule, RolePermissionDirective, TranslocoDirective],
  template: `
    <section
      class="space-x-md"
      *transloco="let t; prefix: 'pendingApprovals.button'">
      <button
        *rolePermission="['CHECKER']"
        scbButton
        [size]="buttonSize()"
        (click)="approveRequest($event)">
        {{ t('approve') }}
      </button>
      <button
        *rolePermission="['CHECKER']"
        scbButton
        [size]="buttonSize()"
        variant="secondary"
        (click)="rejectRequest($event)">
        {{ t('reject') }}
      </button>
      @if (status() === 'PENDING' && approved() === 0) {
        <button
          *rolePermission="['MAKER']"
          scbButton
          [size]="buttonSize()"
          (click)="withdraw($event)">
          {{ t('withdraw') }}
        </button>
      }
    </section>
  `,
})
export class ActionButtons {
  readonly pendingService = inject(PendingRequestsApprovalsService);
  readonly http = inject(HttpClient);
  readonly softToken = inject(SoftTokenService);

  readonly type = input.required<string>();
  readonly requestId = input.required<string>();
  readonly status = input.required<string>();
  readonly approved = input<number>(0);
  readonly buttonSize = input<ButtonSize>('xs');

  readonly loading = signal(false);
  readonly reload = output();

  withdraw(event: MouseEvent) {
    event.stopPropagation();
    const callback = () => {
      this.softToken.closeAll();
      this.reload.emit();
    };
    this.pendingService.withdraw(this.requestId(), callback);
  }

  rejectRequest(event: MouseEvent) {
    event.stopPropagation();
    const dialogRef = this.pendingService.rejectRequestConfirmation(this.requestId());

    dialogRef.afterClosed.subscribe(result => {
      if (result === true) {
        this.reload.emit();
      }
    });
  }

  approveRequest(event: MouseEvent) {
    event.stopPropagation();
    const callback = () => {
      this.softToken.closeAll();
      this.reload.emit();
    };
    this.pendingService.approveRequest(this.requestId(), callback);
  }
}

export interface StatusOptions<T> {
  name: string;
  value: T;
}
