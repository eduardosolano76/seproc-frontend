// src/app/seproc/pages/seproc-page/seproc-page.component.ts

import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Institucion } from '../../../core/models/institucion.model';
import { SolicitudInstitucion } from '../../../core/models/solicitud-institucion.model';
import { SeprocService } from '../../../core/services/seproc.service';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

const REGEX_NOMBRE_DEPENDENCIA =
  /^[\p{L}\p{M}\p{N}](?:[\p{L}\p{M}\p{N} .,'’&()\/#º°:-]*[\p{L}\p{M}\p{N}).º°])?$/u;

const REGEX_ABREVIACION =
  /^[A-Za-z][A-Za-z0-9]*(?:-[A-Za-z0-9]+)*$/;

const REGEX_NOMBRE_CONTACTO =
  /^[\p{L}\p{M}]+(?:[ '’][\p{L}\p{M}]+)*$/u;

const REGEX_EMAIL =
  /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,63}$/;

const REGEX_TELEFONO =
  /^(?:\+52[ -]?)?(?:[0-9]{10}|[0-9]{3}[ -][0-9]{3}[ -][0-9]{4}|\([0-9]{3}\)[ -]?[0-9]{3}[ -][0-9]{4})$/;

type SeprocView = 'home' | 'dependencias' | 'solicitar';

type CampoSolicitud =
  | 'nombreDependencia'
  | 'abreviacion'
  | 'nombreContacto'
  | 'emailContacto'
  | 'telefonoContacto';

@Component({
  selector: 'app-seproc-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './seproc-page.component.html',
  styleUrl: './seproc-page.component.css'
})

export class SeprocPageComponent implements OnInit {

  private readonly fb =
    inject(NonNullableFormBuilder);

  private readonly seprocService =
    inject(SeprocService);

  private readonly cdr = 
    inject(ChangeDetectorRef);

  activeView: SeprocView = 'home';

  instituciones: Institucion[] = [];

  showSuccessModal = false;
  enviando = false;
  formularioEnviado = false;

  mensajeExito = '';
  mensajeError = '';

  erroresCampos:
    Partial<Record<CampoSolicitud, string>> = {};

  readonly solicitudForm = this.fb.group({

    nombreDependencia: ['', [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(200),
      Validators.pattern(REGEX_NOMBRE_DEPENDENCIA)
    ]],

    abreviacion: ['', [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(50),
      Validators.pattern(REGEX_ABREVIACION)
    ]],

    nombreContacto: ['', [
      Validators.required,
      Validators.maxLength(250),
      Validators.pattern(REGEX_NOMBRE_CONTACTO)
    ]],

    emailContacto: ['', [
      Validators.required,
      Validators.email,
      Validators.maxLength(100),
      Validators.pattern(REGEX_EMAIL)
    ]],

    telefonoContacto: ['', [
      Validators.required,
      Validators.maxLength(20),
      Validators.pattern(REGEX_TELEFONO)
    ]]
  });

  ngOnInit(): void {
    this.cargarInstituciones();
  }

  switchView(view: SeprocView): void {
    this.activeView = view;

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  cargarInstituciones(): void {
    this.seprocService.obtenerInstituciones().subscribe({
      next: (data) => {
        this.instituciones = data;
      },
      error: (error) => {
        console.error('Error al cargar instituciones', error);
      }
    });
  }

  enviarSolicitud(): void {
    this.formularioEnviado = true;
    this.mensajeError = '';
    this.mensajeExito = '';
    this.erroresCampos = {};

    if (this.solicitudForm.invalid) {
      this.solicitudForm.markAllAsTouched();
      return;
    }

    const datosFormulario =
      this.solicitudForm.getRawValue();

    const solicitud: SolicitudInstitucion = {
      nombreDependencia:
        datosFormulario.nombreDependencia.trim(),

      abreviacion:
        datosFormulario.abreviacion.trim(),

      nombreContacto:
        datosFormulario.nombreContacto.trim(),

      emailContacto:
        datosFormulario.emailContacto.trim(),

      telefonoContacto:
        datosFormulario.telefonoContacto.trim()
    };

    this.enviando = true;

    this.seprocService
      .enviarSolicitud(solicitud)
      .pipe(
        finalize(() => {
          this.enviando = false;

          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (response) => {
          this.mensajeExito =
            response?.mensaje ||
            '¡Tu solicitud ha sido enviada correctamente! El equipo de SeProc se pondrá en contacto pronto.';

          this.showSuccessModal = true;
          this.activeView = 'home';

          this.solicitudForm.reset();
          this.formularioEnviado = false;
          this.erroresCampos = {};

          window.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
        },
        error: (error) => {
          console.error(
            'Error al enviar solicitud',
            error
          );

          this.erroresCampos =
            (error.error?.errores ?? {}) as
            Partial<Record<CampoSolicitud, string>>;

          this.mensajeError =
            error.error?.mensaje ??
            'No fue posible enviar la solicitud. Inténtalo nuevamente.';
        }
      });
  }

  campoInvalido(campo: CampoSolicitud): boolean {
    const control =
      this.solicitudForm.controls[campo];

    const tieneContenido =
      control.value.trim().length > 0;

    // Error recibido desde Spring Boot
    if (this.erroresCampos[campo]) {
      return true;
    }

    // Al intentar enviar muestra todos los errores
    if (this.formularioEnviado) {
      return control.invalid;
    }

    // Mientras escribe solo valida campos con contenido
    return (
      control.dirty &&
      tieneContenido &&
      control.invalid
    );
  }

  mensajeCampo(campo: CampoSolicitud): string {
    if (this.erroresCampos[campo]) {
      return this.erroresCampos[campo]!;
    }

    const control =
      this.solicitudForm.controls[campo];

    if (control.hasError('required')) {
      return 'Este campo es obligatorio.';
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

    if (control.hasError('email')) {
      return 'Escribe un correo electrónico válido.';
    }

    if (control.hasError('pattern')) {
      switch (campo) {
        case 'nombreDependencia':
          return 'Utiliza el nombre oficial de la dependencia. Solo se permiten letras, números, espacios y signos propios de un nombre institucional.';

        case 'abreviacion':
          return 'Debe iniciar con una letra y solo puede contener letras, números y guiones.';

        case 'nombreContacto':
          return 'El nombre solo puede contener letras, espacios y apóstrofes.';

        case 'emailContacto':
          return 'Escribe un correo electrónico válido.';

        case 'telefonoContacto':
          return 'Escribe un teléfono mexicano de 10 dígitos, por ejemplo: 7471234567 o +52 747 123 4567.';
      }
    }

    return '';
  }

  limpiarErrorCampo(campo: CampoSolicitud): void {
    if (this.erroresCampos[campo]) {
      delete this.erroresCampos[campo];
    }
  }

  convertirAbreviacionMayusculas(event: Event): void {
    const valor = (event.target as HTMLInputElement).value.toUpperCase();

    this.solicitudForm.controls.abreviacion.setValue(valor, {
      emitEvent: false
    });

    this.limpiarErrorCampo('abreviacion');
  }

  cerrarModal(): void {
    this.showSuccessModal = false;
  }

  obtenerLogo(inst: Institucion): string {
    if (inst.logoUrl && inst.logoUrl.trim() !== '') {
      return inst.logoUrl;
    }

    return `https://ui-avatars.com/api/?name=${encodeURIComponent(inst.abreviacion)}&background=155093&color=fff`;
  }
}