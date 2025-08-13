import { effect, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { fromEvent, interval, merge, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { AuthService } from '@/auth/api/auth.service';
import { IdleAlertService } from '@/core/components/idle-alert/idle-alert.service';
import { AppConfigService } from '@/core/config/app-config.service';
import { AuthStore } from '@/store/auth-store';

/**
 * Clean session manager using only signals and RxJS.
 * - Detects user activity and tracks inactivity duration
 * - Pings `/me` periodically while authenticated
 * - Logs out on idle timeout or backend 401
 */
@Injectable({ providedIn: 'root' })
export class SessionIdleService {
  private readonly authService = inject(AuthService);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly appConfig = inject(AppConfigService);
  private readonly idleAlert = inject(IdleAlertService);

  // Signal-based state management
  private readonly isActive = signal(false);
  private readonly lastActivityTime = signal(Date.now());
  private readonly isIdleAlertOpen = signal(false);

  // Subscriptions
  private activitySub?: Subscription;
  private keepaliveSub?: Subscription;
  private idleTimer?: number;
  private finalTimer?: number;
  private accessExpiryTimer?: number;

  constructor() {
    // React to auth state changes using signal effects
    effect(() => {
      const isAuthed = this.authStore.isAuthenticated();
      if (isAuthed) {
        this.start();
      } else {
        this.stop();
      }
    });
  }

  private start(): void {
    this.startActivityWatcher();
    this.startKeepalive();
    this.scheduleAccessExpiryWatcher();
  }

  private stop(): void {
    this.clearAllTimers();
    this.unsubscribeAll();
    this.idleAlert.closeAll();
  }

  private startKeepalive(): void {
    if (this.keepaliveSub) {
      this.keepaliveSub.unsubscribe();
    }

    const keepaliveMs = this.appConfig.config.keepalive * 1000;
    this.keepaliveSub = interval(keepaliveMs)
      .pipe(
        switchMap(() => this.authService.me()),
        tap({
          error: () => this.forceLogout(),
        }),
      )
      .subscribe();
  }

  private startActivityWatcher(): void {
    if (this.activitySub) {
      this.activitySub.unsubscribe();
    }

    const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    const activity$ = merge(...activityEvents.map(evt => fromEvent(document, evt))).pipe(
      debounceTime(200),
      distinctUntilChanged(),
    );

    this.activitySub = activity$.subscribe(() => {
      this.handleUserActivity();
    });

    // Start the initial idle timer
    this.scheduleIdleTimer();
  }

  private handleUserActivity(): void {
    this.lastActivityTime.set(Date.now());
    this.isActive.set(true);

    // Clear existing timers
    this.clearIdleTimers();

    // Close any open idle alert
    if (this.isIdleAlertOpen()) {
      this.idleAlert.closeAll();
      this.isIdleAlertOpen.set(false);
    }

    // Restart idle timer
    this.scheduleIdleTimer();
  }

  private scheduleIdleTimer(): void {
    const idleMs = this.appConfig.config.idle * 1000;

    this.idleTimer = window.setTimeout(() => {
      this.handleIdleTimeout();
    }, idleMs);
  }

  private handleIdleTimeout(): void {
    const timeoutMs = this.appConfig.config.timeout * 1000;

    // Open idle alert
    this.isIdleAlertOpen.set(true);
    this.idleAlert.open({
      seconds: this.appConfig.config.timeout,
      onExtend: () => this.handleSessionExtend(),
      onCancel: () => this.forceLogout(),
    });

    // Schedule final timeout
    this.finalTimer = window.setTimeout(() => {
      this.forceLogout();
    }, timeoutMs);
  }

  private handleSessionExtend(): void {
    // Clear final timeout
    if (this.finalTimer) {
      clearTimeout(this.finalTimer);
      this.finalTimer = undefined;
    }

    // Close alert and restart idle timer
    this.idleAlert.closeAll();
    this.isIdleAlertOpen.set(false);
    this.scheduleIdleTimer();
  }

  private scheduleAccessExpiryWatcher(): void {
    if (this.accessExpiryTimer) {
      clearTimeout(this.accessExpiryTimer);
    }

    const tokens = this.authStore.tokens();
    if (!tokens?.accessToken || !tokens.issuedAtMs || !tokens.expiresIn) {
      return;
    }

    const now = Date.now();
    const expiresAtMs = tokens.issuedAtMs + tokens.expiresIn * 1000;
    const msUntilExpiry = Math.max(0, expiresAtMs - now);

    this.accessExpiryTimer = window.setTimeout(() => {
      this.handleAccessTokenExpiry();
    }, msUntilExpiry);
  }

  private handleAccessTokenExpiry(): void {
    this.isIdleAlertOpen.set(true);
    this.idleAlert.open({
      seconds: this.appConfig.config.timeout,
      onExtend: () => {
        // Try to refresh token
        this.authService.refreshToken().subscribe({
          next: () => {
            // Token refreshed, reschedule expiry watcher and close dialog
            this.scheduleAccessExpiryWatcher();
            this.idleAlert.closeAll();
            this.isIdleAlertOpen.set(false);
          },
          error: () => this.forceLogout(),
        });
      },
      onCancel: () => this.forceLogout(),
    });
  }

  private clearAllTimers(): void {
    this.clearIdleTimers();
    if (this.accessExpiryTimer) {
      clearTimeout(this.accessExpiryTimer);
      this.accessExpiryTimer = undefined;
    }
  }

  private clearIdleTimers(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = undefined;
    }
    if (this.finalTimer) {
      clearTimeout(this.finalTimer);
      this.finalTimer = undefined;
    }
  }

  private unsubscribeAll(): void {
    if (this.activitySub) {
      this.activitySub.unsubscribe();
      this.activitySub = undefined;
    }
    if (this.keepaliveSub) {
      this.keepaliveSub.unsubscribe();
      this.keepaliveSub = undefined;
    }
  }

  private forceLogout(): void {
    this.stop();
    this.authStore.clearAuthState();
    this.router.navigate(['/login']);
  }

  // Public methods for external control if needed
  public resetActivity(): void {
    this.handleUserActivity();
  }

  public getLastActivityTime(): number {
    return this.lastActivityTime();
  }

  public isUserActive(): boolean {
    return this.isActive();
  }
}
