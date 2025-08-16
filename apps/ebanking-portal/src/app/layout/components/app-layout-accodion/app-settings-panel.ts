import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LayoutFacadeService } from '@/layout/layout.facade.service';
import { TranslocoDirective } from '@jsverse/transloco';
import { Icon } from '@scb/ui/icon';
import { Tooltip } from '@scb/ui/tooltip';

@Component({
  selector: 'app-settings-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, TranslocoDirective, RouterLink, RouterLinkActive, Tooltip],
  template: `
    <div
      class="w-full"
      *transloco="let t; prefix: 'dashboardLayout'">
      <div
        class="{{
          'hover:bg-sidenav-bg-active flex cursor-pointer items-center rounded-lg py-2 transition-[padding] ' +
            (layoutFacade.iconMode() ? 'justify-center p-md' : 'justify-between p-md')
        }}"
        [scbTooltip]="layoutFacade.iconMode() ? t(menuItem().label) : ''"
        scbTooltipPosition="left"
        (click)="toggle()">
        <div class="flex items-center gap-3 ltr:mr-1.5 rtl:ml-1.5">
          <icon
            name="settings"
            class="prefix" />
          @if (!layoutFacade.iconMode()) {
            <span class="text-text-tertiary">{{ t(menuItem().label) }}</span>
          }
        </div>
        @if (!layoutFacade.iconMode()) {
          <icon
            [name]="isOpen ? 'chevron-up' : 'chevron-down'"
            class="prefix text-i-secondary" />
        }
      </div>

      @if (isOpen && !layoutFacade.iconMode() && menuItem().children && menuItem().children.length > 0) {
        <div
          class="mt-1 flex flex-col gap-1 pl-2"
          *transloco="let t; prefix: 'dashboardLayout'">
          @for (child of menuItem().children; track child.href) {
            @let isActive = sideMenu() && sideMenu() === child.href;
            @let iconName = isActive && child.activeIcon ? child.activeIcon : child.icon;
            <a
              class="{{
                'hover:bg-sidenav-bg-active flex cursor-pointer items-center rounded-lg px-5 py-3 transition ' +
                  (isActive
                    ? 'body-label-md-m! text-text-primary bg-sidenav-bg-active'
                    : 'body-label-md! text-text-tertiary')
              }}"
              [routerLinkActive]="'bg-sidenav-bg-active'"
              [routerLink]="child.href"
              [attr.data-testid]="child.testId">
              @if (child.icon) {
                <icon
                  [name]="iconName"
                  class="{{ 'w-2xl ltr:mr-2.5 rtl:ml-2.5 ' + (isActive ? 'text-icon-brand' : '') }}" />
              }
              <span>{{ t(child.label) }}</span>
            </a>
          }
        </div>
      }
    </div>
  `,
})
export class SettingsPanel {
  readonly layoutFacade = inject(LayoutFacadeService);
  readonly menuItem = input.required<any>();
  readonly sideMenu = input('');
  isOpen = false;

  toggle() {
    if (!this.layoutFacade.iconMode()) {
      this.isOpen = !this.isOpen;
    }
  }
}
