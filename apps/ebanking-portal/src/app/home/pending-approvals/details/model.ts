import { Beneficiary } from '@/home/beneficiary/models/models';

export interface ApiRes<T> {
  data: T;
  message: string;
  status: string;
}

export interface ProductApprovalRes {
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
  productTitle: string;
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
  chequebookAvailable: boolean;
  minimumDepositAmount: string;
  minimumDepositCurrency: string;
  frequency: string;
  interestType: string;
  actionAtMaturity: string;
  submittedBy: string;
  createdDate: string;
  updatedDate: string;
  updatedBy: string;
  createdBy: string;
}

export interface ChequeDelegationRes {
  requestId: string;
  status: string;
  data: {
    chequebookDetail: ChequebookDetail;
    approvalRejection: ApprovalRejection[];
    users: Users;
  };
}

export interface ChequebookDetail {
  accountNumber: string;
  chequebooksIssued: number;
  leavesCount: number;
  createdBy: string;
  createdAt: string;
  requiredApprovalLevel: number;
}

export interface DelegationDetailsRes {
  details: ProductDetail &
    ChequebookDetail & {
      from: { nickname: string; accountNumber: string };
      to: { nickname: string; accountNumber: string };
      beneficiary: Beneficiary;
    };
  approvalRejection: ApprovalRejection[];
  users: Users;
}

export interface TransferApprovalStatus {
  totalNumberOfApproval: number;
  approvedNumber: number;
}

export interface PendingRequest {
  amount: number;
  approvalStatus: TransferApprovalStatus;
  approvedNumber: number;
  totalNumberOfApproval: number;
  currency: string;
  requestDate: string;
  requestNumber: string;
  transferType: string;
  transferStatus: string;
}
