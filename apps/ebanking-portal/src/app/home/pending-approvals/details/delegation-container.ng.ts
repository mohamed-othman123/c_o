import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { AuthService } from '@/auth/api/auth.service';
import { AppBreadcrumbsComponent, Skeleton } from '@/core/components';
import { TranslocoDirective } from '@jsverse/transloco';
import { Button } from '@scb/ui/button';
import { Card } from '@scb/ui/card';
import { Icon } from '@scb/ui/icon';
import { ActionButtons } from '../action-buttons.ng';
import { ApprovalRejection } from './model';

@Component({
  selector: 'app-delegation-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppBreadcrumbsComponent, Button, Icon, Skeleton, TranslocoDirective, Card, ActionButtons],
  template: `<section class="col-span-12 max-sm:hidden 2xl:row-span-1">
      <app-breadcrumbs
        *transloco="let t; prefix: 'breadcrumbs'"
        [routes]="[
          { label: t('pendingApprovals'), path: '/transfer' },
          { label: t(title()), path: parentPath() },
          { label: 'Request 27384', path: '' },
        ]"></app-breadcrumbs>
    </section>

    <scb-card class="gap-2xl col-span-12 row-span-8 flex flex-col">
      @if (apiStatus() === 'loading') {
        <div
          class="py-3xl sm:px-3xl col-span-12 px-4"
          data-testid="LCS_LOADING_STATE">
          <scb-skeleton
            width="15%"
            height="40px" />
          <scb-skeleton width="50%" />
          <scb-skeleton width="50%" />
          <scb-skeleton width="80%" />
          <scb-skeleton width="90%" />
          <scb-skeleton width="100%" />
        </div>
      } @else if (apiStatus() === 'error') {
        <div
          *transloco="let t; prefix: 'dashboard'"
          class="py-3xl sm:px-3xl col-span-12 flex w-full flex-col items-center justify-center gap-3 px-4 text-center"
          data-testid="LCS_ERROR_STATE">
          <icon
            [name]="'api-failure'"
            class="text-3xl"
            data-testid="LCS_API_FAILURE_ICON" />
          <h4
            class="head-2xs-s text-text-primary"
            data-testid="LCS_API_ERROR_TITLE">
            {{ t('error.apiError') }}
          </h4>
          <p
            class="body-sm text-text-primary"
            data-testid="LCS_API_ERROR_DETAIL">
            {{ t('error.apiErrorDetail') }}
          </p>
          <button
            scbButton
            variant="ghost"
            size="sm"
            icon="refresh"
            data-testid="LCS_RELOAD_BUTTON"
            (click)="reload.emit()">
            {{ t('error.reload') }}
          </button>
        </div>
      } @else {
        <div
          class="gap-2xl flex flex-col"
          *transloco="let t; prefix: 'products'">
          <div class="gap-2xl flex items-center">
            <h4 class="head-xs-s flex-1">{{ t(pageTitle()) }}</h4>
            @if (requestId() && status() && showActions()) {
              <app-action-buttons
                [requestId]="requestId()!"
                [status]="status()!"
                [buttonSize]="'lg'"
                [approved]="approved()"
                (reload)="reload.emit()"
                [type]="type()" />
            }
          </div>
          <div class="gap-2xl flex flex-col md:flex-row">
            <ng-content />
          </div>
        </div>
      }
    </scb-card>`,
  host: {
    class: 'container-grid py-3xl px-3xl',
  },
})
export class DelegationContainer {
  readonly authService = inject(AuthService);

  readonly title = input.required<string>();
  readonly type = input.required<string>();
  readonly parentPath = input.required<string>();
  readonly apiStatus = input.required<string>();
  readonly status = input.required<string | undefined>();
  readonly pageTitle = input.required<string>();
  readonly requestId = input<string>();
  readonly approved = input.required<number>();
  readonly approvals = input<ApprovalRejection[]>();

  readonly showActions = computed(() => {
    const list = this.approvals() || [];
    const roles = this.authService.getRolesFromToken();
    return !list.some(x => roles.includes(x.role as any));
  });

  readonly reload = output();
}
