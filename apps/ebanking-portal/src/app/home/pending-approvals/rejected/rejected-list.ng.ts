import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CurrencyView, DateView, PaginationData, TablePagination, TableSkeletonComponent } from '@/core/components';
import { apiStatus, handleParams } from '@/core/models/api';
import { AccountDetailsService } from '@/home/account-details/account-details.service';
import { LayoutFacadeService } from '@/layout/layout.facade.service';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { Button } from '@scb/ui/button';
import { Card } from '@scb/ui/card';
import { Icon } from '@scb/ui/icon';
import { Base64ConverterService } from '@scb/util/base64-converter';
import { PaginatorModule } from 'primeng/paginator';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { ApprovalProgress } from '../approval-progress.ng';
import { AllListResponse, mapStatus, PendingApprovalsList } from '../model';
import { PendingRequestsApprovalsService } from '../pending-approvals.service';
import { PendingApprovalFilter } from '../pending-transactions-filter.ng';

@Component({
  selector: 'rejected-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CurrencyPipe, DatePipe, DecimalPipe, AccountDetailsService],
  imports: [
    TooltipModule,
    Card,
    TableModule,
    Button,
    TableSkeletonComponent,
    Icon,
    TranslocoDirective,
    TablePagination,
    CurrencyView,
    Button,
    PaginatorModule,
    SelectModule,
    CurrencyView,
    DateView,
    CurrencyView,
    TablePagination,
    PendingApprovalFilter,
    Button,
    ApprovalProgress,
    RouterLink,
  ],
  templateUrl: './rejected-list.ng.html',
})
export class RejectedList {
  readonly pendingService = inject(PendingRequestsApprovalsService);
  readonly router = inject(Router);
  readonly base64Converter = inject(Base64ConverterService);
  readonly accountDetailsService = inject(AccountDetailsService);
  readonly layoutFacade = inject(LayoutFacadeService);

  readonly tab = input.required<number>();
  readonly type = input.required<string>();

  readonly transferType = signal<any[]>([]);
  readonly loading = signal(false);
  readonly page = new PaginationData();
  readonly refresh = signal(1);
  readonly date = signal('');

  readonly filters = computed(() =>
    this.pendingService.buildFilters(
      this.date(),
      this.transferType(),
      this.tab(),
      this.pendingService.isMaker(),
      this.type(),
    ),
  );

  readonly params = computed(() =>
    this.pendingService.buildParams(this.filters(), this.page.reqPageNumber(), this.page.rows()),
  );

  readonly allListResource = httpResource<AllListResponse>(() =>
    this.pendingService.getAllListRequest(this.type(), this.params()),
  );

  readonly allDelegationsList = computed(() => this.pendingService.extractRequests(this.allListResource.value()));

  readonly totalPages = computed(() => this.pendingService.getTotalPages(this.allListResource.value()));

  readonly totalSize = computed(() => this.pendingService.getTotalSize(this.allListResource.value()));

  readonly totalRecords = computed(() => this.pendingService.getTotalRecords(this.allListResource.value()));

  readonly status = apiStatus(this.allListResource.status);
  readonly isEmpty = computed(() => this.allDelegationsList().length === 0);

  // --- Event Handlers for Time Deposits ---
  refreshAll() {
    this.allListResource.reload();
  }

  constructor() {
    effect(() => {
      const currentTab = this.tab();
      if (currentTab) {
        this.refreshAll();
      }
    });
  }
}
