// src/app/seproc/pages/seproc-page/seproc-page.component.ts

import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Institucion } from '../../../core/models/institucion.model';
import { SolicitudInstitucion } from '../../../core/models/solicitud-institucion.model';
import { SeprocService } from '../../../core/services/seproc.service';
import { RouterLink } from '@angular/router';

type SeprocView = 'home' | 'dependencias' | 'solicitar';

@Component({
  selector: 'app-seproc-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './seproc-page.component.html',
  styleUrl: './seproc-page.component.css'
})
export class SeprocPageComponent implements OnInit {

  activeView: SeprocView = 'home';

  instituciones: Institucion[] = [];

  showSuccessModal = false;

  mensajeExito = '';

  solicitud: SolicitudInstitucion = {
    nombreDependencia: '',
    abreviacion: '',
    nombreContacto: '',
    emailContacto: '',
    telefonoContacto: ''
  };

  constructor(private seprocService: SeprocService) { }

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

  enviarSolicitud(form: NgForm): void {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    this.seprocService.enviarSolicitud(this.solicitud).subscribe({
      next: (response) => {
        this.mensajeExito =
          response?.mensaje ||
          '¡Tu solicitud ha sido enviada correctamente! El equipo de SeProc se pondrá en contacto pronto.';

        this.showSuccessModal = true;
        this.activeView = 'home';

        form.resetForm();

        this.solicitud = {
          nombreDependencia: '',
          abreviacion: '',
          nombreContacto: '',
          emailContacto: '',
          telefonoContacto: ''
        };
      },
      error: (error) => {
        console.error('Error al enviar solicitud', error);
        alert('Ocurrió un error al enviar la solicitud. Inténtalo nuevamente.');
      }
    });
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

  obtenerLoginUrl(inst: Institucion): string {
    return `/login/${inst.abreviacion.toLowerCase()}`;
  }
}