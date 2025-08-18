import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormControl, FormGroup, Validators } from '@angular/forms';
import { finalize, of } from 'rxjs';
import { SoftTokenService } from '@/core/components';
import { minCurrencyAmountValidator } from '@/core/validators/custom-validators';
import { TransferDataService } from '@/home/transfer/data/transfer-data.service';
import { LayoutFacadeService } from '@/layout/layout.facade.service';
import { TranslocoService } from '@jsverse/transloco';
import { markControlsTouched } from '@scb/ui/input';
import { Beneficiary } from '../beneficiary/models/models';
import { PendingRequestsApprovalsService } from '../pending-approvals/pending-approvals.service';
import {
  CharityItem,
  FrequencyType,
  TransferDataResponse,
  TransferRequestDTO,
  TransferSaveError,
  TransferSaveRes,
  TransferSteps,
} from './model';

@Injectable()
export class TransferService {
  readonly softToken = inject(SoftTokenService);
  readonly http = inject(HttpClient);
  readonly layoutFacade = inject(LayoutFacadeService);
  readonly translateService = inject(TranslocoService);
  readonly transferData = inject(TransferDataService);
  readonly pendingService = inject(PendingRequestsApprovalsService);

  readonly fromAccount = new FormGroup({
    accountNumber: new FormControl('', { validators: [Validators.required], nonNullable: true }),
    accountNickname: new FormControl('', { validators: [Validators.required], nonNullable: true }),
    accountType: new FormControl('', { validators: [Validators.required], nonNullable: true }),
  });

  readonly currencyField = new FormControl('' as unknown as number, {
    validators: [Validators.required],
    nonNullable: true,
  });

  readonly isSchedule = new FormControl(false, { nonNullable: true });
  readonly scheduleDto = new FormGroup({
    submitDate: new FormControl<string>('', { nonNullable: true }),
    frequencyType: new FormControl<FrequencyType>('ONCE', { nonNullable: true }),
    endDate: new FormControl<string>('', { nonNullable: true }),
    numberOfTransfers: new FormControl<number>('' as any, {
      validators: [Validators.required, Validators.min(1), Validators.pattern('^[1-9][0-9]*$')],
      nonNullable: true,
    }),
  });

  readonly loading = signal(false);
  readonly step = signal<TransferSteps>('form');
  readonly isArabic = this.layoutFacade.isArabic;
  readonly errorMessage = signal<string>('');
  readonly selectedBeneficiary = signal<Beneficiary | undefined>(undefined);
  readonly lookupData = signal<TransferDataResponse | undefined>(undefined);
  readonly value = signal<TransferRequestDTO>({} as TransferRequestDTO);
  readonly transferSaveRes = signal<TransferSaveRes | undefined>(undefined);
  readonly selectedAccountNumber = signal<string | undefined>(undefined);
  readonly availableBalance = signal<number>(0);
  readonly feesAmount = signal<Record<string, number>>({});
  readonly selectedToAccountNumber = signal<string | undefined>(undefined);
  readonly exchangeApiFailed = signal(false);
  readonly insufficientBalance = signal(false);

  readonly isScheduleSignal = toSignal(this.isSchedule.valueChanges, { initialValue: this.isSchedule.value });
  readonly submitDateSignal = toSignal(this.scheduleDto.get('submitDate')!.valueChanges, {
    initialValue: this.scheduleDto.get('submitDate')!.value,
  });

  readonly chargeBearer = computed(() => {
    const bearer = this.value().chargeBearer;
    return this.transferData.chargeBearers().find(x => x.key === bearer)?.value;
  });

  readonly transferType = computed(() => {
    const bearer = this.value().transferType;
    return this.transferData.transferTypes().find(x => x.key === bearer)?.value;
  });

  readonly shouldApplyMinAmountValidation = computed(() => {
    const isScheduled = this.isScheduleSignal();
    const submitDate = this.submitDateSignal();

    if (!isScheduled) {
      return true;
    }

    if (!submitDate || submitDate.trim() === '') {
      return true;
    }

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const dateParts = submitDate.trim().split('-');
      if (dateParts.length !== 3) {
        return true;
      }

      const [day, month, year] = dateParts.map(part => parseInt(part, 10));

      if (isNaN(day) || isNaN(month) || isNaN(year) || day < 1 || day > 31 || month < 1 || month > 12 || year < 2020) {
        return true;
      }

      const selectedDate = new Date(year, month - 1, day);
      selectedDate.setHours(0, 0, 0, 0);

      const isFutureDate = selectedDate.getTime() > today.getTime();
      return !isFutureDate;
    } catch (error) {
      return true;
    }
  });

  readonly totalAmount = computed(() => {
    const formValue = this.value();
    const transferAmount = formValue.transferAmount || 0;
    const networkKey = formValue.transferNetwork;
    const fees = networkKey ? this.feesAmount()[networkKey] || 0 : 0;

    return formValue.chargeBearer === 'SENDER' ? transferAmount + fees : transferAmount - fees;
  });

  loadCharityTransferData(currency?: string): void {
    this.transferData.loadCharityTransferData(currency);
  }

  loadOutsideTransferData(currency?: string): void {
    this.transferData.loadOutsideTransferData(currency);
  }

  loadInsideTransferData(currency?: string): void {
    this.transferData.loadInsideTransferData(currency);
  }

  loadAccountsData(currency?: string): void {
    this.transferData.loadAccountsData(currency);
  }

  readonly getReasons = () => this.transferData.reasons;
  readonly getChargeBearers = () => this.transferData.chargeBearers;
  readonly getTransferNetworks = () => this.transferData.transferNetworksFiltered;
  readonly getCharityList = () => this.transferData.charityList;
  readonly isCharityLoading = () => computed(() => this.transferData.charityLoading());
  readonly getCharityError = () => computed(() => this.transferData.charityError());

  readonly fromAccountsData = () => this.transferData.fromAccountsData();
  readonly toAccountsData = () => this.transferData.toAccountsData();
  readonly fromAccountsLoading = () => this.transferData.fromAccountsLoading();
  readonly toAccountsLoading = () => this.transferData.toAccountsLoading();
  readonly fromAccountsError = () => this.transferData.fromAccountsError();
  readonly toAccountsError = () => this.transferData.toAccountsError();

  readonly transferLookupData = () => this.transferData.transferLookupData();

  constructor() {
    effect(() => {
      const shouldApplyMinValidation = this.shouldApplyMinAmountValidation();

      const validators = shouldApplyMinValidation
        ? [Validators.required, minCurrencyAmountValidator(0.01)]
        : [Validators.required];

      if (!shouldApplyMinValidation) {
        const currentErrors = this.currencyField.errors;
        if (currentErrors) {
          const errors = { ...currentErrors };
          delete errors['min'];
          delete errors['insufficientBalance'];
          this.currencyField.setErrors(Object.keys(errors).length ? errors : null);
        }
      }

      this.currencyField.setValidators(validators);
      this.currencyField.updateValueAndValidity({ emitEvent: false });
    });
  }

  refreshAccountsData(type: 'from' | 'to', currency?: string): void {
    this.transferData.refreshAccountsData(type, currency);
  }

  getAvailableCurrencies(type: 'from' | 'to'): string[] {
    return this.transferData.getAvailableCurrencies(type);
  }

  loadBeneficiariesData(beneficiaryType?: any): void {
    this.transferData.loadBeneficiariesData(beneficiaryType);
  }

  getBeneficiaries(beneficiaryType: string, transactionMethod?: string): Beneficiary[] {
    return this.transferData.getBeneficiaries(beneficiaryType, transactionMethod);
  }

  isBeneficiariesLoading(beneficiaryType: string, transactionMethod?: string): boolean {
    return this.transferData.isBeneficiariesLoading(beneficiaryType);
  }

  getBeneficiariesError(beneficiaryType: string, transactionMethod?: string): string | null {
    return this.transferData.getBeneficiariesError(beneficiaryType);
  }

  refreshBeneficiariesData(beneficiaryType: string, transactionMethod?: string): void {
    this.transferData.refreshBeneficiariesData(beneficiaryType);
  }

  filterBeneficiaries(beneficiaries: Beneficiary[], searchTerm: string): Beneficiary[] {
    return this.transferData.filterBeneficiaries(beneficiaries, searchTerm);
  }

  loadCharityData(): void {
    this.transferData.loadCharityData();
  }

  refreshCharityData(): void {
    this.transferData.refreshCharityData();
  }

  filterCharities(searchTerm: string): CharityItem[] {
    return this.transferData.filterCharities(searchTerm);
  }

  getCharityName(charity: CharityItem, isArabic: boolean): string {
    return this.transferData.getCharityName(charity, isArabic);
  }

  min(amount: number) {
    return (control: AbstractControl) => {
      const value = control.value;
      return value === '.' || +value < amount ? { min: 'required' } : null;
    };
  }

  onContinueClick(step: TransferSteps, form: FormGroup) {
    if (step === 'summary') {
      const value = form.getRawValue() as TransferRequestDTO;
      const transferAmount = +value.transferAmount.toString().replace(/,/g, '');

      const shouldCheckBalance = this.shouldApplyMinAmountValidation();
      const hasInsufficientBalance = shouldCheckBalance && transferAmount > this.availableBalance();

      this.insufficientBalance.set(hasInsufficientBalance);

      const isOutsideTransfer = value.transferType === 'OUTSIDE';
      let totalAmountInvalid = false;

      if (isOutsideTransfer) {
        const fees = this.feesAmount()[value.transferNetwork!] || 0;
        const calculatedTotal = value.chargeBearer === 'SENDER' ? transferAmount + fees : transferAmount - fees;
        totalAmountInvalid = calculatedTotal <= 0;
      }

      const isInvalid = form.invalid || this.insufficientBalance() || totalAmountInvalid;

      if (isInvalid) {
        markControlsTouched(form, { dirty: true, touched: true });
      }

      if (this.insufficientBalance()) {
        form.get('transferAmount')?.setErrors({ insufficientBalance: true });
      } else if (totalAmountInvalid) {
        form.get('transferAmount')?.setErrors({ negativeTotal: true });
      } else {
        const amountControl = form.get('transferAmount');
        if (amountControl && amountControl.hasError('insufficientBalance')) {
          const errors = { ...amountControl.errors };
          delete errors['insufficientBalance'];
          amountControl.setErrors(Object.keys(errors).length ? errors : null);
        }
      }

      if (this.exchangeApiFailed()) return;
      if (isInvalid) return;

      this.value.set({
        ...value,
        transferAmount: transferAmount,
        scheduleDto: value.isSchedule ? value.scheduleDto : undefined,
        fees: value.transferType === 'OUTSIDE' ? this.feesAmount()[value.transferNetwork!] : undefined,
        feesCurrency: value.transferType === 'OUTSIDE' ? 'EGP' : undefined,
      });
    }

    if (step === 'otp') {
      // open dialog
      this.softToken.open(this.loading.asReadonly(), this.saveTransfer);
    }
    this.step.set(step);
  }

  updateToken(token: string) {
    this.value.update(currentValue => ({
      ...currentValue,
      token,
    }));
  }

  onBackClick() {
    this.step.set('form');
  }

  saveTransfer = (token: string) => {
    this.updateToken(token);
    this.loading.set(true);
    this.http
      .post<TransferSaveRes>(`/api/transfer/transfers/create`, this.value())
      .pipe(
        finalize(() => {
          this.softToken.close();
          this.loading.set(false);
          this.layoutFacade.setCanLeave(true);
          this.pendingService.reloadCountRefreshSignal();
        }),
      )
      .subscribe({
        next: res => {
          this.step.set('success');
          if (res.transferStatus === 'FAILED') {
            this.setErrorMsgOrDefault();
          }
          this.transferSaveRes.set(res);
        },
        error: (err: HttpErrorResponse) => {
          this.handleError(err);
          return of(null);
        },
      });
  };

  private handleError(err: HttpErrorResponse) {
    const backendError = err.error as TransferSaveError;
    this.setErrorMsgOrDefault(err.status === 400 ? backendError.errors?.[0]?.message : '');
    this.step.set('success');
  }

  private setErrorMsgOrDefault(err?: string) {
    const errorMessageFallback = this.translateService.translate('transfer.error.default');
    this.errorMessage.set(err || errorMessageFallback);
  }
}
