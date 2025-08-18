import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { CurrencyView } from '@/core/components';
import { apiStatus } from '@/core/models/api';
import { AccountSelectedView } from '@/home/transfer/components/account-selected/account-selected-view.ng';
import { BeneficiarySelectedView } from '@/home/transfer/components/beneficiary-selected/beneficiary-selected-view.ng';
import { TransferDataResponse } from '@/home/transfer/model';
import { LayoutFacadeService } from '@/layout/layout.facade.service';
import { TranslocoDirective } from '@jsverse/transloco';
import { Card } from '@scb/ui/card';
import { PendingRequestsApprovalsService } from '../pending-approvals.service';
import { DelegationContainer } from './delegation-container.ng';
import { DelegationExtraField, DelegationExtras } from './delegation-extras.ng';
import { DelegationTimeline } from './delegation-timeline.ng';
import { ITransferDetails, TimelineRes, TransferApprovalDetails } from './model';

@Component({
  selector: 'app-transfer-approval-details',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Card,
    TranslocoDirective,
    CurrencyView,
    AccountSelectedView,
    DelegationTimeline,
    BeneficiarySelectedView,
    DelegationContainer,
    DelegationExtras,
  ],
  template: `<app-delegation-container
    [title]="title()"
    [parentPath]="parentPath()"
    [apiStatus]="apiStatus()"
    [status]="status()"
    [pageTitle]="'transferDetails'"
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
          <div class="flex justify-center">
            <currency-view
              [amount]="detailsData()?.transferAmount"
              [currency]="detailsData()?.transferCurrency"
              size="xl"
              variant="primary" />
          </div>
          <div class="gap body-md-s flex items-center justify-center gap-1">
            <span>{{ cardTitle() }}</span>
          </div>
        </scb-card>

        <div class="gap-sm flex flex-col">
          <div class="body-label-md-m text-text-secondary">{{ t('from') }}</div>
          <app-account-selected-view
            [nickname]="fromAccount()!.accountNickname"
            [accountNumber]="fromAccount()!.accountNumber" />
        </div>
        @if (toAccount(); as ta) {
          <div class="gap-sm flex flex-col">
            <div class="body-label-md-m text-text-secondary">{{ t('to') }}</div>
            <app-account-selected-view
              [nickname]="ta.accountNickname"
              [accountNumber]="ta.accountNumber" />
          </div>
        }
        @if (detailsData()?.transferType !== 'OWN' && beneficiary(); as b) {
          <div class="gap-sm flex flex-col">
            <div class="body-label-md-m text-text-secondary">{{ t('to') }}</div>
            <app-beneficiary-selected-view [beneficiary]="b" />
          </div>
        }

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
export default class TransferDetails {
  readonly pendingService = inject(PendingRequestsApprovalsService);
  readonly layoutFacade = inject(LayoutFacadeService);

  readonly detailId = input.required<string>();
  readonly parentPath = input.required<string>();
  readonly title = input.required<string>();
  readonly type = input.required<string>();

  readonly productSource = httpResource<ITransferDetails>(
    () => `/api/transfer/transfer-workflow/${this.detailId()}/details`,
  );
  readonly timelineSource = httpResource<TransferApprovalDetails>(
    () => `/api/transfer/transfer-workflow/${this.detailId()}/approval-timeline`,
  );
  readonly transferLookupSource = httpResource<TransferDataResponse>(() => {
    const _ = this.layoutFacade.language();
    return `/api/transfer/lookup/transfer-data`;
  });
  readonly lookupData = computed(() => this.transferLookupSource.value());

  readonly apiStatus = apiStatus(this.productSource.status);

  readonly detailsData = computed(() => this.productSource.value());

  readonly cardTitle = computed(() => {
    const { transferType, transferNetwork } = this.lookupData() || {};
    const { transferType: type, transferNetwork: network } = this.detailsData() || {};
    const v = transferType?.find(x => x.key === type)?.value;
    if (!v) return 'Loading...';
    if (type !== 'OUTSIDE') return v;
    return `${v} - ${transferNetwork?.find(x => x.key === network)?.value}`;
  });

  readonly extras = computed(() => {
    const p = this.detailsData();
    const t = this.timelineSource.value();
    if (!p || !t) return undefined;
    const submitted = t.approvalTimeline.find(x => x.status === 'SUBMITTED')!;
    return {
      submittedBy: submitted.fullName,
      date: submitted.timestamp,
      approvals: t.totalNumberOfApproval,
    };
  });
  readonly data = computed(() => {
    const t = this.timelineSource.value();
    return { users: t?.checkerUsers, approvalRejection: t?.approvalTimeline } as unknown as TimelineRes;
  });

  readonly approved = computed(
    () => this.timelineSource.value()?.approvalTimeline.filter(x => x.status === 'APPROVED').length || 0,
  );
  readonly fromAccount = computed(() => this.detailsData()?.fromAccount);
  readonly toAccount = computed(() => this.detailsData()?.toAccount);
  readonly beneficiary = computed(() => this.detailsData()?.beneficiary);

  readonly icon = computed(() => 'time-deposits'); // time-deposits, prod

  // readonly detailType = computed(() => this.productDetails()?.requestType);
  readonly status = computed(() => {
    const s = this.detailsData()?.transferWorkflowStatus;
    return s === 'PENDING_APPROVAL' ? 'PENDING' : s;
  });
  readonly requestId = computed(() => this.detailsData()?.transferId);

  readonly allFields = computed(() => {
    const d = this.detailsData();
    const lookup = this.lookupData();
    return <DelegationExtraField[]>[
      //
      {
        name: 'appliedFees',
        amount: { value: d?.fees, currency: d?.feesCurrency },
        icon: 'minimum-deposit',
      },
      {
        name: 'chargesPaidBy',
        value: lookup?.chargeBearer.find(x => x.key === d?.chargeBearer)?.value,
        icon: 'profile',
      },
      { name: 'reasonOfTransfer', value: d?.transferReason, icon: 'reason' },
      { name: 'description', value: d?.description || '-', icon: 'note' },
      { name: 'executionDate', date: d?.transactionDate, icon: 'calendar' },
      // { name: 'transactionDate', value: '5 Oct 2025, 12:00 AM', icon: 'calendar' },
      // { name: 'chequebook', value: d?.chequebook, icon: 'note' },
      // //
      // //
      // { name: 'interestRate', value: `${d?.interestRate}%`, icon: 'interest-rates' },
      // { name: 'tenor', value: `${d?.interestRate}%`, icon: 'clock' },
      // { name: 'currency', value: d?.interestRate, icon: 'currency' },
      // {
      //   name: 'minimumDeposit',
      //   amount: { value: d?.minimumDepositAmount, currency: d?.currency },
      //   icon: 'minimum-deposit',
      // },
      // { name: 'frequency', value: d?.frequency, translate: true, icon: 'money-receive' },
      // {
      //   name: 'interestType',
      //   value: d?.interestType,
      //   translate: true,
      //   icon: 'interest-types',
      // },
      // { name: 'actionMaturity', value: d?.actionAtMaturity, translate: true, icon: 'action-at-maturity' },
      // { name: 'noOfChequebook', value: d?.chequebooksIssued, icon: 'action-at-maturity' },
      // { name: 'leaves', value: d?.leavesCount, icon: 'action-at-maturity' },
      // { name: 'deliveryBranch', value: d?.branchDetails, icon: 'action-at-maturity' },
      // {
      //   name: 'fees',
      //   amount: {
      //     value: d?.issueFee,
      //     currency: d?.currency,
      //   },
      //   icon: 'action-at-maturity',
      // },
    ];
  });
  readonly fieldType: Record<string, string[]> = {
    OUTSIDE: ['appliedFees', 'chargesPaidBy', 'reasonOfTransfer', 'description', 'executionDate'],
    INSIDE: ['reasonOfTransfer', 'description', 'executionDate'],
    OWN: ['description', 'executionDate'],
    CHARITY: ['executionDate'],
  };

  readonly fields = computed(() => {
    const columns = this.fieldType[this.detailsData()?.transferType || ''] || [];
    return this.allFields().filter(x => columns.includes(x.name));
  });

  constructor() {
    effect(() => {
      this.pendingService.requestType.set(this.type());
    });
  }

  reload() {
    this.productSource.reload();
    this.timelineSource.reload();
  }
}
