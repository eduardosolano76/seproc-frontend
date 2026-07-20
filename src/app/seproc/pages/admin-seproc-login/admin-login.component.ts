// src/app/seproc/pages/admin-login/admin-login.component.ts

import { CommonModule } from '@angular/common';
import { Component, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { timeout, finalize, switchMap } from 'rxjs';
import { AdminSeprocService } from '../../../core/services/admin-seproc.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-login.component.html',
  styleUrl: './admin-login.component.css'
})
export class AdminLoginComponent {

  username = '';
  password = '';

  mensajeError = '';
  loading = false;
  formularioEnviado = false;

  constructor(
    private adminService: AdminSeprocService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }
  iniciarSesion(): void {
    if (this.loading) {
      return;
    }

    this.formularioEnviado = true;
    this.mensajeError = '';

    /*
     * Si alguno de los campos está vacío, no se muestra una
     * tarjeta general. Los mensajes aparecerán debajo de cada campo.
     */
    if (!this.username.trim() || !this.password.trim()) {
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();

    this.adminService
      .login(this.username.trim(), this.password)
      .pipe(
        switchMap(() => this.adminService.obtenerCsrf()),
        timeout(8000),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.router.navigate(
            ['/seproc/admin-seproc/dashboard-seproc'],
            {
              replaceUrl: true
            }
          );
        },
        error: (err) => {
          console.error('Error de login:', err);

          if (err.status === 401) {
            this.mensajeError =
              'Usuario o contraseña incorrectos.';
          } else if (err.status === 403) {
            this.mensajeError =
              'No se pudo validar la seguridad de la solicitud. Intenta nuevamente.';
          } else if (err.name === 'TimeoutError') {
            this.mensajeError =
              'El servidor tardó demasiado en responder. Intenta nuevamente.';
          } else {
            this.mensajeError =
              err.error?.mensaje ??
              'Ocurrió un error al iniciar sesión.';
          }
          this.cdr.detectChanges();
        }
      });
  }

    campoInvalido(campo: 'username' | 'password'): boolean {
    const valor =
      campo === 'username'
        ? this.username
        : this.password;

    return this.formularioEnviado && !valor.trim();
  }
}