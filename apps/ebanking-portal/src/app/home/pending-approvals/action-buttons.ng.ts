import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SoftTokenService } from '@/core/components';
import { RolePermissionDirective } from '@/core/directives/role-permission.directive';
import { TranslocoDirective } from '@jsverse/transloco';
import { Button } from '@scb/ui/button';
import { TransactionsHistoryData } from '../transactions-history/transactions-history';
import { PendingApprovalsList } from './model';
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
        size="xs"
        (click)="approveRequest(transaction(), $event)">
        {{ t('approve') }}
      </button>
      <button
        *rolePermission="['CHECKER']"
        scbButton
        size="xs"
        variant="secondary"
        (click)="rejectRequest(transaction(), $event)">
        {{ t('reject') }}
      </button>
      @if (type() === 'cheque') {
        @if (transaction().status === 'PENDING' && transaction().approved === 0) {
          <button
            *rolePermission="['MAKER']"
            scbButton
            size="xs"
            (click)="withdraw(transaction(), $event)">
            {{ t('withdraw') }}
          </button>
        }
      } @else if (transaction().status === 'PENDING') {
        <button
          *rolePermission="['MAKER']"
          scbButton
          size="xs"
          (click)="withdraw(transaction(), $event)">
          {{ t('withdraw') }}
        </button>
      }
    </section>
  `,
})
export class ActionButtons {
  readonly pendingService = inject(PendingRequestsApprovalsService);
  readonly softToken = inject(SoftTokenService);
  readonly transaction = input.required<PendingApprovalsList>();
  readonly type = input.required<string>();
  readonly loading = signal(false);
  readonly reload = output();
  readonly http = inject(HttpClient);

  withdraw(payload: PendingApprovalsList, event: MouseEvent) {
    event.stopPropagation();
    const callback = () => {
      this.softToken.closeAll();
      this.reload.emit();
    };
    this.pendingService.withdraw(payload, callback);
  }

  rejectRequest(payload: PendingApprovalsList, event: MouseEvent) {
    event.stopPropagation();
    const dialogRef = this.pendingService.rejectRequestConfirmation(payload);

    dialogRef.afterClosed.subscribe(result => {
      if (result === true) {
        this.reload.emit();
      }
    });
  }

  approveRequest(payload: PendingApprovalsList, event: MouseEvent) {
    event.stopPropagation();
    const callback = () => {
      this.softToken.closeAll();
      this.reload.emit();
    };
    this.pendingService.approveRequest(payload, callback);
  }
}

export interface StatusOptions<T> {
  name: string;
  value: T;
}
