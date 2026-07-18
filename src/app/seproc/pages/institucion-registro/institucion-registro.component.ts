// src/app/seproc/pages/institucion-registro/institucion-registro.component.ts

import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';

import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  ActivatedRoute,
  Router,
  RouterLink
} from '@angular/router';

import { Title } from '@angular/platform-browser';
import { finalize } from 'rxjs';

import { Institucion } from '../../../core/models/institucion.model';
import { SeprocService } from '../../../core/services/seproc.service';

import {
  AuthInstitucionService,
  RegistroInstitucionRequest
} from '../../../core/services/auth-institucion.service';

const REGEX_NOMBRE =
  /^[\p{L}\p{M}]+(?:[ '’][\p{L}\p{M}]+)*$/u;


const REGEX_USERNAME =
  /^[A-Za-z][A-Za-z0-9]*(?:[._-][A-Za-z0-9]+)*$/;

const REGEX_PASSWORD =
  /^(?=.*\p{Ll})(?=.*\p{Lu})(?=.*[0-9])(?=.*[^\p{L}\p{N}\s])\S+$/u;

const REGEX_EMAIL =
  /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,63}$/;

type CampoRegistro =
  | 'nombre'
  | 'apellido'
  | 'email'
  | 'username'
  | 'password';

@Component({
  selector: 'app-institucion-registro',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './institucion-registro.component.html',

  // Reutilizamos el diseño del login
  styleUrls: [
    '../institucion-login/institucion-login.component.css',
    './institucion-registro.component.css'
  ]
})
export class InstitucionRegistroComponent implements OnInit {

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
  registroExitoso = false;
  formularioEnviado = false;

  mensajeError = '';
  mensajeExito = '';

  erroresCampos: Partial<Record<CampoRegistro, string>> = {};

  readonly registroForm = this.fb.group({
    nombre: ['', [
      Validators.required,
      Validators.maxLength(250),
      Validators.pattern(REGEX_NOMBRE)
    ]],

    apellido: ['', [
      Validators.required,
      Validators.maxLength(250),
      Validators.pattern(REGEX_NOMBRE)
    ]],

    email: ['', [
      Validators.required,
      Validators.email,
      Validators.maxLength(100),
      Validators.pattern(REGEX_EMAIL)
    ]],

    username: ['', [
      Validators.required,
      Validators.minLength(4),
      Validators.maxLength(50),
      Validators.pattern(REGEX_USERNAME)
    ]],

    password: ['', [
      Validators.required,
      Validators.minLength(8),
      Validators.maxLength(64),
      Validators.pattern(REGEX_PASSWORD)
    ]]
  });

  ngOnInit(): void {
    const parametro =
      this.route.snapshot.paramMap.get('abreviacion');

    if (!parametro) {
      this.router.navigate(['/seproc'], {
        replaceUrl: true
      });

      return;
    }

    this.abreviacion = parametro.trim().toLowerCase();
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
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (institucion) => {
          this.institucion = institucion;

          this.titleService.setTitle(
            `${institucion.abreviacion} | Registro`
          );
        },
        error: (error) => {
          console.error(
            'Error al cargar la institución:',
            error
          );

          this.router.navigate(['/seproc'], {
            replaceUrl: true
          });
        }
      });
  }

  registrar(): void {
    this.formularioEnviado = true;
    this.mensajeError = '';
    this.mensajeExito = '';
    this.erroresCampos = {};

    if (this.registroForm.invalid) {
      return;
    }

    if (!this.abreviacion || !this.institucion) {
      this.mensajeError =
        'No se pudo identificar la institución.';
      return;
    }

    const datos: RegistroInstitucionRequest =
      this.registroForm.getRawValue();

    this.enviando = true;

    this.authService
      .registrar(this.abreviacion, datos)
      .pipe(
        finalize(() => {
          this.enviando = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (respuesta) => {
          this.mensajeExito =
            respuesta.mensaje ||
            'Tu solicitud de registro fue enviada correctamente.';

          this.registroExitoso = true;
          this.registroForm.reset();
          this.formularioEnviado = false;
        },
        error: (error) => {
          console.error(
            'Error al realizar el registro:',
            error
          );

          this.erroresCampos =
            error.error?.errores ?? {};

          this.mensajeError =
            error.error?.mensaje ??
            'No fue posible enviar la solicitud de registro.';
        }
      });
  }

  campoInvalido(campo: CampoRegistro): boolean {
    const control = this.registroForm.controls[campo];
    const tieneContenido = control.value.trim().length > 0;

    // Errores enviados por el backend
    if (this.erroresCampos[campo]) {
      return true;
    }

    // Al enviar, muestra los campos obligatorios vacíos
    if (this.formularioEnviado) {
      return control.invalid;
    }

    // Mientras escribe, valida solamente si tiene contenido
    return (
      control.dirty &&
      tieneContenido &&
      control.invalid
    );
  }

  mensajeCampo(campo: CampoRegistro): string {
    if (this.erroresCampos[campo]) {
      return this.erroresCampos[campo]!;
    }

    const control = this.registroForm.controls[campo];

    if (control.hasError('required')) {
      return 'Este campo es obligatorio.';
    }

    if (control.hasError('email')) {
      return 'Escribe un correo electrónico válido.';
    }

    if (control.hasError('minlength')) {
      const minimo =
        control.getError('minlength')?.requiredLength;

      return `Debe contener al menos ${minimo} caracteres.`;
    }

    if (control.hasError('maxlength')) {
      const maximo =
        control.getError('maxlength')?.requiredLength;

      return `No puede superar los ${maximo} caracteres.`;
    }

    if (control.hasError('pattern')) {
      switch (campo) {
        case 'nombre':
          return 'El nombre solo puede contener letras, espacios y apóstrofes.';

        case 'apellido':
          return 'Los apellidos solo pueden contener letras, espacios y apóstrofes.';

        case 'email':
          return 'Escribe un correo electrónico válido.';

        case 'username':
          return 'Debe iniciar con una letra y solo puede contener letras, números, punto, guion y guion bajo.';

        case 'password':
          return 'Debe incluir mayúscula, minúscula, número, carácter especial y no contener espacios.';
      }
    }
    return '';
  }

  limpiarErrorCampo(campo: CampoRegistro): void {
    if (this.erroresCampos[campo]) {
      delete this.erroresCampos[campo];
    }
  }

  get logoInstitucion(): string {
    const logoUrl =
      this.institucion?.logoUrl?.trim();

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

    imagen.onerror = null;
    imagen.src = this.obtenerLogoAlternativo();
  }
}