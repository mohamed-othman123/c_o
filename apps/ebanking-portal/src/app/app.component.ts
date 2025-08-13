import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SessionIdleService } from './core/services/session-idle.service';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class AppComponent {
  constructor(private sessionIdleService: SessionIdleService) {
    // Service automatically starts when user is authenticated
    // No need to call any init methods!
  }
}
