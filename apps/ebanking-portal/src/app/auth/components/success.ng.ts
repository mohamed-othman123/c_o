import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LayoutFacadeService } from '@/layout/layout.facade.service';
import { TranslocoDirective } from '@jsverse/transloco';
import { Button } from '@scb/ui/button';
import { Card } from '@scb/ui/card';
import { Icon } from '@scb/ui/icon';

@Component({
  selector: 'auth-success',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card, Button, Icon, RouterLink, TranslocoDirective],
  template: `
    <scb-card
      class="px-xl py-3xl sm:p-4xl flex flex-col text-center"
      *transloco="let t">
      <div class="mb-xl h-7xl flex justify-center">
        <icon
          [name]="layoutFacade.isDarkTheme() ? 'web-success-dark' : 'web-success'"
          data-testid="FP_ICON_SUCCESS" />
      </div>
      <h4
        class="head-md-s mb-4xl"
        data-testid="FP_TEXT_SUCCESS_TITLE">
        <ng-content />
      </h4>
      <button
        scbButton
        routerLink="/login"
        data-testid="FP_BTN_BACK_TO_LOGIN">
        {{ t('backToLogin') }}
      </button>
    </scb-card>
  `,
})
export class SuccessComponent {
  readonly layoutFacade = inject(LayoutFacadeService);
}
