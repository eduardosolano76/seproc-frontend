// src/app/core/guards/admin-seproc.guard.ts

import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AdminSeprocService } from '../services/admin-seproc.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const adminService = inject(AdminSeprocService);
  const router = inject(Router);

  return adminService.obtenerUsuario().pipe(
    map(usuario => {
      if (usuario && usuario.nombreUsuario) {
        return true;
      }
      return router.createUrlTree(['/admin-seproc/login-seproc']);
    }),
    catchError(() => {
      return of(router.createUrlTree(['/admin-seproc/login-seproc']));
    })
  );
};