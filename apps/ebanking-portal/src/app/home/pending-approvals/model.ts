import { Pagination } from '@/core/models/api';

export interface IPendingApprovalsRes {
  data: any[];
  paginations: Pagination;
  transferTypes: { key: string; value: string }[];
}

export interface PendingApprovalsList {
  id: string;
  amount: string;
  approved: number;
  createdDate: string;
  currency: string;
  rejected: number;
  requestId: string;
  requestType: string;
  requiredApproval: number;
  status: string;
  updatedBy: string | null;
  updatedDate: string | null;
}

export interface AllListResponse {
  data: {
    requests: PendingApprovalsList[];
    pagination: AllPagination;
  };
}

export interface AllPagination {
  pageSize: number;
  pageStart: number;
  totalPages: number;
  totalSize: number;
}
export interface Requests {
  code: string;
  label: string;
}

export interface RequestTypeResponse {
  data: {
    requestStatuses: Requests[];
    requestTypes: Requests[];
  };
}

export enum DelegationStatus {
  PENDING = 'PENDING',
  WAITING_FOR_OTHERS_APPROVAL = 'WAITING_FOR_OTHERS_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export function mapStatus(code: number | null | undefined): DelegationStatus | null {
  switch (code) {
    case 0:
      return null;
    case 1:
      return DelegationStatus.PENDING;
    case 2:
      return DelegationStatus.WAITING_FOR_OTHERS_APPROVAL;
    case 3:
      return DelegationStatus.APPROVED;
    case 4:
      return DelegationStatus.REJECTED;
    default:
      return null;
  }
}

export interface WithdrawPayload {
  token: string;
  requestId: string;
  action: string;
  remark?: string; // optional
}

export interface ChequeBookPendingList extends PendingApprovalsList {
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string | null;
  id: string;
  cif: string;
  accountNickname: string;
  accountType: string;
  accountNumber: string;
  accountCurrency: string;
  leavesCount: number;
  cifBranch: string;
}
