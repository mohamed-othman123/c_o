import { Directive, inject } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { CanDeactivateComponent } from '@/core/guards/can-deactivate-leave.guard';
import { LayoutFacadeService } from '@/layout/layout.facade.service';
import { TranslocoService } from '@jsverse/transloco';

@Directive({
  host: {
    '(window:beforeunload)': 'onBeforeUnload($event)',
  },
})
export class FormDeactivate implements CanDeactivateComponent {
  readonly layoutFacade = inject(LayoutFacadeService);
  readonly translateService = inject(TranslocoService);

  setForm(form: FormGroup) {
    form.valueChanges.subscribe(() => {
      this.markDirty(!form.dirty);
    });
  }

  canDeactivate(): boolean {
    if (!this.layoutFacade.getCanLeave()) {
      const message = this.translateService.translate('beneficiary.addForm.confirmCloseBeneficiaryForm');
      return window.confirm(message);
    }
    return true;
  }

  onBeforeUnload(event: BeforeUnloadEvent) {
    if (!this.layoutFacade.getCanLeave()) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  markDirty(canLeave: boolean) {
    this.layoutFacade.setCanLeave(canLeave);
  }
}
