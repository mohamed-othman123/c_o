import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { Icon } from '@scb/ui/icon';
import { PanelMenuModule } from 'primeng/panelmenu';
import { RippleModule } from 'primeng/ripple';

@Component({
  selector: 'app-layout-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PanelMenuModule, RippleModule, Icon, TranslocoDirective, RouterLink, RouterLinkActive],
  template: `
    <div
      class="w-full"
      *transloco="let t; prefix: 'pendingApprovals'">
      <div
        class="p-md hover:bg-sidenav-bg-active flex cursor-pointer items-center justify-between rounded-lg py-2"
        (click)="toggle()">
        <div class="flex items-center">
          <icon
            name="pending-approvals"
            class="prefix ltr:mr-2.5 rtl:ml-2.5" />
          <span class="text-text-tertiary">{{ t(menuItem().label) }}</span>
        </div>
        <span
          class="bg-danger flex h-4 w-4 items-center justify-center rounded-full text-xs leading-6 font-bold text-white">
          {{ menuItem().totalCount }}
        </span>
        <icon
          [name]="isOpen ? 'chevron-up' : 'chevron-down'"
          class="prefix text-i-secondary" />
      </div>

      @if (isOpen && menuItem().children.length > 0) {
        <div
          class="mt-1 flex flex-col gap-1 pl-2"
          *transloco="let t; prefix: 'pendingApprovals.sideMenu'">
          @for (child of menuItem().children; track child) {
            <a
              class="hover:bg-sidenav-bg-active flex cursor-pointer items-center justify-between rounded-lg px-5 py-3 transition"
              [routerLinkActive]="'bg-sidenav-bg-active'"
              [routerLink]="child.href"
              [queryParams]="{ type: child.label }">
              <span>{{ t(child.label) }}</span>
              @if (child.count) {
                <span
                  class="bg-danger flex h-4 w-4 items-center justify-center rounded-full text-xs font-bold text-white">
                  {{ child.count }}
                </span>
              }
            </a>
          }
        </div>
      }
    </div>
  `,
})
export class LayoutPanel {
  readonly menuItem = input.required<any>();
  isOpen = false;

  toggle() {
    this.isOpen = !this.isOpen;
  }
}
