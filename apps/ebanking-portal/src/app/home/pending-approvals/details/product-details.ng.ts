import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output } from '@angular/core';
import { CurrencyView } from '@/core/components';
import { apiStatus } from '@/core/models/api';
import { AccountSelectedView } from '@/home/transfer/components/account-selected/account-selected-view.ng';
import { TranslocoDirective } from '@jsverse/transloco';
import { Card } from '@scb/ui/card';
import { Icon } from '@scb/ui/icon';
import { PendingRequestsApprovalsService } from '../pending-approvals.service';
import { DelegationContainer } from './delegation-container.ng';
import { DelegationExtraField, DelegationExtras } from './delegation-extras.ng';
import { DelegationTimeline } from './delegation-timeline.ng';
import { ApiRes, ProductApprovalRes } from './model';

@Component({
  selector: 'app-product-approval-details',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Card,
    TranslocoDirective,
    Icon,
    CurrencyView,
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
    [pageTitle]="'productDetails'"
    [requestId]="requestId()"
    [type]="type()"
    [approved]="productDetails()?.approved || 0"
    [approvals]="detailsData()?.approvalRejection"
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
            <span class="head-xs-s">{{ productDetails()?.productTitle }}</span>
            @if (detailType() === 'ACCOUNT') {
              <span class="body-lg text-text-tertiary">
                ({{ t(productDetails()?.interestType === 'Interest' ? 'interest' : 'nonInterest') }})
              </span>
            }
          </div>
          <div class="flex justify-center">
            <currency-view
              [amount]="productDetails()?.amount"
              [currency]="productDetails()?.currency"
              size="xl"
              variant="primary" />
          </div>
          <!-- @if (detailType() === 'ACCOUNT') {
            <div class="gap-sm flex items-center justify-center">
              <span class="body-label-sm-m">Monthly interest:</span>
              <span class="body-md-s text-text-tertiary">2%</span>
              <span class="body-md-s"> = 15,000</span>
            </div>
          } -->
        </scb-card>

        <div class="gap-sm flex flex-col">
          <div class="body-label-md-m text-text-secondary">{{ t('debitedAccount') }}</div>
          <app-account-selected-view
            [nickname]="fromAccount()!.nickname!"
            [accountNumber]="fromAccount()!.accountNumber!" />
        </div>
        @if (toAccount(); as ta) {
          <div class="gap-sm flex flex-col">
            <div class="body-label-md-m text-text-secondary">{{ t('creditedPrincipleAccount') }}</div>
            <app-account-selected-view
              [nickname]="ta.nickname"
              [accountNumber]="ta.accountNumber" />
          </div>
        }

        <app-delegation-extras [fields]="fields()" />
      </div>
      <!-- Timeline -->
      <app-delegation-timeline
        [data]="detailsData()"
        [status]="productDetails()?.status || ''"
        [extras]="extras()" />
    }
  </app-delegation-container> `,
})
export default class ProductDetails {
  readonly pendingService = inject(PendingRequestsApprovalsService);

  readonly detailId = input.required<string>();
  readonly parentPath = input.required<string>();
  readonly title = input.required<string>();
  readonly type = input.required<string>();

  readonly productSource = httpResource<ApiRes<ProductApprovalRes>>(
    () => `/api/product/product/request/${this.detailId()}/details`,
  );
  readonly apiStatus = apiStatus(this.productSource.status);

  readonly detailsData = computed(() => this.productSource.value()?.data);
  readonly productDetails = computed(() => this.detailsData()?.productDetail);

  readonly fromAccount = computed(() => ({
    nickname: this.productDetails()?.debitAccountHolderNickName || this.productDetails()?.accountNickName,
    accountNumber: this.productDetails()?.debitAccount || this.productDetails()?.accountNumber,
  }));
  readonly toAccount = computed(() => {
    const p = this.productDetails();
    if (!p?.creditAccountHolderNickName) return undefined;
    return {
      nickname: p?.creditAccountHolderNickName,
      accountNumber: p?.creditPrincipleAccount,
    };
  });
  readonly icon = computed(() => {
    return {
      CD: 'prod',
      TD: 'time-deposits',
      ACCOUNT: 'bank',
    }[this.productDetails()?.requestType || 'CD']!;
  });
  readonly detailType = computed(() => this.productDetails()?.requestType);
  readonly status = computed(() => this.productDetails()?.status);
  readonly requestId = computed(() => this.productDetails()?.requestId);
  readonly extras = computed(() => {
    const p = this.productDetails();
    if (!p) return undefined;
    return {
      submittedBy: p.submittedBy,
      date: p.createdDate,
      approvals: p.requiredApproval,
    };
  });

  readonly allFields = computed(() => {
    const d = this.productDetails();
    return <DelegationExtraField[]>[
      //
      { name: 'appliedFees', value: '50 EGP', icon: 'minimum-deposit' },
      { name: 'chargesPaidBy', value: 'Sender', icon: 'profile' },
      { name: 'transactionDate', value: '5 Oct 2025, 12:00 AM', icon: 'calendar' },
      { name: 'reasonOfTransfer', value: 'Family Expenses', icon: 'reason' },
      { name: 'description', value: 'Family Expenses', icon: 'note' },
      { name: 'chequebook', value: d?.chequebook, icon: 'note' },
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
    TD: ['interestRate', 'minimumDeposit', 'frequency', 'interestType', 'actionMaturity'],
    ACCOUNT: ['frequency', 'chequebook', 'minimumDeposit'],
    CHEQUEBOOK: ['noOfChequebook', 'leaves', 'fees'],
  };

  readonly fields = computed(() => {
    const type = this.productDetails()?.requestType;
    let columns = this.fieldType[type || ''] || [];
    if ((type === 'CD' || type === 'TD') && this.status() !== 'APPROVED') {
      columns = columns.filter(x => !['interestRate', 'interestType'].includes(x));
    }
    if (type === 'ACCOUNT' && this.productDetails()?.interestType !== 'Interest') {
      columns = columns.filter(x => x !== 'frequency');
    }
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
