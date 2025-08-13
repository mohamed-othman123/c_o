import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { AuthService } from '@/auth/api/auth.service';
import { ToasterComponent } from '@/core/components';
import { RolePermissionDirective } from '@/core/directives/role-permission.directive';
import { HeaderDashboard, Logo, ShellItem } from '@/layout/components';
import { LayoutPanel } from '@/layout/components/app-layout-accodion/app-layout-panel';
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
  ],
  templateUrl: './Home.container.html',
})
export class HomeContainer {
  readonly router = inject(Router);
  readonly route = inject(ActivatedRoute);
  readonly layoutFacade = inject(LayoutFacadeService);
  readonly auth = inject(AuthService);
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

  readonly chequeResource = httpResource<any>(() => ({
    url: this.isMaker() ? '/api/product/chequebook/workflow/status' : '/api/product/chequebook/workflow/checker/status',
    params: {
      status: 'PENDING',
    },
  }));

  readonly productResource = httpResource<CountResponse>(() => ({
    url: '/api/product/product/request/count/pending',
  }));

  readonly transferResource = httpResource<CountResponse>(() => ({
    url: '/api/transfer/request/count/pending',
  }));

  readonly chequeCount = computed(() => this.chequeResource.value()?.requests?.length ?? 0);
  readonly productCount = computed(() => this.productResource.value()?.data.count ?? null);
  readonly transferCount = computed(() => this.transferResource.value()?.data.count ?? null);
  readonly totalCount = computed(
    () => (this.chequeCount() ?? 0) + (this.productCount() ?? 0) + (this.transferCount() ?? 0),
  );
  readonly items = computed(() => {
    return {
      label: this.isMaker() ? 'pendingRequestsTitle' : 'pendingApprovalsTitle',
      icon: 'pending-approvals',
      totalCount: this.totalCount(),
      children: [
        { label: 'transfer', count: this.transferCount(), active: true, href: '/pending-transfer', param: 'transfer' },
        { label: 'product', count: this.productCount(), active: false, href: '/pending-product', param: 'product' },
        { label: 'cheque', count: this.chequeCount(), active: false, href: '/pending-cheques', param: 'cheque' },
      ],
    };
  });

  readonly sideMenu = computed(() => {
    const child = this.activeChild();
    return child?.snapshot.data['sideMenu'];
  });

  constructor() {
    this.auth.me().subscribe();
  }
}

export interface CountResponse {
  status: string;
  message: string;
  data: {
    count: number;
  };
}
