import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal, WritableSignal } from '@angular/core';
import { AppBreadcrumbsComponent, CurrencyView, DateView, Skeleton } from '@/core/components';
import { RolePermissionDirective } from '@/core/directives/role-permission.directive';
import { ApiResult, apiStatus } from '@/core/models/api';
import { Beneficiary } from '@/home/beneficiary/models/models';
import { AccountSelectedView } from '@/home/transfer/components/account-selected/account-selected-view.ng';
import { BeneficiarySelectedView } from '@/home/transfer/components/beneficiary-selected/beneficiary-selected-view.ng';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { Badge, BadgeType } from '@scb/ui/badge';
import { Button } from '@scb/ui/button';
import { Card } from '@scb/ui/card';
import { Icon } from '@scb/ui/icon';
import { Separator } from '@scb/ui/separator';
import { Timeline, TimelineSub, TimelineTitle } from '../timeline.ng';
import { ApiRes, DelegationDetail, LevelUser } from './model';

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
    RolePermissionDirective,
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

  readonly fromAccount = signal({ accountNickname: 'Nickname', accountNumber: '12334812781289' });

  readonly detailSource = httpResource<ApiRes<DelegationDetail>>(
    () => `/api/product/product/request/${this.detailId()}/details`,
  );
  readonly status = apiStatus(this.detailSource.status);
  readonly detailsData = computed(() => this.detailSource.value()?.data);
  readonly productDetails = computed(() => this.detailsData()?.productDetail);
  readonly beneficiary = computed(
    () =>
      ({
        transactionMethod: 'BANK_ACCOUNT',
        beneficiaryName: 'Enas Nasr',
        beneficiaryNickname: 'TMG Finance',
        beneficiaryNumber: '12334812781289',
        bank: {
          bankNameEn: 'EG Bank',
        },
      }) as Beneficiary,
  );

  readonly icon = computed(() => 'time-deposits'); // time-deposits, prod
  readonly detailType = computed(() => this.productDetails()?.requestType);

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
    const d = data?.productDetail;
    const allUsers = data?.users || {};
    return {
      user: {
        name: 'Ahmed Mohamed',
        date: '01/12/2025',
      },
      approvals: <ApprovalList[]>[
        ...Array.from({ length: d?.requiredApproval || 0 }, (x, i) => {
          const role = `CHECKER_LEVEL_${i + 1}`;
          const users = allUsers[role];
          const approval = data?.approvalRejection.find(x => x.role === role);
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
          currency: d?.minimumDepositCurrency,
        },
        icon: 'minimum-deposit',
      },
      { name: 'frequency', value: d?.frequency, icon: 'money-receive' },
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
  };

  readonly fields = computed(() => {
    const columns = this.fieldType[this.productDetails()?.requestType || ''] || [];
    return this.allFields().filter(x => columns.includes(x.name));
  });
}
