import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HeaderAuthComponent } from '@/layout/components';
import { ApiError } from '@/models/api';
import { ERR } from '@/models/error';
import { extractTokenData, lockedUserTitleDesc } from '@/utils/utils';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { OtpComponent, OtpStatus } from '../otp/otp.component';
import { ResetPasswordComponent } from '../reset-password/reset-password.component';
import { ForgetPasswordComponent } from './forget-password.component';
import { ForgetPasswordService } from './forget-password.service';
import { ForgetPasswordStore } from './forget-password.store';

@Component({
  selector: 'forget-password-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ForgetPasswordService],
  imports: [HeaderAuthComponent, ResetPasswordComponent, ForgetPasswordComponent, OtpComponent, TranslocoDirective],
  template: `
    <header-auth />
    <div class="page-grid">
      <div
        class="col-span-4 sm:col-start-2 2xl:col-start-5"
        *transloco="let t">
        @switch (fpStore.step()) {
          @case (1) {
            <forget-password-form />
          }
          @case (2) {
            <app-otp
              #otp
              (verify)="verifyOtp()"
              (resend)="resendOtp()"
              [(value)]="otpValue"
              [(status)]="otpStatus"
              [attempts]="fpStore.attempts()">
              <span class="otp-title">{{ t('otp.title') }}</span>
              <span class="otp-desc">{{ t('otp.desc', { phone: fpStore.phone(), email: fpStore.email() }) }}</span>
              @if (otpStatus() === 'required') {
                {{ t('otpRequired') }}
              } @else if (otpStatus() === 'incomplete') {
                {{ t('otp.incompleteOtp') }}
              } @else if (otpStatus() === 'attempts') {
                {{ t('otp.attempts', { attempts: fpStore.attempts() }) }}
              } @else if (otpStatus() === 'maxAttempts') {
                {{ t('otp.maxAttempts') }}
              } @else if (otpStatus() === 'invalid') {
                {{ t('otp.invalidOtp') }}
              } @else if (otpStatus() === 'expired') {
                {{ t('otp.expiredOtp') }}
              }
            </app-otp>
          }
          @case (3) {
            <app-reset-password
              [username]="fpStore.username()"
              [api]="this.forgetPassword">
              <span class="password-title">{{ t('fp.resetPassword') }}</span>
              <span class="success-title">{{ t('fp.successTitle') }}</span>
            </app-reset-password>
          }
        }
      </div>
    </div>
  `,
  host: {
    class: 'flex flex-col min-h-screen',
  },
})
export default class ForgetPasswordContainerComponent {
  readonly fpStore = inject(ForgetPasswordStore);
  readonly fpService = inject(ForgetPasswordService);
  readonly otpComponent = viewChild<OtpComponent>('otp');
  readonly router = inject(Router);
  readonly translocoService = inject(TranslocoService);
  readonly route = inject(ActivatedRoute);
  readonly otpValue = signal('');
  readonly otpStatus = signal<OtpStatus>('valid');

  constructor() {
    this.fetchTokenFromUrl();
  }

  fetchTokenFromUrl(): void {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (token) {
      try {
        // if token is found at route, then show the OTP step
        const tokenData = extractTokenData(token);

        if (!tokenData || !tokenData.email || !tokenData.mobile || !tokenData.expiration || !tokenData.username) {
          // Token extraction failed - show error but stay on page
          console.error('Failed to extract token data from URL token:', token);
          // Don't redirect - let user stay on forget password page to request new reset
          return;
        }

        this.fpStore.setEmail(tokenData.email);
        this.fpStore.setPhone(tokenData.mobile);
        this.fpStore.setUsername(tokenData.username);
        this.fpStore.setOtpToken(token);

        console.log('tokenData', tokenData);
        // Token extraction successful, proceed to OTP step
        this.fpStore.nextStep();
      } catch (error) {
        // Unexpected error during token extraction
        console.error('Unexpected error during token extraction:', error);
        // Don't redirect - let user stay on forget password page to request new reset
      }
    } else {
      // No token in URL - this is normal, user can request password reset
      console.log('No token in URL - user can request password reset');
      // Stay on the forget password page - this is the expected behavior
    }
  }

  verifyOtp() {
    if (!this.otpValue()) return;

    this.otpStatus.set('valid');
    const otpComponent = this.otpComponent()!;
    otpComponent.loading.set(true);
    this.fpService
      .validateOtp({ username: this.fpStore.username(), otp: this.otpValue(), token: this.fpStore.otpToken() })
      .subscribe({
        next: ({ token }) => {
          this.fpStore.setResetToken(token);
          this.fpStore.nextStep();
        },
        error: (error: ApiError<{ details?: { hoursRemaining: number; numberOfAttempts: number } }>) => {
          otpComponent.loading.set(false);
          this.fpStore.setAttempts(error.error.details?.numberOfAttempts ?? 0);
          otpComponent.restartTimer(error.error.code === ERR.LOCKED_TEMPORARILY);
          if (error.error.code === ERR.INVALID_OTP) {
            this.otpStatus.set('invalid');
          } else if (error.error.code === ERR.EXPIRED_OTP) {
            this.otpStatus.set('expired');
          } else if (error.error.code === ERR.LOCKED_TEMPORARILY) {
            this.otpStatus.set('valid');
            this.showLockPopup(error.error.details!.hoursRemaining!);
          } else if (error.error.code === ERR.MAX_ATTEMPTS) {
            this.otpStatus.set('maxAttempts');
          } else if (error.error.code === ERR.EXPIRED_TOKEN) {
            this.router.navigate(['/login']);
            return;
          }
          this.otpValue.set('');
        },
      });
  }

  // This function is an arrow because we have to pass it as an input
  forgetPassword = (password: string) => {
    return this.fpService.forgetPassword({
      username: this.fpStore.username(),
      password,
      token: this.fpStore.resetToken(),
    });
  };

  resendOtp() {
    const otpComponent = this.otpComponent()!;
    otpComponent.resendLoading.set(true);
    this.fpService.resendOtp(this.fpStore.username(), this.fpStore.otpToken()).subscribe({
      next: ({ numberOfAttempts }) => {
        otpComponent.restartTimer(false, true);
        this.otpStatus.set('attempts');
        this.fpStore.setAttempts(numberOfAttempts);
      },
      error: (error: ApiError) => {
        otpComponent.restartTimer(error.error.code === ERR.LOCKED_TEMPORARILY, true);
        if (error.error.code === ERR.LOCKED_TEMPORARILY) {
          this.showLockPopup(error.error.details!.hoursRemaining!);
        } else if (error.error.code === ERR.LOCKED) {
          // No action is required
        }
      },
    });
  }

  private showLockPopup(date: string) {
    const otpComponent = this.otpComponent()!;
    const time = lockedUserTitleDesc(date, this.translocoService);
    otpComponent.lockPopup(time.title, time.description);
  }
}
