// src/app/core/guards/admin-seproc.guard.ts

import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AdminSeprocService } from '../services/admin-seproc.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const adminService = inject(AdminSeprocService);
  const router = inject(Router);

  // Llamamos al endpoint /me del backend
  return adminService.obtenerUsuario().pipe(
    map(usuario => {
      // Si el backend responde con los datos del usuario, la sesión existe
      if (usuario && usuario.nombreUsuario) {
        return true; 
      }
      // Si responde bien pero viene vacío (raro, pero por si acaso)
      router.navigate(['/admin-seproc/login-seproc']);
      return false;
    }),
    catchError((error) => {
      // Si el backend devuelve un 401 Unauthorized (la sesión expiró o no existe)
      // redirigimos al login
      router.navigate(['/admin-seproc/login-seproc']);
      return of(false); // Bloqueamos la navegación
    })
  );
};