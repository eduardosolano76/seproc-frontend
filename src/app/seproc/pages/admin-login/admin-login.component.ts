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

  constructor(
    private adminService: AdminSeprocService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  iniciarSesion(): void {
    this.mensajeError = '';

    if (!this.username.trim() && !this.password.trim()) {
      this.mensajeError = 'Ingresa tu usuario y contraseña.';
      this.cdr.detectChanges();
      return;
    }

    if (!this.username.trim()) {
      this.mensajeError = 'Ingresa tu usuario.';
      this.cdr.detectChanges();
      return;
    }

    if (!this.password.trim()) {
      this.mensajeError = 'Ingresa tu contraseña.';
      this.cdr.detectChanges();
      return;
    }

    if (this.loading) {
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();

    this.adminService.login(this.username, this.password)
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
          this.router.navigate(['/admin-seproc/dashboard-seproc'], {
            replaceUrl: true
          });
        },
        error: (err) => {
          console.log('Error de login:', err);

          if (err.status === 401) {
            this.mensajeError = 'Usuario o contraseña incorrectos.';
            this.username = '';
            this.password = '';
          } else if (err.status === 403) {
            this.mensajeError = 'No se pudo validar la seguridad de la solicitud. Intenta nuevamente.';
            this.password = '';
          } else if (err.name === 'TimeoutError') {
            this.mensajeError = 'El servidor tardó demasiado en responder. Intenta nuevamente.';
          } else {
            this.mensajeError = 'Ocurrió un error al iniciar sesión.';
          }

          this.cdr.detectChanges();
        }
      });
  }
}