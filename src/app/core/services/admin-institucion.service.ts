// src/app/core/services/admin-institucion.service.ts

import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpParams
} from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment.development';
import {
  ApiMensaje,
  CambiarPassword,
  DetalleEtapa,
  DocumentacionInicial,
  EstadoProyecto,
  EstadoSolicitud,
  HistorialEtapa,
  PerfilAdminInstitucion,
  ProyectoDetalle,
  ProyectoResumen,
  SolicitudDetalle,
  SolicitudResumen,
  Supervisor,
  UsuarioAdmin,
  UsuarioUpsert
} from '../models/admin-institucion.model';

@Injectable({
  providedIn: 'root'
})
export class AdminInstitucionService {

  private readonly apiUrl =
    `${environment.apiUrl.replace(/\/$/, '')}/admin`;

  private readonly authUrl =
    `${environment.apiUrl.replace(/\/$/, '')}/auth`;

  private readonly backendUrl =
    environment.apiUrl.replace(/\/api\/?$/, '');

  constructor(private readonly http: HttpClient) { }

  obtenerPerfil(): Observable<PerfilAdminInstitucion> {
    return this.http.get<PerfilAdminInstitucion>(
      `${this.apiUrl}/perfil`,
      { withCredentials: true }
    );
  }

  obtenerSolicitudes(
    estado: EstadoSolicitud
  ): Observable<SolicitudResumen[]> {
    const params = new HttpParams().set('estado', estado);

    return this.http.get<SolicitudResumen[]>(
      `${this.apiUrl}/solicitudes`,
      {
        params,
        withCredentials: true
      }
    );
  }

  obtenerDetalleSolicitud(
    idSolicitud: number
  ): Observable<SolicitudDetalle> {
    return this.http.get<SolicitudDetalle>(
      `${this.apiUrl}/solicitudes/${idSolicitud}`,
      { withCredentials: true }
    );
  }

  obtenerSupervisores(): Observable<Supervisor[]> {
    return this.http.get<Supervisor[]>(
      `${this.apiUrl}/solicitudes/supervisores`,
      { withCredentials: true }
    );
  }

  aprobarSolicitud(
    idSolicitud: number,
    supervisorId: number
  ): Observable<string> {
    const params = new HttpParams()
      .set('supervisorId', supervisorId.toString());

    return this.http.post(
      `${this.apiUrl}/solicitudes/${idSolicitud}/aprobar`,
      null,
      {
        params,
        withCredentials: true,
        responseType: 'text'
      }
    );
  }

  rechazarSolicitud(
    idSolicitud: number,
    motivo: string
  ): Observable<string> {
    const params = new HttpParams().set('motivo', motivo);

    return this.http.post(
      `${this.apiUrl}/solicitudes/${idSolicitud}/rechazar`,
      null,
      {
        params,
        withCredentials: true,
        responseType: 'text'
      }
    );
  }

  obtenerProyectos(
    estado: EstadoProyecto
  ): Observable<ProyectoResumen[]> {
    const params = new HttpParams().set('estado', estado);

    return this.http.get<ProyectoResumen[]>(
      `${this.apiUrl}/proyectos`,
      {
        params,
        withCredentials: true
      }
    );
  }

  obtenerDetalleProyecto(
    idProyecto: number
  ): Observable<ProyectoDetalle> {
    return this.http.get<ProyectoDetalle>(
      `${this.apiUrl}/proyectos/${idProyecto}`,
      { withCredentials: true }
    );
  }

  obtenerDetalleEtapa(
    idProyecto: number,
    etapa: string
  ): Observable<DetalleEtapa> {
    return this.http.get<DetalleEtapa>(
      `${this.apiUrl}/proyectos/${idProyecto}/etapas/${encodeURIComponent(etapa)}`,
      { withCredentials: true }
    );
  }

  obtenerHistorialEtapa(
    idProyecto: number,
    etapa: string
  ): Observable<HistorialEtapa[]> {
    return this.http.get<HistorialEtapa[]>(
      `${this.apiUrl}/proyectos/${idProyecto}/etapas/${encodeURIComponent(etapa)}/historial`,
      { withCredentials: true }
    );
  }

  cambiarEstadoProyecto(
    idProyecto: number,
    estado: EstadoProyecto
  ): Observable<string> {
    const params = new HttpParams().set('estado', estado);

    return this.http.post(
      `${this.apiUrl}/proyectos/${idProyecto}/estado`,
      null,
      {
        params,
        withCredentials: true,
        responseType: 'text'
      }
    );
  }

  obtenerUsuarios(view: string): Observable<UsuarioAdmin[]> {
    const params = new HttpParams().set('view', view);

    return this.http.get<UsuarioAdmin[]>(
      `${this.apiUrl}/usuarios`,
      {
        params,
        withCredentials: true
      }
    );
  }

  obtenerUsuariosPendientes(): Observable<UsuarioAdmin[]> {
    return this.http.get<UsuarioAdmin[]>(
      `${this.apiUrl}/usuarios/pendientes`,
      { withCredentials: true }
    );
  }

  obtenerUsuario(id: number): Observable<UsuarioAdmin> {
    return this.http.get<UsuarioAdmin>(
      `${this.apiUrl}/usuarios/${id}`,
      { withCredentials: true }
    );
  }

  crearUsuario(
    usuario: UsuarioUpsert
  ): Observable<ApiMensaje> {
    return this.http.post<ApiMensaje>(
      `${this.apiUrl}/usuarios`,
      usuario,
      { withCredentials: true }
    );
  }

  actualizarUsuario(
    id: number,
    usuario: UsuarioUpsert
  ): Observable<ApiMensaje> {
    return this.http.put<ApiMensaje>(
      `${this.apiUrl}/usuarios/${id}`,
      usuario,
      { withCredentials: true }
    );
  }

  eliminarUsuario(id: number): Observable<ApiMensaje> {
    return this.http.delete<ApiMensaje>(
      `${this.apiUrl}/usuarios/${id}`,
      { withCredentials: true }
    );
  }

  aprobarUsuarioPendiente(
    id: number,
    rolNombre: string
  ): Observable<ApiMensaje> {
    const params = new HttpParams().set('rolNombre', rolNombre);

    return this.http.post<ApiMensaje>(
      `${this.apiUrl}/usuarios/${id}/aprobar`,
      null,
      {
        params,
        withCredentials: true
      }
    );
  }

  rechazarUsuarioPendiente(id: number): Observable<ApiMensaje> {
    return this.http.post<ApiMensaje>(
      `${this.apiUrl}/usuarios/${id}/rechazar`,
      null,
      { withCredentials: true }
    );
  }

  subirFotoPerfil(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<{ url: string }>(
      `${this.apiUrl}/perfil/foto`,
      formData,
      { withCredentials: true }
    );
  }

  eliminarFotoPerfil(): Observable<{
    mensaje: string;
    url: string;
  }> {
    return this.http.delete<{
      mensaje: string;
      url: string;
    }>(
      `${this.apiUrl}/perfil/foto`,
      { withCredentials: true }
    );
  }

  cambiarPassword(
    payload: CambiarPassword
  ): Observable<ApiMensaje> {
    return this.http.post<ApiMensaje>(
      `${this.apiUrl}/perfil/password`,
      payload,
      { withCredentials: true }
    );
  }

  cerrarSesion(): Observable<ApiMensaje> {
    return this.http.post<ApiMensaje>(
      `${this.authUrl}/logout`,
      null,
      { withCredentials: true }
    );
  }

  obtenerDocumentacionSolicitud(
    idSolicitud: number
  ): Observable<DocumentacionInicial> {
    return this.http.get<DocumentacionInicial>(
      `${this.apiUrl}/solicitudes/${idSolicitud}/documentacion-inicial`,
      { withCredentials: true }
    );
  }

  obtenerDocumentacionProyecto(
    idProyecto: number
  ): Observable<DocumentacionInicial> {
    return this.http.get<DocumentacionInicial>(
      `${this.apiUrl}/proyectos/${idProyecto}/documentacion-inicial`,
      { withCredentials: true }
    );
  }

  solicitarCorreccionDocumento(
    idDocumento: number,
    motivo: string
  ): Observable<ApiMensaje> {
    return this.http.post<ApiMensaje>(
      `${this.apiUrl}/documentos-iniciales/${idDocumento}/solicitar-correccion`,
      { motivo },
      { withCredentials: true }
    );
  }

  aprobarDocumento(
    idDocumento: number
  ): Observable<ApiMensaje> {
    return this.http.post<ApiMensaje>(
      `${this.apiUrl}/documentos-iniciales/${idDocumento}/aprobar`,
      null,
      { withCredentials: true }
    );
  }

  resolverRecurso(url?: string | null): string {
    if (!url) {
      return '';
    }

    if (
      url.startsWith('http://') ||
      url.startsWith('https://') ||
      url.startsWith('data:') ||
      url.startsWith('blob:')
    ) {
      return url;
    }

    if (url.startsWith('/assets/')) {
      return url;
    }

    return `${this.backendUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  }
}