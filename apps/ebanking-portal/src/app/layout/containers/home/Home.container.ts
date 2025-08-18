import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { AuthService } from '@/auth/api/auth.service';
import { ToasterComponent } from '@/core/components';
import { RolePermissionDirective } from '@/core/directives/role-permission.directive';
import { PendingRequestsApprovalsService } from '@/home/pending-approvals/pending-approvals.service';
import { HeaderDashboard, Logo, ShellItem } from '@/layout/components';
import { LayoutPanel } from '@/layout/components/app-layout-accodion/app-layout-panel';
import { SettingsPanel } from '@/layout/components/app-layout-accodion/app-settings-panel';
import { LayoutFacadeService } from '@/layout/layout.facade.service';
import { TranslocoDirective } from '@jsverse/transloco';
import { Button } from '@scb/ui/button';
import { Sidenav, SidenavHeader } from '@scb/ui/sidenav';
import { AccordionModule } from 'primeng/accordion';
import { PanelMenuModule } from 'primeng/panelmenu';

@Component({
  selector: 'app-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ToasterComponent,
    RouterOutlet,
    Sidenav,
    Button,
    SidenavHeader,
    HeaderDashboard,
    Logo,
    ShellItem,
    TranslocoDirective,
    RolePermissionDirective,
    AccordionModule,
    PanelMenuModule,
    LayoutPanel,
    SettingsPanel,
  ],
  templateUrl: './Home.container.html',
})
export class HomeContainer {
  readonly router = inject(Router);
  readonly route = inject(ActivatedRoute);
  readonly layoutFacade = inject(LayoutFacadeService);
  readonly auth = inject(AuthService);
  readonly pendingService = inject(PendingRequestsApprovalsService);
  readonly activeChild = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(() => {
        let child = this.route.firstChild;
        while (child?.firstChild) {
          child = child.firstChild;
        }
        return child;
      }),
      filter(child => child !== null),
    ),
  );

  protected isMaker(): boolean {
    const userRoles = this.auth.getRolesFromToken();
    return userRoles.includes('MAKER') && !userRoles.includes('SUPER_USER');
  }
  readonly chequeResource = this.pendingService.getPendingResource('cheque');
  readonly productResource = this.pendingService.getPendingResource('product');
  readonly transferResource = this.pendingService.getPendingResource('transfer');

  readonly chequeCount = computed(() => this.chequeResource.value()?.requests?.length ?? 0);
  readonly productCount = computed(() => this.productResource.value()?.data.count ?? null);
  readonly transferCount = computed(() => this.transferResource.value()?.requests?.length ?? 0);
  readonly totalCount = computed(
    () => (this.chequeCount() ?? 0) + (this.productCount() ?? 0) + (this.transferCount() ?? 0),
  );
  readonly items = computed(() => {
    return {
      label: this.isMaker() ? 'pendingRequestsTitle' : 'pendingApprovalsTitle',
      icon: 'pending-approvals',
      totalCount: this.totalCount(),
      children: [
        { label: 'transfer', count: this.transferCount(), active: true, href: '/pending-transfer' },
        { label: 'product', count: this.productCount(), active: false, href: '/pending-product' },
        { label: 'cheque', count: this.chequeCount(), active: false, href: '/pending-cheques' },
      ],
    };
  });

  settingsItems = {
    label: 'Settings',
    icon: 'settings',
    children: [
      {
        label: 'ChangePassword',
        icon: 'change-password',
        activeIcon: 'change-password-solid',
        href: '/change-password',
        testId: 'HOME_MAIN_CHANGE_PASSWORD_LINK',
      },
    ],
  };

  readonly sideMenu = computed(() => {
    const child = this.activeChild();
    return child?.snapshot.data['sideMenu'];
  });

  constructor() {
    this.auth.me().subscribe();
    effect(() => {
      this.pendingService.reloadSignal();
      this.transferResource.reload();
      this.chequeResource.reload();
      this.productResource.reload();
    });
  }
}

export interface CountResponse {
  status: string;
  message: string;
  data: {
    count: number;
  };
}
