import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output } from '@angular/core';
import { apiStatus } from '@/core/models/api';
import { AccountSelectedView } from '@/home/transfer/components/account-selected/account-selected-view.ng';
import { TranslocoDirective } from '@jsverse/transloco';
import { Card } from '@scb/ui/card';
import { Icon } from '@scb/ui/icon';
import { PendingRequestsApprovalsService } from '../pending-approvals.service';
import { DelegationContainer } from './delegation-container.ng';
import { DelegationExtraField, DelegationExtras } from './delegation-extras.ng';
import { DelegationTimeline } from './delegation-timeline.ng';
import { ChequeDelegationRes, TimelineRes } from './model';

@Component({
  selector: 'app-cheque-approval-details',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Card,
    TranslocoDirective,
    Icon,
    AccountSelectedView,
    DelegationTimeline,
    DelegationContainer,
    DelegationExtras,
  ],
  template: `<app-delegation-container
    [title]="title()"
    [parentPath]="parentPath()"
    [apiStatus]="apiStatus()"
    [status]="status()"
    [pageTitle]="'chequebookDetails'"
    [requestId]="requestId()"
    [type]="type()"
    [approved]="approved()"
    [approvals]="data().approvalRejection"
    (reload)="reload()">
    @if (apiStatus() !== 'loading' && apiStatus() !== 'error') {
      <div
        class="gap-2xl flex flex-1 flex-col"
        *transloco="let t; prefix: 'products'">
        <scb-card class="gap-lg border-border-secondary flex flex-col border">
          <div class="gap-md flex items-center justify-center">
            <div class="bg-icon-container-blue grid h-[32px] w-[32px] place-items-center rounded-full">
              <icon
                [name]="icon()"
                class="text-icon-brand w-2xl" />
            </div>
            <span class="head-xs-s">{{ productDetails()?.branchDetails }}</span>
          </div>
        </scb-card>

        <div class="gap-sm flex flex-col">
          <div class="body-label-md-m text-text-secondary">{{ t('debitedAccount') }}</div>
          <app-account-selected-view
            [nickname]="fromAccount()!.nickname!"
            [accountNumber]="fromAccount()!.accountNumber!" />
        </div>

        <app-delegation-extras [fields]="fields()" />
      </div>
      <!-- Timeline -->
      <app-delegation-timeline
        [data]="data()"
        [status]="status() || ''"
        [extras]="extras()" />
    }
  </app-delegation-container> `,
})
export default class ChequeDetails {
  readonly pendingService = inject(PendingRequestsApprovalsService);

  readonly detailId = input.required<string>();
  readonly parentPath = input.required<string>();
  readonly title = input.required<string>();
  readonly type = input.required<string>();

  readonly productSource = httpResource<ChequeDelegationRes>(
    () => `/api/product/chequebook/workflow/requestStatus/${this.detailId()}`,
  );
  readonly apiStatus = apiStatus(this.productSource.status);

  readonly detailsData = computed(() => this.productSource.value()?.data);
  readonly productDetails = computed(() => this.detailsData()?.chequebookDetail);

  readonly fromAccount = computed(() => ({
    nickname: this.detailsData()?.chequebookDetail.accountNickname,
    accountNumber: this.detailsData()?.chequebookDetail.accountNumber,
  }));
  readonly icon = computed(() => 'time-deposits'); // time-deposits, prod
  readonly status = computed(() => this.productSource.value()?.status);
  readonly requestId = computed(() => this.productSource.value()?.requestId);
  readonly extras = computed(() => {
    const p = this.productDetails();
    if (!p) return undefined;
    return {
      submittedBy: p.submittedBy,
      date: p.createdAt,
      approvals: p.requiredApprovalLevel,
    };
  });

  readonly data = computed(() => {
    const t = this.productSource.value();
    return { users: t?.data.users, approvalRejection: t?.data.approvalRejection } as TimelineRes;
  });

  readonly approved = computed(() => this.productSource.value()?.data.chequebookDetail.approved || 0);
  readonly allFields = computed(() => {
    const d = this.productDetails();
    return <DelegationExtraField[]>[
      //
      { name: 'appliedFees', value: '50 EGP', icon: 'minimum-deposit' },
      { name: 'chargesPaidBy', value: 'Sender', icon: 'profile' },
      { name: 'transactionDate', value: '5 Oct 2025, 12:00 AM', icon: 'calendar' },
      { name: 'reasonOfTransfer', value: 'Family Expenses', icon: 'reason' },
      { name: 'description', value: 'Family Expenses', icon: 'note' },
      //
      { name: 'executionDate', value: '5 Oct 2025, 12:00 AM', icon: 'calendar' },
      //
      { name: 'noOfChequebook', value: d?.chequebooksIssued, icon: 'action-at-maturity' },
      { name: 'leaves', value: d?.leavesCount, icon: 'note' },
      { name: 'deliveryBranch', value: d?.branchDetails, icon: 'bank' },
      {
        name: 'fees',
        amount: {
          value: d?.issueFee,
          currency: d?.accountCurrency,
        },
        icon: 'minimum-deposit',
      },
    ];
  });
  readonly fieldType: Record<string, string[]> = {
    CD: ['interestRate', 'minimumDeposit', 'frequency', 'interestType', 'actionMaturity'],
    TD: ['interestRate', 'minimumDeposit', 'frequency', 'interestType', 'actionMaturity'],
    ACCOUNT: ['frequency', 'chequebook', 'minimumDeposit'],
    CHEQUEBOOK: ['noOfChequebook', 'leaves', 'fees'],
  };

  readonly fields = computed(() => {
    const columns = ['noOfChequebook', 'leaves', 'fees'];
    return this.allFields().filter(x => columns.includes(x.name));
  });

  constructor() {
    effect(() => {
      this.pendingService.requestType.set(this.type());
    });
  }

  reload() {
    this.productSource.reload();
  }
}
