import { inject } from '@angular/core';
import {
  CanActivateFn,
  Router
} from '@angular/router';
import {
  catchError,
  map,
  of
} from 'rxjs';

import { AdminInstitucionService } from '../services/admin-institucion.service';

export const adminInstitucionGuard: CanActivateFn = () => {
  const adminService = inject(AdminInstitucionService);
  const router = inject(Router);

  return adminService.obtenerPerfil().pipe(
    map(perfil => {
      const rol = perfil.rolUsuario
        ?.trim()
        .toUpperCase();

      if (rol === 'ADMINISTRADOR') {
        return true;
      }

      return router.createUrlTree(['/seproc']);
    }),
    catchError(() => {
      const abreviacion =
        sessionStorage.getItem('institucionAbreviacion');

      if (abreviacion) {
        return of(
          router.createUrlTree([
            '/seproc/login',
            abreviacion.toLowerCase()
          ])
        );
      }

      return of(router.createUrlTree(['/seproc']));
    })
  );
};