import { Injectable, signal } from '@angular/core';

@Injectable()
export class ActivateUser {
  readonly step = signal(1);
  readonly username = signal('');
  readonly email = signal('');
  readonly attempts = signal(3);
  readonly userDetails = signal({ phone: '' });
  otpToken = '';
  resetToken = '';

  next() {
    this.step.update(x => x + 1);
  }
}
