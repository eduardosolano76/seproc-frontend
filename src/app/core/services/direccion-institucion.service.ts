// src/app/core/services/direccion-institucion.service.ts

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
    ApiArchivoDireccion,
    ApiMensajeDireccion,
    CambiarPasswordDireccion,
    DetalleEtapaDireccion,
    DocumentacionInicialDireccion,
    EstadoProyectoDireccion,
    HistorialEtapaDireccion,
    PerfilDireccionInstitucion,
    ProyectoDireccionDetalle,
    ProyectoDireccionResumen,
} from '../models/direccion-institucion.model';

@Injectable({
    providedIn: 'root',
})
export class DireccionInstitucionService {
    private readonly apiBase =
        environment.apiUrl.replace(/\/$/, '');

    private readonly direccionUrl =
        `${this.apiBase}/direccion`;

    private readonly authUrl =
        `${this.apiBase}/auth`;

    private readonly backendUrl =
        environment.apiUrl.replace(/\/api\/?$/, '');

    constructor(private readonly http: HttpClient) { }

    obtenerPerfil(): Observable<PerfilDireccionInstitucion> {
        return this.http.get<PerfilDireccionInstitucion>(
            `${this.direccionUrl}/perfil`,
            { withCredentials: true },
        );
    }

    obtenerProyectos(
        estado: EstadoProyectoDireccion,
    ): Observable<ProyectoDireccionResumen[]> {
        const params = new HttpParams().set('estado', estado);

        return this.http.get<ProyectoDireccionResumen[]>(
            `${this.direccionUrl}/proyectos`,
            {
                params,
                withCredentials: true,
            },
        );
    }

    obtenerDetalleProyecto(
        idProyecto: number,
    ): Observable<ProyectoDireccionDetalle> {
        return this.http.get<ProyectoDireccionDetalle>(
            `${this.direccionUrl}/proyectos/${idProyecto}`,
            { withCredentials: true },
        );
    }

    obtenerDetalleEtapa(
        idProyecto: number,
        etapa: string,
    ): Observable<DetalleEtapaDireccion> {
        return this.http.get<DetalleEtapaDireccion>(
            `${this.direccionUrl}/proyectos/${idProyecto}/etapas/${encodeURIComponent(etapa)}`,
            { withCredentials: true },
        );
    }

    obtenerHistorialEtapa(
        idProyecto: number,
        etapa: string,
    ): Observable<HistorialEtapaDireccion[]> {
        return this.http.get<HistorialEtapaDireccion[]>(
            `${this.direccionUrl}/proyectos/${idProyecto}/etapas/${encodeURIComponent(etapa)}/historial`,
            { withCredentials: true },
        );
    }

    obtenerDocumentacionProyecto(
        idProyecto: number,
    ): Observable<DocumentacionInicialDireccion> {
        return this.http.get<DocumentacionInicialDireccion>(
            `${this.direccionUrl}/proyectos/${idProyecto}/documentacion-inicial`,
            { withCredentials: true },
        );
    }

    subirFotoPerfil(
        file: File,
    ): Observable<ApiArchivoDireccion> {
        const formData = new FormData();
        formData.append('file', file);

        return this.http.post<ApiArchivoDireccion>(
            `${this.direccionUrl}/perfil/foto`,
            formData,
            { withCredentials: true },
        );
    }

    eliminarFotoPerfil(): Observable<ApiArchivoDireccion> {
        return this.http.delete<ApiArchivoDireccion>(
            `${this.direccionUrl}/perfil/foto`,
            { withCredentials: true },
        );
    }

    cambiarPassword(
        payload: CambiarPasswordDireccion,
    ): Observable<ApiMensajeDireccion> {
        return this.http.post<ApiMensajeDireccion>(
            `${this.direccionUrl}/perfil/password`,
            payload,
            { withCredentials: true },
        );
    }

    cerrarSesion(): Observable<ApiMensajeDireccion> {
        return this.http.post<ApiMensajeDireccion>(
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