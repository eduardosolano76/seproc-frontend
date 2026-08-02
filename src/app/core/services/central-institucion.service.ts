// src/app/core/services/central-institucion.service.ts

import {
    HttpClient,
    HttpParams,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
    ApiArchivoCentral,
    ApiMensajeCentral,
    CambiarPasswordCentral,
    CentralInstitucionView,
    DetalleEtapaCentral,
    DocumentacionInicialCentral,
    EstadoProyectoCentral,
    EstadoSolicitudCentral,
    HistorialEtapaCentral,
    PerfilCentralInstitucion,
    ProyectoCentralDetalle,
    ProyectoCentralResumen,
    SolicitudCentralDetalle,
    SolicitudCentralResumen,
    SupervisorCentral,
    UsuarioCentral,
    UsuarioCentralUpsert,
} from '../models/central-institucion.model';

@Injectable({
    providedIn: 'root',
})
export class CentralInstitucionService {
    private readonly apiBase =
        environment.apiUrl.replace(/\/$/, '');

    private readonly centralUrl =
        `${this.apiBase}/central`;

    private readonly authUrl =
        `${this.apiBase}/auth`;

    private readonly backendUrl =
        environment.apiUrl.replace(/\/api\/?$/, '');

    constructor(private readonly http: HttpClient) { }

    obtenerPerfil(): Observable<PerfilCentralInstitucion> {
        return this.http.get<PerfilCentralInstitucion>(
            `${this.centralUrl}/perfil`,
            { withCredentials: true },
        );
    }

    obtenerSolicitudes(
        estado: EstadoSolicitudCentral,
    ): Observable<SolicitudCentralResumen[]> {
        const params = new HttpParams().set('estado', estado);

        return this.http.get<SolicitudCentralResumen[]>(
            `${this.centralUrl}/solicitudes`,
            { params, withCredentials: true },
        );
    }

    obtenerDetalleSolicitud(
        idSolicitud: number,
    ): Observable<SolicitudCentralDetalle> {
        return this.http.get<SolicitudCentralDetalle>(
            `${this.centralUrl}/solicitudes/${idSolicitud}`,
            { withCredentials: true },
        );
    }

    obtenerSupervisores(): Observable<SupervisorCentral[]> {
        return this.http.get<SupervisorCentral[]>(
            `${this.centralUrl}/solicitudes/supervisores`,
            { withCredentials: true },
        );
    }

    aprobarSolicitud(
        idSolicitud: number,
        supervisorId: number,
    ): Observable<string> {
        const params = new HttpParams().set(
            'supervisorId',
            supervisorId.toString(),
        );

        return this.http.post(
            `${this.centralUrl}/solicitudes/${idSolicitud}/aprobar`,
            null,
            {
                params,
                withCredentials: true,
                responseType: 'text',
            },
        );
    }

    rechazarSolicitud(
        idSolicitud: number,
        motivo: string,
    ): Observable<string> {
        const params = new HttpParams().set('motivo', motivo);

        return this.http.post(
            `${this.centralUrl}/solicitudes/${idSolicitud}/rechazar`,
            null,
            {
                params,
                withCredentials: true,
                responseType: 'text',
            },
        );
    }

    obtenerProyectos(
        estado: EstadoProyectoCentral,
    ): Observable<ProyectoCentralResumen[]> {
        const params = new HttpParams().set('estado', estado);

        return this.http.get<ProyectoCentralResumen[]>(
            `${this.centralUrl}/proyectos`,
            { params, withCredentials: true },
        );
    }

    obtenerDetalleProyecto(
        idProyecto: number,
    ): Observable<ProyectoCentralDetalle> {
        return this.http.get<ProyectoCentralDetalle>(
            `${this.centralUrl}/proyectos/${idProyecto}`,
            { withCredentials: true },
        );
    }

    obtenerDetalleEtapa(
        idProyecto: number,
        etapa: string,
    ): Observable<DetalleEtapaCentral> {
        return this.http.get<DetalleEtapaCentral>(
            `${this.centralUrl}/proyectos/${idProyecto}/etapas/${encodeURIComponent(etapa)}`,
            { withCredentials: true },
        );
    }

    obtenerHistorialEtapa(
        idProyecto: number,
        etapa: string,
    ): Observable<HistorialEtapaCentral[]> {
        return this.http.get<HistorialEtapaCentral[]>(
            `${this.centralUrl}/proyectos/${idProyecto}/etapas/${encodeURIComponent(etapa)}/historial`,
            { withCredentials: true },
        );
    }

    cambiarEstadoProyecto(
        idProyecto: number,
        estado: EstadoProyectoCentral,
    ): Observable<ApiMensajeCentral> {
        const params = new HttpParams().set('estado', estado);

        return this.http.post<ApiMensajeCentral>(
            `${this.centralUrl}/proyectos/${idProyecto}/estado`,
            null,
            { params, withCredentials: true },
        );
    }

    obtenerUsuarios(
        view: CentralInstitucionView,
    ): Observable<UsuarioCentral[]> {
        const params = new HttpParams().set('view', view);

        return this.http.get<UsuarioCentral[]>(
            `${this.centralUrl}/usuarios`,
            { params, withCredentials: true },
        );
    }

    obtenerUsuario(id: number): Observable<UsuarioCentral> {
        return this.http.get<UsuarioCentral>(
            `${this.centralUrl}/usuarios/${id}`,
            { withCredentials: true },
        );
    }

    crearUsuario(
        payload: UsuarioCentralUpsert,
    ): Observable<ApiMensajeCentral> {
        return this.http.post<ApiMensajeCentral>(
            `${this.centralUrl}/usuarios/crear`,
            payload,
            { withCredentials: true },
        );
    }

    actualizarUsuario(
        id: number,
        payload: UsuarioCentralUpsert,
    ): Observable<ApiMensajeCentral> {
        return this.http.post<ApiMensajeCentral>(
            `${this.centralUrl}/usuarios/${id}/actualizar`,
            payload,
            { withCredentials: true },
        );
    }

    eliminarUsuario(id: number): Observable<ApiMensajeCentral> {
        return this.http.post<ApiMensajeCentral>(
            `${this.centralUrl}/usuarios/${id}/eliminar`,
            null,
            { withCredentials: true },
        );
    }

    obtenerDocumentacionSolicitud(
        idSolicitud: number,
    ): Observable<DocumentacionInicialCentral> {
        return this.http.get<DocumentacionInicialCentral>(
            `${this.centralUrl}/solicitudes/${idSolicitud}/documentacion-inicial`,
            { withCredentials: true },
        );
    }

    obtenerDocumentacionProyecto(
        idProyecto: number,
    ): Observable<DocumentacionInicialCentral> {
        return this.http.get<DocumentacionInicialCentral>(
            `${this.centralUrl}/proyectos/${idProyecto}/documentacion-inicial`,
            { withCredentials: true },
        );
    }

    solicitarCorreccionDocumento(
        idDocumento: number,
        motivo: string,
    ): Observable<ApiMensajeCentral> {
        return this.http.post<ApiMensajeCentral>(
            `${this.centralUrl}/documentos-iniciales/${idDocumento}/solicitar-correccion`,
            { motivo },
            { withCredentials: true },
        );
    }

    aprobarDocumento(
        idDocumento: number,
    ): Observable<ApiMensajeCentral> {
        return this.http.post<ApiMensajeCentral>(
            `${this.centralUrl}/documentos-iniciales/${idDocumento}/aprobar`,
            null,
            { withCredentials: true },
        );
    }

    subirFotoPerfil(file: File): Observable<ApiArchivoCentral> {
        const formData = new FormData();
        formData.append('file', file);

        return this.http.post<ApiArchivoCentral>(
            `${this.centralUrl}/perfil/foto`,
            formData,
            { withCredentials: true },
        );
    }

    eliminarFotoPerfil(): Observable<ApiArchivoCentral> {
        return this.http.delete<ApiArchivoCentral>(
            `${this.centralUrl}/perfil/foto`,
            { withCredentials: true },
        );
    }

    cambiarPassword(
        payload: CambiarPasswordCentral,
    ): Observable<ApiMensajeCentral> {
        return this.http.post<ApiMensajeCentral>(
            `${this.centralUrl}/perfil/password`,
            payload,
            { withCredentials: true },
        );
    }

    cerrarSesion(): Observable<ApiMensajeCentral> {
        return this.http.post<ApiMensajeCentral>(
            `${this.authUrl}/logout`,
            null,
            { withCredentials: true },
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