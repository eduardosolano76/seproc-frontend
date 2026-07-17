// src/app/seproc/pages/institucion-login/institucion-login.component.ts

import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import {
    NonNullableFormBuilder,
    ReactiveFormsModule,
    Validators
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { finalize } from 'rxjs';

import { Institucion } from '../../../core/models/institucion.model';
import { SeprocService } from '../../../core/services/seproc.service';
import { AuthInstitucionService } from '../../../core/services/auth-institucion.service';

@Component({
    selector: 'app-institucion-login',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule
    ],
    templateUrl: './institucion-login.component.html',
    styleUrl: './institucion-login.component.css'
})
export class InstitucionLoginComponent implements OnInit {

    private readonly fb = inject(NonNullableFormBuilder);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly titleService = inject(Title);
    private readonly seprocService = inject(SeprocService);
    private readonly authService = inject(AuthInstitucionService);
    private readonly cdr = inject(ChangeDetectorRef);

    institucion: Institucion | null = null;
    abreviacion: string | null = null;

    cargando = false;
    enviando = false;
    mensajeError = '';
    mensajeExito = '';

    readonly loginForm = this.fb.group({
        username: ['', Validators.required],
        password: ['', Validators.required]
    });

    ngOnInit(): void {
        const abreviacionParametro =
            this.route.snapshot.paramMap.get('abreviacion');

        if (!abreviacionParametro) {
            this.titleService.setTitle('SEPROC | Iniciar sesión');
            return;
        }

        this.abreviacion = abreviacionParametro.trim().toLowerCase();
        this.cargarInstitucion(this.abreviacion);
    }

    private cargarInstitucion(abreviacion: string): void {
        this.cargando = true;
        this.mensajeError = '';

        this.seprocService
            .obtenerInstitucionPorAbreviacion(abreviacion)
            .pipe(
                finalize(() => {
                    this.cargando = false;

                    // Notifica a Angular que debe actualizar la vista
                    this.cdr.markForCheck();
                })
            )
            .subscribe({
                next: (institucion) => {
                    this.institucion = institucion;

                    this.titleService.setTitle(
                        `${institucion.abreviacion} | Iniciar sesión`
                    );
                },
                error: (error) => {
                    console.error(
                        'Error al obtener la institución:',
                        error
                    );

                    this.router.navigate(['/seproc'], {
                        replaceUrl: true
                    });
                }
            });
    }

    iniciarSesion(): void {
        this.mensajeError = '';
        this.mensajeExito = '';

        if (this.loginForm.invalid) {
            this.loginForm.markAllAsTouched();
            return;
        }

        const { username, password } = this.loginForm.getRawValue();

        this.enviando = true;

        this.authService.login({
            username,
            password,
            empresa: this.abreviacion ?? ''
        })
            .pipe(
                finalize(() => {
                    this.enviando = false;
                    this.cdr.markForCheck();
                })
            )
            .subscribe({
                next: (respuesta) => {
                    this.mensajeExito = respuesta.mensaje;

                    window.location.assign(
                        this.authService.obtenerUrlBackend(
                            respuesta.redirectUrl
                        )
                    );
                },
                error: (error) => {
                    this.mensajeError =
                        error.error?.mensaje ??
                        'No fue posible iniciar sesión. Inténtalo nuevamente.';
                }
            });
    }

    get logoInstitucion(): string {
        const logoUrl = this.institucion?.logoUrl?.trim();

        const logoInvalido =
            !logoUrl ||
            logoUrl.toLowerCase() === 'null' ||
            logoUrl.toLowerCase() === 'undefined';

        if (!logoInvalido) {
            return this.authService.obtenerUrlBackend(logoUrl);
        }

        return this.obtenerLogoAlternativo();
    }

    private obtenerLogoAlternativo(): string {
        const abreviacion =
            this.institucion?.abreviacion?.trim() ||
            this.abreviacion?.trim() ||
            'SEPROC';

        return `https://ui-avatars.com/api/?name=${encodeURIComponent(abreviacion)}&background=155093&color=fff`;
    }

    usarLogoAlternativo(event: Event): void {
        const imagen = event.target as HTMLImageElement;

        // Evita un ciclo infinito si también falla el avatar
        imagen.onerror = null;
        imagen.src = this.obtenerLogoAlternativo();
    }

    get registroUrl(): string {
        if (!this.abreviacion) {
            return '#';
        }

        return this.authService.obtenerUrlBackend(
            `/registro/${encodeURIComponent(this.abreviacion)}`
        );
    }

    campoInvalido(campo: 'username' | 'password'): boolean {
        const control = this.loginForm.controls[campo];

        return control.invalid && control.touched;
    }
}