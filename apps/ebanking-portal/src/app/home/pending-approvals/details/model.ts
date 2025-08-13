export interface ApiRes<T> {
  data: T;
  message: string;
  status: string;
}

export interface DelegationDetail {
  productDetail: ProductDetail;
  approvalRejection: ApprovalRejection[];
  users: Users;
}

interface Users {
  [x: string]: LevelUser[];
  //   CHECKER_LEVEL_2: LevelUser[];
  //   CHECKER_LEVEL_3: LevelUser[];
}

export interface LevelUser {
  name: string;
  id: string;
}

interface ApprovalRejection {
  status: string;
  role: string;
  approverName: string;
  note: string;
  createdAt: string;
}

interface ProductDetail {
  cdTdId: string;
  requestType: string;
  requestId: string;
  requestTypeDisplay: string;
  status: string;
  requiredApproval: number;
  approved: number;
  rejected: number;
  debitAccount: string;
  debitAccountHolderNickName: string;
  creditPrincipleAccount: string;
  creditAccountHolderNickName: string;
  amount: string;
  currency: string;
  interestRate: string;
  minimumDepositAmount: string;
  minimumDepositCurrency: string;
  frequency: string;
  interestType: string;
  actionAtMaturity: string;
  createdDate: string;
  updatedDate: string;
  updatedBy: string;
  createdBy: string;
}
