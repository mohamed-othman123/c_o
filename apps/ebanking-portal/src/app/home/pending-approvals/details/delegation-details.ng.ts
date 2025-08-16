import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal, WritableSignal } from '@angular/core';
import { AppBreadcrumbsComponent, CurrencyView, DateView, Skeleton } from '@/core/components';
import { apiStatus } from '@/core/models/api';
import { Beneficiary } from '@/home/beneficiary/models/models';
import { AccountSelectedView } from '@/home/transfer/components/account-selected/account-selected-view.ng';
import { BeneficiarySelectedView } from '@/home/transfer/components/beneficiary-selected/beneficiary-selected-view.ng';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { Badge, BadgeType } from '@scb/ui/badge';
import { Button } from '@scb/ui/button';
import { Card } from '@scb/ui/card';
import { Icon } from '@scb/ui/icon';
import { Separator } from '@scb/ui/separator';
import { ActionButtons } from '../action-buttons.ng';
import { PendingRequestsApprovalsService } from '../pending-approvals.service';
import { Timeline, TimelineSub, TimelineTitle } from '../timeline.ng';
import { LevelUser } from './model';
import { universalDelegationParse } from './products-adapter';

interface ApprovalList {
  level: string;
  status: 'REJECTED' | 'PENDING' | 'APPROVED';
  approvedBy?: string;
  createdAt?: string;
  expanded?: WritableSignal<boolean>;
  reason?: string;
  users?: LevelUser[];
  isCore: boolean;
}

@Component({
  selector: 'app-delegation-details',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [PendingRequestsApprovalsService],
  imports: [
    AppBreadcrumbsComponent,
    Card,
    Skeleton,
    TranslocoDirective,
    Icon,
    Button,
    CurrencyView,
    AccountSelectedView,
    Badge,
    Separator,
    DateView,
    Timeline,
    TimelineTitle,
    TimelineSub,
    BeneficiarySelectedView,
    ActionButtons,
  ],
  templateUrl: './delegation-details.ng.html',
  host: {
    class: 'container-grid py-3xl px-3xl',
  },
})
export default class DelegationDetails {
  readonly translateService = inject(TranslocoService);

  readonly detailId = input.required<string>();
  readonly parentPath = input.required<string>();
  readonly title = input.required<string>();

  readonly productSource = httpResource(
    () =>
      this.parentPath() === '/pending-cheques'
        ? `/api/product/chequebook/workflow/requestStatus/${this.detailId()}`
        : `/api/product/product/request/${this.detailId()}/details`,
    {
      parse: universalDelegationParse(this.parentPath),
    },
  );
  readonly apiStatus = apiStatus(this.productSource.status);
  readonly detailsData = computed(() => this.productSource.value()?.data);
  readonly productDetails = computed(() => this.detailsData()?.details);
  readonly beneficiary = computed(() => this.detailsData()?.details.beneficiary);

  readonly fromAccount = computed(() => this.detailsData()?.details.from);
  readonly icon = computed(() => 'time-deposits'); // time-deposits, prod
  readonly detailType = computed(() => this.productDetails()?.requestType);
  readonly status = computed(() => this.productDetails()?.status);
  readonly requestId = computed(() => this.productDetails()?.requestId);

  readonly detailStatus = computed<BadgeType | undefined>(() => {
    const type = this.productDetails()?.status;
    const dd: Record<string, BadgeType> = {
      PENDING: 'warning',
      APPROVED: 'success',
      REJECTED: 'red',
      CANCELLED: 'grey',
    };
    return type ? dd[type] : undefined;
  });

  readonly timeline = computed(() => {
    const data = this.detailsData();
    const d = data?.details;
    const allUsers = data?.users || {};
    return {
      user: {
        name: d?.submittedBy,
        date: d?.createdDate,
      },
      approvals: <ApprovalList[]>[
        ...Array.from({ length: d?.requiredApproval || 0 }, (x, i) => {
          const role = `CHECKER_LEVEL_${i + 1}`;
          const users = allUsers[role];
          const approval = data?.approvalRejection.find(x => x.role.toUpperCase() === role);
          const v: ApprovalList = {
            level: `Level ${i + 1}`,
            status: 'PENDING',
            expanded: signal(false),
            users,
            isCore: false,
          };
          if (approval) {
            v.approvedBy = approval.approverName;
            v.status = approval.status as any;
            v.createdAt = approval.createdAt;
            v.reason = approval.note;
          }
          return v;
        }),
        {
          level: 'Sent to core banking',
          status: 'pending',
          isCore: true,
        },
      ],
    };
  });
  readonly allFields = computed(() => {
    const d = this.productDetails();
    return [
      //
      { name: 'appliedFees', value: '50 EGP', icon: 'minimum-deposit' },
      { name: 'chargesPaidBy', value: 'Sender', icon: 'profile' },
      { name: 'transactionDate', value: '5 Oct 2025, 12:00 AM', icon: 'calendar' },
      { name: 'reasonOfTransfer', value: 'Family Expenses', icon: 'reason' },
      { name: 'description', value: 'Family Expenses', icon: 'note' },
      { name: 'chequebook', value: d?.chequebookAvailable, icon: 'note' },
      //
      { name: 'executionDate', value: '5 Oct 2025, 12:00 AM', icon: 'calendar' },
      //
      { name: 'interestRate', value: `${d?.interestRate}%`, icon: 'interest-rates' },
      { name: 'tenor', value: `${d?.interestRate}%`, icon: 'clock' },
      { name: 'currency', value: d?.interestRate, icon: 'currency' },
      {
        name: 'minimumDeposit',
        amount: {
          value: d?.minimumDepositAmount,
          currency: d?.currency,
        },
        icon: 'minimum-deposit',
      },
      { name: 'frequency', value: d?.frequency, translate: true, icon: 'money-receive' },
      {
        name: 'interestType',
        value: d?.interestType,
        translate: true,
        icon: 'interest-types',
      },
      { name: 'actionMaturity', value: d?.actionAtMaturity, translate: true, icon: 'action-at-maturity' },
    ];
  });
  readonly fieldType: Record<string, string[]> = {
    CD: ['interestRate', 'minimumDeposit', 'frequency', 'interestType', 'actionMaturity'],
    ACCOUNT: ['frequency', 'chequebook', 'minimumDeposit'],
  };

  readonly fields = computed(() => {
    const columns = this.fieldType[this.productDetails()?.requestType || ''] || [];
    return this.allFields().filter(x => columns.includes(x.name));
  });

  reload() {
    this.productSource.reload();
  }
}
