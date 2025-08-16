import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';

export interface ForgetPasswordState {
  otpToken: string;
  resetToken: string;
  step: number;
  username: string;
  email: string;
  phone: string;
  attempts: number;
}

export const ForgetPasswordStore = signalStore(
  { providedIn: 'root' },
  withState({
    otpToken: '',
    resetToken: '',
    step: 1,
    username: '',
    email: '',
    phone: '',
    attempts: 3,
  }),
  withMethods(store => ({
    setOtpToken(otpToken: string) {
      patchState(store, { otpToken });
    },
    setResetToken(resetToken: string) {
      patchState(store, { resetToken });
    },
    setStep(step: number) {
      patchState(store, { step });
    },
    setUsername(username: string) {
      patchState(store, { username });
    },
    setEmail(email: string) {
      patchState(store, { email });
    },
    setPhone(phone: string) {
      patchState(store, { phone });
    },
    setAttempts(attempts: number) {
      patchState(store, { attempts });
    },
    nextStep() {
      patchState(store, { step: store.step() + 1 });
    },
    prevStep() {
      patchState(store, { step: store.step() - 1 });
    },
    reset() {
      patchState(store, {
        otpToken: '',
        resetToken: '',
        step: 1,
        username: '',
        email: '',
        phone: '',
        attempts: 3,
      });
    },
  })),
);
