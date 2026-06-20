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
      // Si ya hay sesión, lo sacamos del login y lo mandamos al dashboard
      router.navigate(['/admin-seproc/dashboard-seproc']);
      return false; 
    }),
    catchError(() => {
      // Si da error (401), significa que NO hay sesión, por lo tanto SÍ lo dejamos ver el login
      return of(true);
    })
  );
};