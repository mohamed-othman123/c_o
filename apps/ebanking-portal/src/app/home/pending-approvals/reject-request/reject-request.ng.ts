import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToasterService } from '@/core/components';
import { noScriptsOrHtmlTagsValidator } from '@/core/validators/custom-validators';
import { LayoutFacadeService } from '@/layout/layout.facade.service';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { Autofocus } from '@scb/ui/a11y';
import { Button } from '@scb/ui/button';
import { FormField, Label, ScbInput } from '@scb/ui/form-field';
import { Icon } from '@scb/ui/icon';
import { DialogRef } from '@scb/ui/portal';
import { PendingRequestsApprovalsService } from '../pending-approvals.service';

@Component({
  selector: 'reject-request-form',
  templateUrl: './reject-request.ng.html',
  providers: [ToasterService],
  imports: [
    Button,
    Icon,
    TranslocoDirective,
    Autofocus,
    TranslocoDirective,
    Icon,
    Label,
    Button,
    ScbInput,
    ReactiveFormsModule,
    FormField,
  ],
  host: {
    class: 'flex flex-col',
  },
})
export class RejectRequest {
  readonly pendingService = inject(PendingRequestsApprovalsService);
  readonly diaRef = inject(DialogRef);
  readonly router = inject(Router);
  readonly layoutFacade = inject(LayoutFacadeService);
  readonly toasterService = inject(ToasterService);

  //   readonly beneficiaryData = inject(BeneficiaryData);
  readonly data = this.diaRef.data as any;
  readonly translateService = inject(TranslocoService);
  readonly loading = signal(false);
  readonly lang = computed(() => this.layoutFacade.language());
  readonly descriptionField = new FormControl('', { nonNullable: true });
  // Form to manage the form fields
  readonly form = new FormGroup({
    remark: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, noScriptsOrHtmlTagsValidator()],
    }),
  });

  confirm() {
    if (this.form.valid) {
      this.loading.set(true);
      const body = { remark: this.form.value.remark || '', requestId: this.data };
      const payload = { ...body };

      this.pendingService.rejectProcess(payload, () => {
        this.diaRef.close(true);
      });
    }
  }

  close() {
    this.diaRef.close(false);
  }
}
