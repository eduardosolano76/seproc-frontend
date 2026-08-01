// src/app/core/guards/constructor-institucion.guard.ts

import { inject } from '@angular/core';
import {
    CanActivateFn,
    RedirectCommand,
    Router,
} from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { ConstructorInstitucionService } from
    '../services/constructor-institucion.service';

export const constructorInstitucionGuard: CanActivateFn = (
    route,
) => {
    const constructorService = inject(
        ConstructorInstitucionService,
    );
    const router = inject(Router);

    const abreviacionParametro = route.pathFromRoot
        .map((snapshot) =>
            snapshot.paramMap.get('abreviacion'),
        )
        .find((valor) => Boolean(valor));

    const abreviacionRuta = abreviacionParametro
        ?.trim()
        .toLowerCase();

    const redirigir = (comandos: readonly any[]) =>
        new RedirectCommand(
            router.createUrlTree(comandos),
            { replaceUrl: true },
        );

    return constructorService.obtenerPerfil().pipe(
        map((perfil) => {
            const rol = perfil.rolUsuario
                ?.trim()
                .toUpperCase();

            const abreviacionReal = perfil.abreviacion
                ?.trim()
                .toLowerCase();

            if (
                rol !== 'CONTRATISTA' ||
                !abreviacionReal
            ) {
                return redirigir(['/inicio']);
            }

            sessionStorage.setItem(
                'institucionAbreviacion',
                abreviacionReal,
            );

            if (abreviacionRuta !== abreviacionReal) {
                return redirigir([
                    '/',
                    abreviacionReal,
                    'constructor-institucion',
                    'dashboard',
                ]);
            }

            return true;
        }),
        catchError(() => {
            if (abreviacionRuta) {
                return of(
                    redirigir([
                        '/login',
                        abreviacionRuta,
                    ]),
                );
            }

            return of(redirigir(['/inicio']));
        }),
    );
};