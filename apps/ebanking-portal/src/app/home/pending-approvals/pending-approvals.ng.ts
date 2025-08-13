import { ChangeDetectionStrategy, Component, effect, signal } from '@angular/core';
import { RolePermissionDirective } from '@/core/directives/role-permission.directive';
import { TranslocoDirective } from '@jsverse/transloco';
import { Tab, TabLazy, Tabs } from '@scb/ui/tabs';
import { AllList } from './all/all-list.ng';
import { ApprovedList } from './approved/approved-list.ng';
import { PendingRequestsApprovalsService } from './pending-approvals.service';
import PendingTransactions from './pending-transactions.ng';
import { PendingList } from './pending/pending-list.ng';
import { RejectedList } from './rejected/rejected-list.ng';
import { WaitingList } from './waiting/waiting-list.ng';

@Component({
  selector: 'app-pending-approvals',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [PendingRequestsApprovalsService],
  imports: [
    Tabs,
    Tab,
    TabLazy,
    PendingTransactions,
    ApprovedList,
    WaitingList,
    RejectedList,
    RolePermissionDirective,
    PendingList,
    AllList,
    TranslocoDirective,
  ],
  template: `<div
    class="gap-2xl col-span-12 row-span-8"
    *transloco="let t; prefix: 'pendingApprovals.tabs'">
    <scb-tabs
      [(selectedIndex)]="selectedTab"
      class="!bg-transparent">
      <scb-tab
        label="{{ t('all') }}"
        *rolePermission="['MAKER']">
        <all-list
          [tab]="selectedTab()"
          *scbTabLazy />
      </scb-tab>
      <scb-tab
        label="{{ t('pending') }}"
        *rolePermission="['MAKER', 'CHECKER']">
        <pending-list
          [tab]="selectedTab()"
          *scbTabLazy />
      </scb-tab>
      <scb-tab
        label="{{ t('waiting') }}"
        *rolePermission="['CHECKER']">
        <waiting-list
          [tab]="selectedTab()"
          *scbTabLazy />
      </scb-tab>
      <scb-tab
        label="{{ t('approved') }}"
        *rolePermission="['MAKER', 'CHECKER']">
        <approved-list
          [tab]="selectedTab()"
          *scbTabLazy />
      </scb-tab>
      <scb-tab
        label="{{ t('rejected') }}"
        *rolePermission="['MAKER', 'CHECKER']">
        <rejected-list
          [tab]="selectedTab()"
          *scbTabLazy />
      </scb-tab>
    </scb-tabs>
  </div> `,
  host: {
    class: 'container-grid py-3xl px-3xl',
  },
})
export default class PendingApprovals {
  readonly activeIndex = signal(0);
  readonly selectedTab = signal<number>(0);
  constructor() {
    effect(() => {
      const tab = this.selectedTab();
    });
  }
}
