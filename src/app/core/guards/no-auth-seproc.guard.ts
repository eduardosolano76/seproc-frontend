// src/app/core/guards/no-auth-seproc.guard.ts

import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AdminSeprocService } from '../services/admin-seproc.service';

export const noAuthGuard: CanActivateFn = (route, state) => {
  const adminService = inject(AdminSeprocService);
  const router = inject(Router);

  return adminService.obtenerUsuario().pipe(
    map(usuario => {
      if (usuario && usuario.nombreUsuario) {
        return router.createUrlTree(['/admin-seproc/dashboard-seproc']);
      }
      return true;
    }),
    catchError(() => {
      return of(true);
    })
  );
};