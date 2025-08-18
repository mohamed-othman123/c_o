import { HttpClient, httpResource, HttpResourceRequest } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { AuthService } from '@/auth/api/auth.service';
import { SoftTokenService, ToasterService } from '@/core/components';
import { CountResponse } from '@/layout/containers/home/Home.container';
import { LayoutFacadeService } from '@/layout/layout.facade.service';
import { TranslocoService } from '@jsverse/transloco';
import { alertPortal } from '@scb/ui/alert-dialog';
import { dialogPortal } from '@scb/ui/dialog';
import { TransferLookupData } from '../transactions-history/model';
import { mapStatus, PendingApprovalsList, RequestTypeResponse } from './model';
import { RejectRequest } from './reject-request/reject-request.ng';

@Injectable({ providedIn: 'root' })
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
  readonly currentTab = signal(0);
  readonly reloadSignal = signal(1);
  isMaker(): boolean {
    const userRoles = this.authService.getRolesFromToken();
    return userRoles.includes('MAKER') && !userRoles.includes('SUPER_USER');
  }

  //withdraw
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  withdraw(requestId: string, callback: Function) {
    this.confirmation(() => {
      this.softToken.open(this.loading.asReadonly(), (token: string) => {
        if (token) {
          this.withdrawProcess({ requestId, token, id: requestId }, callback);
        }
      });
    });
  }

  private withdrawProcess = (
    payload: { token: string; requestId?: string; id?: string },
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    callback: Function,
  ) => {
    this.loading.set(true);

    const finalRequestId = payload.requestId || payload.id;
    const { url, method, otpKey, payloadValue, sendPayload } = this.getRequestConfig('withdraw', finalRequestId);

    const options: any = {};
    if (sendPayload) {
      options.body = {
        [otpKey]: payload.token,
        requestId: finalRequestId,
        action: payloadValue,
      };
    }

    this.http.request(method, url, options).subscribe({
      next: () => {
        this.loading.set(false);
        this.toaster.showSuccess({
          summary: this.transloco.translate('pendingApprovals.withdrawSuccess.title'),
          detail: this.transloco.translate('pendingApprovals.withdrawSuccess.subTitle'),
        });

        callback();
        this.reloadCountRefreshSignal();
      },
      error: () => {
        this.toaster.showError({
          summary: this.transloco.translate('pendingApprovals.error.apiError'),
          detail: this.transloco.translate('pendingApprovals.error.apiErrorDetail'),
        });
        this.loading.set(false);
      },
    });
  };

  rejectProcess = (
    payload: any,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    callback: Function,
  ) => {
    const finalRequestId = payload.requestId || payload.id;
    const { url, method, otpKey, payloadValue, rejectRemark } = this.getRequestConfig('reject');
    const requestPayload = {
      [otpKey]: '12345678',
      requestId: finalRequestId,
      action: payloadValue,
      [rejectRemark as string]: payload?.remark ?? '',
    };

    this.loading.set(true);

    this.http.request(method, url, { body: requestPayload }).subscribe({
      next: () => {
        this.loading.set(false);
        this.toaster.showSuccess({
          summary: this.transloco.translate('pendingApprovals.rejectSuccess.title'),
          detail: this.transloco.translate('pendingApprovals.rejectSuccess.subTitle'),
        });
        callback();
        this.reloadCountRefreshSignal();
      },
      error: () => {
        this.toaster.showError({
          summary: this.transloco.translate('pendingApprovals.error.apiError'),
          detail: this.transloco.translate('pendingApprovals.error.apiErrorDetail'),
        });
        this.loading.set(false);
      },
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  approveRequest(requestId: string, callback: Function) {
    this.softToken.open(this.loading.asReadonly(), (token: string) => {
      if (token) {
        this.approveProcess({ requestId }, token, callback);
      }
    });
  }

  approveProcess = (
    payload: any,
    token: string,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    callback: Function,
  ) => {
    this.loading.set(true);

    const { url, method, otpKey, payloadValue, sendPayload } = this.getRequestConfig('approve', payload.requestId);

    const options: any = {};
    if (sendPayload) {
      options.body = {
        [otpKey]: token,
        requestId: payload.requestId,
        action: payloadValue,
      };
    }

    this.http.request(method, url, options).subscribe({
      next: () => {
        this.loading.set(false);
        this.toaster.showSuccess({
          summary: this.transloco.translate('pendingApprovals.approvedSuccess.title'),
          detail: this.transloco.translate('pendingApprovals.approvedSuccess.subTitle'),
        });
        callback();
        this.reloadCountRefreshSignal();
      },
      error: () => {
        this.toaster.showError({
          summary: this.transloco.translate('pendingApprovals.error.apiError'),
          detail: this.transloco.translate('pendingApprovals.error.apiErrorDetail'),
        });
        this.loading.set(false);
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

  rejectRequestConfirmation(requestId: string) {
    return this.dialogPortal.open(RejectRequest, {
      containerClassNames: ['bg-white h-full p-xl dark:bg-gray-850'],
      classNames: ['self-end mb-2xl 2xl:mb-0 2xl:self-center w-full! 2xl:w-[376px]!'],
      disableClose: true,
      fullWindow: false,
      data: requestId,
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

  getAllListRequest(type: string, params: any, tab?: number): HttpResourceRequest {
    let url = '';
    const methodMap: Record<string, 'GET' | 'POST'> = {
      cheque: 'GET',
      product: 'POST',
      transfer: 'GET',
    };
    const method = methodMap[type] || 'GET';
    if (type === 'transfer') {
      const base = this.isMaker()
        ? '/api/transfer/transfer-workflow/maker-pending'
        : '/api/transfer/transfer-workflow/checker-pending';

      const status = this.getTransferStatuses();
      url = `${base}/${status.toLowerCase()}`;
    } else if (type === 'cheque') {
      url = this.isMaker()
        ? '/api/product/chequebook/workflow/status'
        : '/api/product/chequebook/workflow/checker/status';
    } else if (type === 'product') {
      url = '/api/product/product/request/list';
    }

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
      status: type === 'transfer' ? [] : [mapStatus(this.getStatusTab(isMaker, tab))],
    };
  }

  buildParams(filters: Record<string, any>, pageStart: number, pageSize: number) {
    const filtered = Object.entries(filters).reduce((acc, [key, value]) => {
      if (this.requestType() === 'transfer' && key === 'status') return acc; // skip transfer status in params

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

  getRequestConfig(
    requestType: string,
    requestId?: string,
  ): {
    url: string;
    method: 'put' | 'post' | 'patch' | 'delete';
    otpKey: 'otp' | 'token';
    payloadValue?: string;
    rejectRemark?: 'note' | 'remark';
    sendPayload: boolean;
  } {
    let url = `/api/product/product/request/actions`;
    let method: 'put' | 'post' | 'patch' | 'delete' = 'put';
    let sendPayload = true;

    const action = requestType.toLowerCase();
    const reqType = this.requestType();

    if (reqType === 'transfer') {
      sendPayload = false;

      switch (action) {
        case 'approve':
          url = `/api/transfer/transfer-workflow/approve/${requestId}`;
          method = 'post';
          break;
        case 'reject':
          url = `/api/transfer/transfer-workflow/reject`;
          method = 'patch';
          break;
        case 'withdraw':
          url = `/api/transfer/transfer-workflow/withdraw/${requestId}`;
          method = 'delete';
          break;
        default:
          url = `/api/transfer/transfer-workflow/approve/${requestId}`;
          method = 'post';
      }
    } else if (reqType === 'cheque') {
      sendPayload = true;
      url =
        action === 'withdraw'
          ? `/api/product/chequebook/workflow/withdraw`
          : `/api/product/chequebook/workflow/approve`;
      method = 'post';
    }

    const otpKey: 'otp' | 'token' = reqType === 'cheque' ? 'otp' : 'token';
    const payloadValue = this.getPayloadValue(reqType === 'cheque', action);
    const rejectRemark =
      action === 'reject' ? (reqType === 'cheque' || reqType === 'transfer' ? 'note' : 'remark') : undefined;

    return {
      url,
      method,
      otpKey,
      ...(sendPayload && { payloadValue }),
      ...(rejectRemark && { rejectRemark }),
      sendPayload,
    };
  }

  getTransferStatuses(): string {
    const makerStatuses = ['ALL', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED'];
    const checkerStatuses = ['PENDING_MY_APPROVAL', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED'];

    if (this.isMaker()) {
      return makerStatuses[this.currentTab()] || 'ALL';
    } else {
      return checkerStatuses[this.currentTab()] || 'PENDING_MY_APPROVAL';
    }
  }
  getPendingResource(type: 'cheque' | 'product' | 'transfer') {
    if (type === 'cheque') {
      return httpResource<any>(() => ({
        url: this.isMaker()
          ? '/api/product/chequebook/workflow/status'
          : '/api/product/chequebook/workflow/checker/status',
        params: { status: 'PENDING' },
      }));
    }

    if (type === 'product') {
      return httpResource<CountResponse>(() => ({
        url: '/api/product/product/request/count/pending',
      }));
    }

    if (type === 'transfer') {
      return httpResource<any>(() => ({
        url: this.isMaker()
          ? `/api/transfer/transfer-workflow/maker-pending/pending_approval?pageSize=10&pageStart=0`
          : `/api/transfer/transfer-workflow/checker-pending/pending_my_approval?pageSize=10&pageStart=0`,
      }));
    }

    throw new Error('Invalid type passed to getPendingResource');
  }

  private getPayloadValue(isCheque: boolean, action: string): string {
    if (isCheque) {
      switch (action) {
        case 'approve':
          return 'APPROVED';
        case 'reject':
          return 'REJECTED';
        case 'withdraw':
          return 'WITHDRAW';
        default:
          return action.toUpperCase();
      }
    }
    if (this.requestType() === 'product' && action === 'withdraw') {
      return 'CANCEL';
    }

    return action.toUpperCase();
  }
  reloadCountRefreshSignal() {
    this.reloadSignal.update(v => v + 1);
  }
}
