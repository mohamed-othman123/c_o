import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { PendingRequestsApprovalsService } from '@/home/pending-approvals/pending-approvals.service';
import { TransferSaveError } from '@/home/transfer/model';
import { LayoutFacadeService } from '@/layout/layout.facade.service';
import { TranslocoService } from '@jsverse/transloco';
import { dialogPortal } from '@scb/ui/dialog';
import { markControlsTouched } from '@scb/ui/input';
import {
  ApiErrorResponse,
  ChequeBookInfo,
  ChequeBookRequestDTO,
  ERROR_TYPE,
  LinkedAccountDTO,
} from '../chequebook.model';
import { ChequeBookSoftTokenAlert } from './components/chequebook-soft-token.ng';

export type ChequeBookSteps = 'form' | 'otp' | 'success' | 'error';
@Injectable({ providedIn: 'root' })
export class ChequeBookService {
  readonly dialog = dialogPortal();
  readonly http = inject(HttpClient);
  readonly layoutFacade = inject(LayoutFacadeService);
  readonly translateService = inject(TranslocoService);
  readonly pendingService = inject(PendingRequestsApprovalsService);
  readonly selectedAccountType = signal<string>('From');
  readonly isError = signal<ERROR_TYPE>(undefined);

  readonly debitAccount = new FormGroup({
    accountNumber: new FormControl('', { validators: [Validators.required], nonNullable: true }),
  });

  readonly showBreadCrumb = signal(true);
  readonly saveLoading = signal(false);
  readonly step = signal<ChequeBookSteps>('form');
  readonly isArabic = this.layoutFacade.isArabic;
  readonly errorMessage = signal<string>('');
  readonly value = signal<ChequeBookRequestDTO>({} as ChequeBookRequestDTO);
  readonly chequeBookInfo = signal<ChequeBookInfo | undefined>(undefined);
  readonly selectedAccountNumber = signal<string | undefined>(undefined);
  readonly selectedAccount = signal<LinkedAccountDTO | null>(null);
  readonly feesAmount = signal<number>(0);
  readonly branchName = signal<string>('');
  readonly selectedToAccountNumber = signal<string | undefined>(undefined);
  readonly loading = signal(false);
  readonly isOVDAccount = signal(false);
  readonly selectedLinkedAccount = signal<any>(null);
  readonly selectedFeesAccount = signal<any>(null);
  readonly hasInsufficientBalance = computed(() => {
    const linkedAccount = this.selectedLinkedAccount();
    if (linkedAccount && linkedAccount.workingBalance <= 0) {
      return true;
    }
    const feesAccount = this.selectedFeesAccount();
    if (feesAccount && feesAccount.workingBalance <= 0) {
      return true;
    }
    return false;
  });

  setLinkedAccount(account: any) {
    this.selectedLinkedAccount.set(account);
  }

  setFeesAccount(account: any) {
    this.selectedFeesAccount.set(account);
  }

  onContinueClick(step: ChequeBookSteps, form: FormGroup) {
    if (step === 'form') {
      const value = form.getRawValue() as any;
      const isInvalid = form.invalid;

      if (isInvalid) {
        markControlsTouched(form, { dirty: true, touched: true });
        return;
      }

      if (this.hasInsufficientBalance()) {
        return;
      }

      const requestPayload: ChequeBookRequestDTO = {
        cif: value.linkedAccount.cif,
        accountNickname: value.linkedAccount.accountNickname,
        accountType: value.linkedAccount.categoryDescription,
        accountNumber: value.linkedAccount.accountNumber,
        accountCurrency: 'EGP',
        ...(value.feeDebitedAccountNumber.accountNumber && {
          feeDebitedAccountNumber: value.feeDebitedAccountNumber.accountNumber,
          branchDetails: 'Main Branch',
        }),
        cifBranch: this.branchName(),
        chequebooksIssued: +value.chequebooksIssued,
        leavesCount: +value.leavesCount,
        otp: '12345678',
        requestDate: value.requestDate,
      };

      this.value.set(requestPayload);
      this.chequeBookInfo.set({
        ...requestPayload,
        accountCurrency: this.value().accountCurrency,
        issueFee: this.feesAmount(),
        cifBranch: this.branchName(),
      });
      this.step.set('otp');
    }

    if (this.step() === 'otp') {
      this.dialog.open(ChequeBookSoftTokenAlert, {
        width: '440px',
        maxWidth: '95vw',
        disableClose: true,
        header: true,
        focusTrap: true,
        classNames: ['!w-[343px] sm:!w-[388px]'],
        containerClassNames: ['p-xl 2xl:p-3xl h-full'],
        data: {
          showClose: true,
          chequeBook: true,
          loading: this.loading.asReadonly(),
          save: this.save,
        },
      });
    }
    this.step.set(step);
  }

  save = (token: string) => {
    this.updateToken(token);
    this.loading.set(true);
    this.http.post<ChequeBookInfo>(`/api/product/chequebook/workflow/request`, this.value()).subscribe({
      next: res => {
        this.loading.set(false);
        this.dialog.closeAll();
        this.step.set('success');
        this.showBreadCrumb.set(false);
        this.pendingService.reloadCountRefreshSignal();
        if (res.status === 'Failed') {
          this.isError.set('API');
        }
      },
      error: (err: HttpErrorResponse) => {
        this.step.set('error');
        this.step.set('success');
        let errorType: ERROR_TYPE = undefined;
        const apiError = err.error as any;
        let details: { code: string; message: string }[] = [];
        if (apiError?.errorCode) {
          details = [{ code: apiError.errorCode, message: apiError.message }];
        } else if (apiError?.errorResponse?.error?.errorDetails) {
          details = apiError.errorResponse.error.errorDetails;
        }

        const errorCodes = details.map(d => d.code);
        if (err.status !== 400) {
          errorType = 'API';
        } else if (errorCodes.includes('TGVCP-002') || errorCodes.includes('CHQ-101')) {
          errorType = 'NOTELIGIBLE';
        } else if (
          errorCodes.includes('PROD-101') ||
          errorCodes.includes('PROD-102') ||
          errorCodes.includes('INVALID_OR_EXPIRED_TOKEN')
        ) {
          errorType = 'TOKEN';
        }
        this.isError.set(errorType);
        this.loading.set(false);
        this.dialog.closeAll();
      },
    });
    this.layoutFacade.setCanLeave(true);
  };

  updateToken(otp: string) {
    this.value.update(currentValue => ({
      ...currentValue,
      otp,
    }));
  }

  handleError(err: HttpErrorResponse) {
    const backendError = err.error as TransferSaveError;
    this.setErrorMsgOrDefault(err.status === 400 ? backendError.errors?.[0]?.message : '');
    this.step.set('success');
  }

  setErrorMsgOrDefault(err?: string) {
    const errorMessageFallback = this.translateService.translate('transfer.error.default');
    this.errorMessage.set(err || errorMessageFallback);
  }
}
