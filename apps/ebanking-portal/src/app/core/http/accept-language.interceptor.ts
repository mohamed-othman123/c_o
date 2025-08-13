import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { LayoutFacadeService } from '@/layout/layout.facade.service';

export const AcceptLanguageInterceptor: HttpInterceptorFn = (req, next) => {
  const layoutStore = inject(LayoutFacadeService);
  if (req.url.startsWith('/api')) {
    req = req.clone({
      headers: req.headers.set('Accept-Language', layoutStore.language().toUpperCase()),
    });
  }
  return next(req);
};
