// src/app/core/services/supervisor-institucion.service.ts

import {
    HttpClient,
    HttpParams,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
    ApiArchivoSupervisor,
    ApiMensajeSupervisor,
    CambiarPasswordSupervisor,
    DetalleEtapaSupervisor,
    DocumentacionInicialSupervisor,
    EstadoProyecto,
    HistorialEtapaSupervisor,
    PerfilSupervisorInstitucion,
    ProyectoSupervisorDetalle,
    ProyectoSupervisorResumen,
} from '../models/supervisor-institucion.model';

@Injectable({
    providedIn: 'root',
})
export class SupervisorInstitucionService {

    private readonly apiBase =
        environment.apiUrl.replace(/\/$/, '');

    private readonly supervisorUrl =
        `${this.apiBase}/supervisor`;

    private readonly authUrl =
        `${this.apiBase}/auth`;

    private readonly backendUrl =
        environment.apiUrl.replace(/\/api\/?$/, '');

    constructor(
        private readonly http: HttpClient
    ) { }

    obtenerPerfil():
        Observable<PerfilSupervisorInstitucion> {

        return this.http.get<PerfilSupervisorInstitucion>(
            `${this.supervisorUrl}/perfil`,
            { withCredentials: true }
        );
    }

    obtenerProyectos(
        estado: EstadoProyecto
    ): Observable<ProyectoSupervisorResumen[]> {

        const params = new HttpParams()
            .set('estado', estado);

        return this.http.get<ProyectoSupervisorResumen[]>(
            `${this.supervisorUrl}/proyectos`,
            {
                params,
                withCredentials: true,
            }
        );
    }

    obtenerDetalleProyecto(
        idProyecto: number
    ): Observable<ProyectoSupervisorDetalle> {

        return this.http.get<ProyectoSupervisorDetalle>(
            `${this.supervisorUrl}/proyectos/${idProyecto}`,
            { withCredentials: true }
        );
    }

    obtenerDetalleEtapa(
        idProyecto: number,
        etapa: string
    ): Observable<DetalleEtapaSupervisor> {

        return this.http.get<DetalleEtapaSupervisor>(
            `${this.supervisorUrl}/proyectos/${idProyecto}/etapas/${encodeURIComponent(etapa)}`,
            { withCredentials: true }
        );
    }

    obtenerHistorialEtapa(
        idProyecto: number,
        etapa: string
    ): Observable<HistorialEtapaSupervisor[]> {

        return this.http.get<HistorialEtapaSupervisor[]>(
            `${this.supervisorUrl}/proyectos/${idProyecto}/etapas/${encodeURIComponent(etapa)}/historial`,
            { withCredentials: true }
        );
    }

    observarEtapa(
        idProyecto: number,
        etapa: string,
        comentario: string
    ): Observable<string> {

        const params = new HttpParams()
            .set('comentario', comentario.trim());

        return this.http.post(
            `${this.supervisorUrl}/proyectos/${idProyecto}/etapas/${encodeURIComponent(etapa)}/observar`,
            null,
            {
                params,
                withCredentials: true,
                responseType: 'text',
            }
        );
    }

    aprobarEtapa(
        idProyecto: number,
        etapa: string
    ): Observable<string> {

        return this.http.post(
            `${this.supervisorUrl}/proyectos/${idProyecto}/etapas/${encodeURIComponent(etapa)}/aprobar`,
            null,
            {
                withCredentials: true,
                responseType: 'text',
            }
        );
    }

    obtenerDocumentacionProyecto(
        idProyecto: number
    ): Observable<DocumentacionInicialSupervisor> {

        return this.http.get<DocumentacionInicialSupervisor>(
            `${this.supervisorUrl}/proyectos/${idProyecto}/documentacion-inicial`,
            { withCredentials: true }
        );
    }

    subirFotoPerfil(
        file: File
    ): Observable<ApiArchivoSupervisor> {

        const formData = new FormData();
        formData.append('file', file);

        return this.http.post<ApiArchivoSupervisor>(
            `${this.supervisorUrl}/perfil/foto`,
            formData,
            { withCredentials: true }
        );
    }

    eliminarFotoPerfil(): Observable<{
        mensaje?: string;
        message?: string;
        url: string;
    }> {
        return this.http.delete<{
            mensaje?: string;
            message?: string;
            url: string;
        }>(
            `${this.supervisorUrl}/perfil/foto`,
            { withCredentials: true }
        );
    }

    cambiarPassword(
        payload: CambiarPasswordSupervisor
    ): Observable<ApiMensajeSupervisor> {

        return this.http.post<ApiMensajeSupervisor>(
            `${this.supervisorUrl}/perfil/password`,
            payload,
            { withCredentials: true }
        );
    }

    cerrarSesion(): Observable<ApiMensajeSupervisor> {
        return this.http.post<ApiMensajeSupervisor>(
            `${this.authUrl}/logout`,
            null,
            { withCredentials: true }
        );
    }

    resolverRecurso(
        url?: string | null
    ): string {

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