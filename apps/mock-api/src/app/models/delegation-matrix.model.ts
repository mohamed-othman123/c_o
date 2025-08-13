export interface AllDelegation {
  requestId: string;
  requestType: string;
  status: string;
  amount: string;
  currency: string;
  createdDate: string;
  updatedDate: string;
  updatedBy: string;
  requiredApproval: number;
  approved: number;
  rejected: number;
}

export interface Pagination {
  pageStart: number;
  totalSize: number;
  pageSize: number;
  totalPages: number;
}

export interface DelegationResponse {
  data: {
    requests: AllDelegation[];
    pagination: Pagination;
  };
}

export interface ChequebookMakerCheckerResponse {
  requests: AllDelegation[];
  pagination: Pagination;
}

export interface DelegationQuery {
  pageStart: number;
  pageSize: number;
  status?: string;
}
