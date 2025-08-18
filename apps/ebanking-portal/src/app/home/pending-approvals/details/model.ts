import { Beneficiary } from '@/home/beneficiary/models/models';
import { AccountDTO, ChargeBearer, TransferNetwork, TransferType } from '@/home/transfer/model';

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

export interface TimelineRes {
  approvalRejection: ApprovalRejection[];
  users: Users;
}

interface Users {
  [x: string]: LevelUser[];
}

export interface LevelUser {
  name: string;
  id: string;
}

export interface ApprovalRejection {
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
  accountNickName: string;
  accountNumber: string;
  amount: string;
  currency: string;
  interestRate: string;
  chequebook: boolean;
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
  approved: number;
  requiredApprovalLevel: number;
  accountNickname: string;
  accountType: string;
  accountCurrency: string;
  branchDetails: string;
  issueFee: number;
  submittedBy: string;
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

export interface ITransferDetails {
  transferId: string;
  transferAmount: number;
  transferCurrency: string;
  fromAccount: {
    accountNumber: string;
    accountNickname: string;
    accountType: string;
  };
  toAccount: {
    accountNumber: string;
    accountNickname: string;
    accountType: string;
  };
  transferType: TransferType;
  transferStatus: string;
  transferWorkflowStatus: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'WITHDRAW';
  description: string;
  valueDate: string;
  transactionDate: string;
  referenceId: string;
  convertedAmount: number;
  exchangeRate: {
    currencyName: string;
    buy: number;
    sell: number;
  };
  beneficiary: Beneficiary;
  transferReason: string;
  transferNetwork: TransferNetwork;
  chargeBearer: ChargeBearer;
  fees: number;
  feesCurrency: string;
  scheduleDto: {
    submitDate: string;
    endDate: string;
    numberOfTransfers: number;
    frequencyType: string;
  };
  status: string;
  errors: {
    field: string;
    code: string;
    message: string;
  }[];
}

export interface TransferApprovalDetails {
  approvalTimeline: {
    role: string;
    fullName: string;
    username: string;
    status: string;
    isCurrentUser: true;
    timestamp: string;
  }[];
  checkerUsers: {
    [x: string]: LevelUser[];
  };
  totalNumberOfApproval: number;
}
