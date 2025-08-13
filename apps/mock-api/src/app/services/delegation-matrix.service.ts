import { Injectable } from '@nestjs/common';
import {
  AllDelegation,
  ChequebookMakerCheckerResponse,
  DelegationQuery,
  DelegationResponse,
} from '../models/delegation-matrix.model';

@Injectable()
export class DelegationMatrixService {
  private allDelegationList: AllDelegation[] = [];

  constructor() {
    this.generateMockAllDelegationList(15);
  }

  private generateMockAllDelegationList(count: number): AllDelegation[] {
    const requestTypes = ['Open New TD', 'Close TD', 'Update TD'];
    const statusLabels = ['APPROVED', 'PENDING', 'REJECTED'];
    const users = ['dinesh_super_user', 'admin_user', 'system_bot'];

    this.allDelegationList = [];

    for (let i = 0; i < count; i++) {
      const randomAmount = (Math.floor(Math.random() * 9000) + 1000).toString();
      const randomStatus = statusLabels[Math.floor(Math.random() * statusLabels.length)];
      const now = new Date();
      const randomDate = new Date(now.getTime() - Math.random() * 1e10).toISOString();
      const requestId = (Math.floor(Math.random() * 90000000) + 10000000).toString();

      this.allDelegationList.push({
        requestId: requestId,
        requestType: requestTypes[Math.floor(Math.random() * requestTypes.length)],
        status: randomStatus,
        amount: randomAmount,
        currency: 'EGP',
        createdDate: randomDate,
        updatedDate: randomDate,
        updatedBy: users[Math.floor(Math.random() * users.length)],
        requiredApproval: 3,
        approved: randomStatus === 'APPROVED' ? 1 : 0,
        rejected: randomStatus === 'REJECTED' ? 1 : 0,
      });
    }

    return this.allDelegationList;
  }

  public getDelegationList(query: DelegationQuery): DelegationResponse {
    let filtered = [...this.allDelegationList];

    if (query.status && query.status.length > 0) {
      filtered = filtered.filter(request => query.status?.includes(request.status));
    }

    const totalSize = filtered.length;
    const totalPages = Math.ceil(totalSize / query.pageSize);
    const paginatedData = filtered.slice(query.pageStart, query.pageStart + query.pageSize);

    return {
      data: {
        requests: paginatedData,
        pagination: {
          pageStart: query.pageStart,
          totalSize,
          pageSize: query.pageSize,
          totalPages,
        },
      },
    };
  }

  public getChequebookCheckerList(query: DelegationQuery): ChequebookMakerCheckerResponse {
    let filtered = [...this.allDelegationList];

    if (query.status && query.status.length > 0) {
      filtered = filtered.filter(request => query.status?.includes(request.status));
    }

    const totalSize = filtered.length;
    const totalPages = Math.ceil(totalSize / query.pageSize);
    const paginatedData = filtered.slice(query.pageStart, query.pageStart + query.pageSize);

    return {
      requests: paginatedData,
      pagination: {
        pageStart: query.pageStart,
        totalSize,
        pageSize: query.pageSize,
        totalPages,
      },
    };
  }

  private formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  private getRandomDate(): string {
    const start = new Date(2024, 0, 1).getTime();
    const end = new Date(2026, 0, 1).getTime();
    const randomTime = start + Math.random() * (end - start);
    return this.formatDate(new Date(randomTime));
  }

  getProductCount() {
    return {
      status: 'Success',
      message: 'Product count fetched successfully',
      data: {
        count: 7,
      },
    };
  }

  getTransfersCount() {
    return {
      status: 'Success',
      message: 'Transfers count fetched successfully',
      data: {
        count: 0,
      },
    };
  }

  getChequebookCount() {
    return {
      status: 'Success',
      message: 'Chequebook count fetched successfully',
      data: {
        count: null,
      },
    };
  }

  getRequestType() {
    return {
      status: 'Success',
      message: 'Product count fetched successfully',
      data: {
        requestStatuses: [
          {
            code: 'PENDING',
            label: 'Pending',
          },
          {
            code: 'APPROVED',
            label: 'Approved',
          },
          {
            code: 'REJECTED',
            label: 'Rejected',
          },
          {
            code: 'CANCELLED',
            label: 'Cancelled',
          },
          {
            code: 'WAITING_FOR_OTHERS_APPROVAL',
            label: 'Waiting for Others Approval',
          },
        ],
        requestTypes: [
          {
            code: 'CD',
            label: 'Open New CD',
          },
          {
            code: 'TD',
            label: 'Open New TD',
          },
          {
            code: 'ACCOUNT',
            label: 'Open New Account',
          },
        ],
      },
    };
  }
}
