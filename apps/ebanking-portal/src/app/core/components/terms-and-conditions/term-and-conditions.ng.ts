import { httpResource, HttpResourceRef } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, input, model, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { dialogPortal } from '@scb/ui/dialog';
import { Icon } from '@scb/ui/icon';
import { CheckboxModule } from 'primeng/checkbox';
import { TermsAndConditionsContent } from './term-and-conditions-content.ng';

export enum TERMS_AND_CONDITIONS_ID {
  CHEQUE_BOOK = 'CHEQUE_BOOK',
  CORPORATE_CDS_3_YEARS_USD_FIXED_INTEREST = 'CORPORATE_CDS_3_YEARS_USD_FIXED_INTEREST',
  CORPORATE_CDS_5_YEARS_USD = 'CORPORATE_CDS_5_YEARS_USD',
  CORPORATE_FIXED_INTEREST_TD = 'CORPORATE_FIXED_INTEREST_TD',
  CORPORATE_FLOATING_INTEREST_TD = 'CORPORATE_FLOATING_INTEREST_TD',
  SUB_ACCOUNT_TNC = 'SUB_ACCOUNT_TNC',
}

export type TCRef = HttpResourceRef<
  | {
      status: 'success';
      pdfBase64: string;
    }
  | undefined
>;

@Component({
  selector: 'app-terms-and-conditions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CheckboxModule, ReactiveFormsModule, TranslocoPipe, Icon],
  template: `<div class="gap-lg body-md flex items-center">
      <p-checkbox
        inputId="size_normal"
        name="size"
        size="large"
        binary="true"
        variant="filled"
        [formControl]="field()"
        (click)="handledTermClick($event)" />
      <span>
        {{ 'termsAndConditions.Iagree' | transloco }}
        <button
          (click)="open($event)"
          class="cursor-pointer underline">
          {{ 'termsAndConditions.termsAndConditions' | transloco }}.
        </button>
      </span>
    </div>
    @if (field().touched && field().invalid) {
      <p class="mf-sm text-input-text-danger gap-sm flex items-start">
        <icon
          name="info-circle"
          class="w-[18px] flex-none" />
        {{ 'termsAndConditions.sectionRequired' | transloco }}
      </p>
    }`,
  host: {
    class: 'flex flex-col gap-sm',
  },
})
export class TermsAndConditions {
  readonly dialog = dialogPortal();
  readonly type = input.required<TERMS_AND_CONDITIONS_ID>();
  readonly field = model.required<FormControl>();
  readonly load = signal(false);
  readonly pdfSource: TCRef = httpResource<{ status: 'success'; pdfBase64: string }>(() =>
    this.load() ? `/api/dashboard/lookup/tnc?tncFile=${this.type()}` : undefined,
  );

  handledTermClick(ev: MouseEvent) {
    const isAccepted = this.field().value;
    if (!isAccepted) {
      this.open(ev);
    } else {
      this.reset();
    }
  }

  private reset() {
    setTimeout(() => {
      this.field().setValue(false);
    });
  }

  open(ev: MouseEvent) {
    ev.stopPropagation();
    // we have to uncheck the checkbox before opening, settimeout is required for primeng to accept the value
    this.reset();
    this.load.set(true);
    const ref = this.dialog.open(TermsAndConditionsContent, {
      header: false,
      maxWidth: '90vw',
      width: '1000px',
      maxHeight: '75svh',
      height: '600px',
      data: { ref: this.pdfSource },
      containerClassNames: ['tnc_custom_class'],
    });

    ref.afterClosed.subscribe(res => {
      this.field().setValue(res ? true : false);
    });
  }
}
