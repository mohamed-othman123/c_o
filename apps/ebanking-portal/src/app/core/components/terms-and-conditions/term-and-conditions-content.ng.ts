import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { Skeleton, TCRef } from '@/core/components';
import { LayoutFacadeService } from '@/layout/layout.facade.service';
import { TranslocoDirective } from '@jsverse/transloco';
import { Button } from '@scb/ui/button';
import { Card } from '@scb/ui/card';
import { DialogRef } from '@scb/ui/portal';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';

@Component({
  selector: 'app-terms-and-conditions-content',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Card, Skeleton, TranslocoDirective, NgxExtendedPdfViewerModule],
  template: `
    <ng-container *transloco="let t; prefix: 'termsAndConditions'">
      <h4 class="head-sm-s text-center">{{ t('title') }}</h4>
      <div
        #scrollContent
        class="{{ 'gap-lg grid h-full flex-1 ' + (pdfSource.isLoading() ? 'overflow-hidden' : 'overflow-auto') }}">
        @if (pdfSource.isLoading()) {
          <scb-card>
            <scb-skeleton width="70%" />
            <scb-skeleton />
            <scb-skeleton />
            <scb-skeleton />
            <scb-skeleton />
            <scb-skeleton />
            <scb-skeleton />
            <scb-skeleton />
            <scb-skeleton />
          </scb-card>
        } @else {
          <ngx-extended-pdf-viewer
            [src]="pdfSrc()"
            [language]="layoutFacade.isArabic() ? 'ar-EG' : 'en-US'"
            [showSidebarButton]="false"
            [showToolbar]="false"
            [textLayer]="true"
            (pagesLoaded)="onPdfLoaded()">
          </ngx-extended-pdf-viewer>
        }
      </div>
      <button
        scbButton
        size="md"
        [disabled]="!enableButton()"
        (click)="close(true)">
        {{ t('acceptButton') }}
      </button>
    </ng-container>
  `,
  styles: `
    ::ng-deep .tnc_custom_class {
      height: inherit;
    }
  `,
  host: {
    class: 'p-3xl flex flex-col gap-xl max-h-[inherit] h-[inherit]',
  },
})
export class TermsAndConditionsContent {
  readonly dialogRef = inject<DialogRef<{ ref: TCRef }>>(DialogRef);
  readonly doc = inject(DOCUMENT);
  readonly enableButton = signal(false);
  readonly layoutFacade = inject(LayoutFacadeService);

  readonly scrollContent = viewChild.required<ElementRef<HTMLDivElement>>('scrollContent');
  readonly pdfSource = this.dialogRef.data!.ref;
  readonly base64PDF = computed(() => this.pdfSource.value()?.pdfBase64 || '');
  readonly pdfSrc = computed(() => (this.base64PDF() ? `data:application/pdf;base64,${this.base64PDF()}` : ''));

  onPdfLoaded() {
    const el = this.doc.querySelector<HTMLDivElement>('#viewerContainer');

    if (!el) {
      this.enableButton.set(true);
      return;
    }

    const listen = () => {
      const totalHeight = el.scrollTop + el.offsetHeight;
      if (el.scrollHeight - 5 < totalHeight) {
        this.enableButton.set(true);
      }
    };

    if (el.scrollHeight <= el.offsetHeight + 5) {
      this.enableButton.set(true);
    } else {
      el.addEventListener('scroll', listen);
    }
  }

  close(accepted = false) {
    if (!this.enableButton()) return;
    this.dialogRef.close(accepted);
  }
}
