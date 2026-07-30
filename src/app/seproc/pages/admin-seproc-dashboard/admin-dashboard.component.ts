// src/app/seproc/pages/admin-dashboard/admin-dashboard.component.ts

import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminSeprocService } from '../../../core/services/admin-seproc.service';
import { SolicitudPendiente } from '../../../core/models/solicitud-pendiente.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {

  nombreUsuario = 'Admin';
  rolUsuario = 'Súper Administrador';

  pendientes: SolicitudPendiente[] = [];
  busqueda = '';

  mensajeExito = '';
  menuOpen = false;
  cargando = true;
  sidebarCollapsed = false;

  constructor(
    private adminService: AdminSeprocService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  ngOnInit(): void {
    this.cargarUsuario();
    this.cargarSolicitudes();
  }

  get pendientesFiltradas(): SolicitudPendiente[] {
    const texto = this.busqueda.toLowerCase().trim();

    if (!texto) {
      return this.pendientes;
    }

    return this.pendientes.filter(sol =>
      sol.nombreDependencia.toLowerCase().includes(texto) ||
      sol.nombreContacto.toLowerCase().includes(texto) ||
      sol.emailContacto.toLowerCase().includes(texto)
    );
  }

  cargarUsuario(): void {
    this.adminService.obtenerUsuario().subscribe({
      next: (usuario) => {
        this.nombreUsuario = usuario.nombreUsuario;
        this.rolUsuario = usuario.rolUsuario;
        this.cdr.detectChanges();
      },
      error: () => {
        this.router.navigate(['/admin-seproc/login-seproc']);
      }
    });
  }

  cargarSolicitudes(): void {
    this.cargando = true;

    this.adminService.obtenerPendientes().subscribe({
      next: (data) => {
        this.pendientes = data;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.cargando = false;
        this.cdr.detectChanges();
        this.router.navigate(['/admin-seproc/login-seproc']);
      }
    });
  }

  aprobar(id: number): void {
    const confirmar = confirm(
      '¿Estás seguro de aprobar esta institución? Esto creará un nuevo inquilino en la base de datos.'
    );

    if (!confirmar) return;

    this.adminService.aprobarSolicitud(id).subscribe({
      next: () => {
        this.mensajeExito = '¡Institución y cuenta de Administrador creadas con éxito!';
        this.cargarSolicitudes();
      }
    });
  }

  rechazar(id: number): void {
    const confirmar = confirm('¿Seguro que deseas rechazar esta solicitud?');

    if (!confirmar) return;

    this.adminService.rechazarSolicitud(id).subscribe({
      next: () => {
        this.mensajeExito = 'La solicitud ha sido rechazada correctamente.';
        this.cargarSolicitudes();
      }
    });
  }

  logout(): void {
    this.adminService.logout().subscribe({
      next: () => {
        this.adminService.limpiarCsrf();

        this.router.navigate(['/admin-seproc/login-seproc'], {
          replaceUrl: true
        });
      },
      error: () => {
        this.adminService.limpiarCsrf();

        this.router.navigate(['/admin-seproc/login-seproc'], {
          replaceUrl: true
        });
      }
    });
  }
}