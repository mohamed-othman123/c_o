import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToasterService } from '@/core/components';
import { AuthStore } from '@/store/auth-store';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { Autofocus } from '@scb/ui/a11y';
import { Alert } from '@scb/ui/alert';
import { Button } from '@scb/ui/button';
import { Card } from '@scb/ui/card';
import { Error, FormField, Label, PasswordInput } from '@scb/ui/form-field';
import { Icon } from '@scb/ui/icon';
import { markControlsTouched } from '@scb/ui/input';
import { EncryptionService } from '@scb/util/encryption';
import { ChangePasswordService } from './change-password.service';

type ChangePasswordForm = FormGroup<{
  currentPassword: FormControl<string>;
  newPassword: FormControl<string>;
  confirmPassword: FormControl<string>;
}>;

@Component({
  selector: 'app-change-password',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ChangePasswordService, EncryptionService],
  imports: [
    ReactiveFormsModule,
    Button,
    FormField,
    PasswordInput,
    Error,
    Label,
    Icon,
    Alert,
    Autofocus,
    Card,
    TranslocoDirective,
  ],
  template: `
    <div class="container-grid px-3xl pt-3xl">
      <div class="col-span-4 sm:col-span-6 2xl:col-span-8 2xl:col-start-3">
        <scb-card
          *transloco="let t"
          class="p-4xl lg: gap-lg col-span-6 mx-auto flex flex-col">
          <h4 class="head-md-s text-center">{{ t('changePassword') }}</h4>

          <form
            [formGroup]="form"
            (ngSubmit)="submit()"
            class="gap-2xl flex flex-col"
            data-testid="CP_FORM">
            <!-- Current Password Field -->
            <scb-form-field>
              <label scbLabel>{{ t('resetPassword.oldPassword') }}</label>
              <input
                meeAutofocus
                scbPasswordInput
                formControlName="currentPassword"
                class="test-current-password"
                data-testid="CP_INPUT_CURRENT_PASSWORD" />
              <p scbError="required">{{ t('resetPassword.oldPasswordRequired') }}</p>
              @if (currentPasswordError()) {
                <p
                  scbError
                  [invalid]="true">
                  {{ t('login.invalidCredentialsDesc') }}
                </p>
              }
            </scb-form-field>

            <!-- New Password Field -->
            <scb-form-field>
              <label scbLabel>{{ t('fp.newPassword') }}</label>
              <input
                scbPasswordInput
                formControlName="newPassword"
                class="test-new-password"
                data-testid="CP_INPUT_NEW_PASSWORD" />
              <p scbError="required">{{ t('fp.newPasswordRequired') }}</p>
            </scb-form-field>

            <!-- Confirm Password Field -->
            <scb-form-field>
              <label scbLabel>{{ t('fp.confirmPassword') }}</label>
              <input
                scbPasswordInput
                formControlName="confirmPassword"
                class="test-confirm-password"
                data-testid="CP_INPUT_CONFIRM_PASSWORD" />
              <p scbError="required">{{ t('fp.confirmPasswordRequired') }}</p>
              <p
                scbError
                [invalid]="misMatch()"
                data-testid="CP_TEXT_CP_MISMATCH">
                {{ t('fp.notMatch') }}
              </p>
            </scb-form-field>

            <!-- Password Requirements -->
            <div class="gap-md flex flex-col">
              <p class="body-sm-s text-text-secondary">
                {{ t('fp.ruleTitle') }}
              </p>
              @for (req of validatorTxt(); track req.text; let index = $index) {
                <div class="body-label-sm gap-sm text-text-tertiary flex">
                  <icon
                    [name]="req.status"
                    [attr.data-testid]="'CP_ICON_RULE_' + index"
                    [class]="
                      req.normal === 0
                        ? 'text-icon-disabled'
                        : req.normal === 1
                          ? 'text-icon-success'
                          : 'text-icon-danger'
                    " />
                  {{ t(req.text) }}
                </div>
              }
            </div>

            @if (repeatedPasswordError()) {
              <scb-alert
                [title]="t('securityProtection.title')"
                [desc]="t('securityProtection.desc')"
                data-testid="CP_ALERT_REPEATED_PASSWORD"
                hideClose />
            }

            <button
              scbButton
              type="submit"
              [loading]="loading()"
              data-testid="CP_BTN_CONTINUE">
              {{ t('continue') }}
            </button>
          </form>
        </scb-card>
      </div>
    </div>
  `,
})
export default class ChangePasswordComponent {
  private readonly router = inject(Router);
  private readonly authStore = inject(AuthStore);
  private readonly changePasswordService = inject(ChangePasswordService);
  private readonly toasterService = inject(ToasterService);
  private readonly encryptionService = inject(EncryptionService);
  readonly transloco = inject(TranslocoService);

  readonly publicKeyResource = httpResource<{ publicKey: string }>('/api/authentication/auth/gen-key');
  readonly publicKey = computed<string>(() => this.publicKeyResource.value()?.publicKey || '');

  readonly loading = signal(false);
  readonly currentPasswordError = signal(false);
  readonly repeatedPasswordError = signal(false);

  private readonly requirements = [
    {
      text: 'fpRules.rule1',
      test: (password: string) => password.length >= 8 && password.length <= 20,
    },
    {
      text: 'fpRules.rule2',
      test: (password: string) => /[A-Z]/.test(password),
    },
    {
      text: 'fpRules.rule3',
      test: (password: string) => /[a-z]/.test(password),
    },
    {
      text: 'fpRules.rule4',
      test: (password: string) => /[0-9]/.test(password),
    },
    {
      text: 'fpRules.rule5',
      test: (password: string) => /[@#$%&^-]/.test(password),
    },
    {
      text: 'fpRules.rule6',
      test: (password: string) => {
        const username = this.authStore.user()?.username || '';
        return !password.toLowerCase().includes(username.toLowerCase());
      },
    },
    {
      text: 'fpRules.rule7',
      test: (password: string) => !/(.)(\1{2,})/.test(password.toLowerCase()),
    },
    {
      text: 'fpRules.rule8',
      test: (password: string) => this.hasNoConsecutiveSequences(password),
    },
  ];

  readonly form: ChangePasswordForm = new FormGroup(
    {
      currentPassword: new FormControl('', {
        validators: [Validators.required],
        nonNullable: true,
      }),
      newPassword: new FormControl('', {
        validators: [Validators.required, Validators.minLength(8), Validators.maxLength(20), this.passwordValidator()],
        nonNullable: true,
      }),
      confirmPassword: new FormControl('', {
        validators: [Validators.required],
        nonNullable: true,
      }),
    },
    { validators: [this.passwordMatchValidator] },
  );

  readonly formStatusChanges = toSignal(this.form.statusChanges, { equal: () => false });
  readonly misMatch = computed(() => {
    const _ = this.formStatusChanges();
    const cp = this.form.controls.confirmPassword;
    return cp.touched && !cp.errors?.['required'] && this.form.errors?.['mismatch'];
  });

  private readonly newPassword = toSignal(this.form.controls.newPassword.valueChanges);
  readonly validatorTxt = computed(() => {
    const password = this.newPassword();

    return this.requirements.map(req => {
      const status = password ? (req.test(password) ? 'success' : 'failure') : 'success';
      return {
        text: req.text,
        normal: !password ? 0 : status === 'success' ? 1 : 2,
        status,
      };
    });
  });

  private hasNoConsecutiveSequences(password: string): boolean {
    const lowerPassword = password.toLowerCase();

    const alphabeticalSequences = [
      'abc',
      'bcd',
      'cde',
      'def',
      'efg',
      'fgh',
      'ghi',
      'hij',
      'ijk',
      'jkl',
      'klm',
      'lmn',
      'mno',
      'nop',
      'opq',
      'pqr',
      'qrs',
      'rst',
      'stu',
      'tuv',
      'uvw',
      'vwx',
      'wxy',
      'xyz',
    ];

    const numericalSequences = ['123', '234', '345', '456', '567', '678', '789'];

    for (const sequence of alphabeticalSequences) {
      if (lowerPassword.includes(sequence)) {
        return false;
      }
    }

    for (const sequence of numericalSequences) {
      if (password.includes(sequence)) {
        return false;
      }
    }

    const reverseAlphabeticalSequences = alphabeticalSequences.map(seq => seq.split('').reverse().join(''));
    for (const sequence of reverseAlphabeticalSequences) {
      if (lowerPassword.includes(sequence)) {
        return false;
      }
    }

    const reverseNumericalSequences = ['321', '432', '543', '654', '765', '876', '987'];
    for (const sequence of reverseNumericalSequences) {
      if (password.includes(sequence)) {
        return false;
      }
    }

    return true;
  }

  async submit() {
    if (this.form.invalid) return markControlsTouched(this.form, { dirty: true, touched: true });

    const { currentPassword, newPassword, confirmPassword } = this.form.getRawValue();
    this.loading.set(true);
    this.currentPasswordError.set(false);
    this.repeatedPasswordError.set(false);

    try {
      const encryptedCurrentPassword = await this.encryptionService.encryptData(currentPassword, this.publicKey());
      const encryptedNewPassword = await this.encryptionService.encryptData(newPassword, this.publicKey());
      const encryptedConfirmPassword = await this.encryptionService.encryptData(confirmPassword, this.publicKey());

      this.changePasswordService
        .changePassword(
          encryptedCurrentPassword.encryptedPassword,
          encryptedNewPassword.encryptedPassword,
          encryptedConfirmPassword.encryptedPassword,
          this.publicKey(),
        )
        .subscribe({
          next: response => {
            this.loading.set(false);
            this.router.navigate(['/dashboard']);
            this.toasterService.showSuccess({
              severity: 'success',
              summary: this.transloco.translate('resetPassword.successTitle'),
            });
          },
          error: (error: any) => {
            this.loading.set(false);
            if (error.error.code === 'AUTH-401') {
              this.currentPasswordError.set(true);
            }
            if (error.error.code === 'AUTH-409') {
              this.repeatedPasswordError.set(true);
            }
            if (error.status === 401 || error.status === 403) {
              this.router.navigate(['/login']);
            }
          },
        });
    } catch (error) {
      this.loading.set(false);
    }
  }

  private passwordValidator() {
    return (control: AbstractControl): { [key: string]: boolean } | null => {
      const password = control.value;

      if (!password) {
        return null;
      }

      const isValid = this.requirements.every(req => req.test(password));

      return isValid ? null : { passwordRequirements: true };
    };
  }

  private passwordMatchValidator(c: AbstractControl) {
    const g = c as ChangePasswordForm;
    return g.controls.newPassword.value === g.controls.confirmPassword.value ? null : { mismatch: true };
  }
}
