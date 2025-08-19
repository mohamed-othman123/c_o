import { DatePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { PaginationData } from '@/core/components';
import { apiStatus, handleParams } from '@/core/models/api';
import { TableModule } from 'primeng/table';
import { IPendingApprovalsRes } from './model';

@Component({
  selector: 'app-pending-transactions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DatePipe],
  imports: [TableModule],
  templateUrl: './pending-transactions.ng.html',
  host: {
    class: 'block',
  },
})
export default class PendingTransactions {
  readonly isEmpty = signal(false);
  readonly transferType = signal<any[]>([]);
  readonly selectedTab = 0;

  readonly approvalSource = httpResource<IPendingApprovalsRes>(() => {
    const params = {
      lcType: this.transferType(),
      pageStart: this.page.reqPageNumber(),
      pageSize: this.page.rows(),
    };
    return { url: '/api/dashboard/facilities-overview/lc', params: handleParams(params) };
  });

  readonly transferTypeList = computed(() => this.approvalSource.value()?.transferTypes || []);
  readonly approvalList = computed(() => this.approvalSource.value()?.data || []);
  readonly page = new PaginationData(this.transferType);
  readonly status = apiStatus(this.approvalSource.status);

  readonly totalRecords = computed(() => 0); // this.lcsData.value()?.pagination.totalSize ?? 0);
  readonly totalPages = computed(() => 0); //this.lcsData.value()?.pagination.totalPages ?? 0);
}
