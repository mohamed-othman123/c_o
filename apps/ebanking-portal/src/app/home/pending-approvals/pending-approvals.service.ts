import { HttpClient, httpResource, HttpResourceRequest } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { AuthService } from '@/auth/api/auth.service';
import { SoftTokenService, ToasterService } from '@/core/components';
import { LayoutFacadeService } from '@/layout/layout.facade.service';
import { TranslocoService } from '@jsverse/transloco';
import { alertPortal } from '@scb/ui/alert-dialog';
import { dialogPortal } from '@scb/ui/dialog';
import { TransferLookupData } from '../transactions-history/model';
import { mapStatus, PendingApprovalsList, RequestTypeResponse } from './model';
import { RejectRequest } from './reject-request/reject-request.ng';

@Injectable()
export class PendingRequestsApprovalsService {
  private readonly layoutFacade = inject(LayoutFacadeService);
  readonly softToken = inject(SoftTokenService);
  private readonly authService = inject(AuthService);
  readonly http = inject(HttpClient);
  readonly toaster = inject(ToasterService);
  readonly transloco = inject(TranslocoService);
  readonly alert = alertPortal();
  readonly withdrawLoadingId = signal('');
  readonly dialogPortal = dialogPortal();
  readonly loading = signal(false);
  readonly requestType = signal('');

  isMaker(): boolean {
    const userRoles = this.authService.getRolesFromToken();
    return userRoles.includes('MAKER') && !userRoles.includes('SUPER_USER');
  }

  //withdraw
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  withdraw(payload: PendingApprovalsList, callback: Function) {
    this.confirmation(() => {
      this.softToken.open(this.loading.asReadonly(), (token: string) => {
        if (token) {
          this.withdrawProcess({ ...payload, token }, callback);
        }
      });
    });
  }

  private withdrawProcess = (
    payload: PendingApprovalsList & { token: string },
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    callback: Function,
  ) => {
    this.loading.set(true);

    const { url, method, otpKey, payloadValue } = this.getRequestConfig('withdraw');
    const requestPayload = {
      [otpKey]: '12345678',
      requestId: payload.requestId ?? payload.id,
      action: payloadValue,
    };

    this.http.request(method, url, { body: requestPayload }).subscribe({
      next: () => {
        this.withdrawLoadingId.set('');
        this.toaster.showSuccess({
          summary: this.transloco.translate('pendingApprovals.withdrawSuccess.title'),
          detail: this.transloco.translate('pendingApprovals.withdrawSuccess.subTitle'),
        });
        callback();
      },
      error: () => {
        this.toaster.showError({
          summary: '',
          detail: this.transloco.translate('pendingApprovals.error.apiErrorDetail'),
        });
        this.withdrawLoadingId.set('');
      },
    });
  };

  rejectProcess = (
    payload: any,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    callback: Function,
  ) => {
    this.loading.set(true);
    const requestPayload = {
      token: '12345678',
      requestId: payload.requestId,
      action: 'REJECT',
      remark: payload.remark ?? '', // extra remark field if needed
    };

    //this.withdrawLoadingId.set(requestPayload.requestId);
    const url = `/api/product/product/request/actions`;

    this.http.put(url, requestPayload).subscribe({
      next: () => {
        this.withdrawLoadingId.set('');
        this.toaster.showSuccess({
          summary: this.transloco.translate('pendingApprovals.rejectSuccess.title'),
          detail: this.transloco.translate('pendingApprovals.rejectSuccess.subTitle'),
        });
        callback();
      },
      error: () => {
        this.toaster.showError({
          summary: '',
          detail: this.transloco.translate('pendingApprovals.error.apiErrorDetail'),
        });
        this.withdrawLoadingId.set('');
      },
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  approveRequest(payload: PendingApprovalsList, callback: Function) {
    this.softToken.open(this.loading.asReadonly(), (token: string) => {
      if (token) {
        this.approveProcess({ ...payload, token }, callback);
      }
    });
  }

  approveProcess = (
    payload: any,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    callback: Function,
  ) => {
    this.loading.set(true);

    const { url, method, otpKey, payloadValue } = this.getRequestConfig('approve');
    const requestPayload = {
      [otpKey]: '12345678',
      requestId: payload.requestId ?? payload.id,
      action: payloadValue,
    };

    // const requestPayload = {
    //   token: '12345678',
    //   requestId: payload.requestId ? payload.requestId : payload.id,
    //   action: 'APPROVE',
    // };

    // //this.withdrawLoadingId.set(requestPayload.requestId);
    // // const url = `/api/product/product/request/actions`;
    // const { url, method } = this.getRequestConfig('approve');

    this.http.request(method, url, { body: requestPayload }).subscribe({
      next: () => {
        this.withdrawLoadingId.set('');
        this.toaster.showSuccess({
          summary: this.transloco.translate('pendingApprovals.approvedSuccess.title'),
          detail: this.transloco.translate('pendingApprovals.approvedSuccess.subTitle'),
        });
        callback();
      },
      error: () => {
        this.toaster.showError({
          summary: '',
          detail: this.transloco.translate('pendingApprovals.error.apiErrorDetail'),
        });
        this.withdrawLoadingId.set('');
      },
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  private confirmation(callback: Function) {
    if (this.withdrawLoadingId()) return; // avoid calling api when inprogress

    this.alert.open({
      title: this.transloco.translate(`pendingApprovals.withdrawConfirmation.title`),
      description: this.transloco.translate(`pendingApprovals.withdrawConfirmation.desc`),
      icon: 'warning-alert',
      showClose: true,
      actions: [
        {
          text: this.transloco.translate('pendingApprovals.withdrawConfirmation.yes'),
          handler: cls => {
            cls();
            callback();
          },
        },
        {
          text: this.transloco.translate(`pendingApprovals.withdrawConfirmation.no`),
          type: 'secondary',
          handler: cls => cls(),
        },
      ],
    });
  }

  rejectRequestConfirmation(request: PendingApprovalsList) {
    return this.dialogPortal.open(RejectRequest, {
      containerClassNames: ['bg-white h-full p-xl dark:bg-gray-850'],
      classNames: ['self-end mb-2xl 2xl:mb-0 2xl:self-center w-full! 2xl:w-[376px]!'],
      disableClose: true,
      fullWindow: false,
      data: request.requestId,
    });
  }

  getApprovalSteps(required: number, approved: number, rejected: number) {
    type StatusType = 'success' | 'reject' | 'default';

    const createSteps = (count: number, status: StatusType) => Array.from({ length: count }, () => ({ status }));

    return [
      ...createSteps(approved, 'success'),
      ...createSteps(rejected, 'reject'),
      ...createSteps(required - approved - rejected, 'default'),
    ];
  }

  canShowActions(status: string): boolean {
    return status === 'PENDING';
  }

  readonly requestTypeResource = httpResource<RequestTypeResponse>(() => ({
    url: '/api/product/product/request/fetch/lookup',
  }));

  readonly lookupData = httpResource<TransferLookupData>(() => {
    const _ = this.layoutFacade.language();
    return {
      url: `/api/transfer/lookup/transfer-data`,
    };
  });

  getAllListRequest(type: string, params: any, isMaker?: boolean): HttpResourceRequest {
    const chequeUrl = this.isMaker()
      ? '/api/product/chequebook/workflow/status'
      : '/api/product/chequebook/workflow/checker/status';

    const baseUrlMap: Record<string, string> = {
      cheque: chequeUrl,
      product: '/api/product/product/request/list',
      transfer: '/api/dashboard/transfer/transferlist/status',
    };

    const methodMap: Record<string, 'GET' | 'POST'> = {
      cheque: 'GET',
      product: 'POST',
      transfer: 'POST',
    };

    const url = baseUrlMap[type] || baseUrlMap['cheque'];
    const method = methodMap[type] || 'GET';

    return {
      url,
      method,
      ...(method === 'GET' ? { params } : { body: params }),
    };
  }

  buildFilters(date: string, transferType: any, tab: number, isMaker: boolean, type: string) {
    const [fromDate, toDate] = date.split(',');

    if (type === 'product') {
      return {
        requestType: transferType,
        ...(fromDate &&
          toDate && {
            dateFilter: {
              fromDate,
              toDate,
            },
          }),
        status: [mapStatus(this.getStatusTab(isMaker, tab))],
      };
    }

    return {
      requestType: transferType,
      fromDate,
      toDate,
      status: [mapStatus(this.getStatusTab(isMaker, tab))],
    };
  }

  buildParams(filters: Record<string, any>, pageStart: number, pageSize: number) {
    const filtered = Object.entries(filters).reduce((acc, [key, value]) => {
      if (Array.isArray(value)) {
        const cleanedArray = value.filter(v => v !== null && v !== undefined && v !== '');
        if (cleanedArray.length > 0) {
          acc[key] = cleanedArray;
        }
      } else if (value !== '' && value !== null && value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as any);

    return {
      ...filtered,
      pageStart,
      pageSize,
    };
  }

  extractRequests(res: any): PendingApprovalsList[] {
    if (!res) return [];
    if (Array.isArray(res.requests)) return res.requests;
    if (Array.isArray(res?.data?.requests)) return res.data.requests;
    return [];
  }

  getPagination(res: any) {
    return res?.pagination ?? res?.data?.pagination ?? {};
  }

  getTotalPages(res: any) {
    return this.getPagination(res).totalPages || 0;
  }

  getTotalSize(res: any) {
    return this.getPagination(res).totalSize || 0;
  }

  getTotalRecords(res: any) {
    const p = this.getPagination(res);
    return p.totalRecords || p.totalSize || 0;
  }

  getStatusTab(isMaker: boolean, tab: number): number {
    if (tab === 0 && isMaker) {
      return tab;
    }
    if (tab === 0 && !isMaker) {
      return tab + 1;
    }
    if (!isMaker) {
      return tab + 1;
    }
    if (isMaker && tab >= 2) {
      return tab + 1;
    }
    return tab;
  }

  getRequestConfig(requestType: string): {
    url: string;
    method: 'put' | 'post';
    otpKey: 'otp' | 'token';
    payloadValue: string;
  } {
    const action = requestType.toLowerCase();
    const isCheque = this.requestType() === 'cheque';
    const url = isCheque ? `/api/product/chequebook/workflow/${action}` : `/api/product/product/request/actions`;
    const method = isCheque ? 'post' : 'put';

    const otpKey: 'otp' | 'token' = isCheque ? 'otp' : 'token';
    const payloadValue = isCheque ? 'APPROVED' : action.toUpperCase();
    return {
      url,
      method,
      otpKey,
      payloadValue,
    };
  }
}
