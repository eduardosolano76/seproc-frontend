// src/app/core/services/constructor-institucion.service.ts

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
    ApiArchivo,
    ApiMensaje,
    CambiarPasswordConstructor,
    CatalogoItem,
    DetalleEtapaConstructor,
    DocumentacionInicialConstructor,
    EstadoProyecto,
    HistorialEtapaConstructor,
    PerfilConstructorInstitucion,
    ProyectoConstructorDetalle,
    ProyectoConstructorResumen,
    SolicitudProyectoConstructor,
    SolicitudProyectoCreada,
    TipoDocumentoInicial,
} from '../models/constructor-institucion.model';

@Injectable({
    providedIn: 'root',
})
export class ConstructorInstitucionService {
    private readonly apiBase =
        environment.apiUrl.replace(/\/$/, '');

    private readonly constructorUrl =
        `${this.apiBase}/constructor`;

    private readonly authUrl =
        `${this.apiBase}/auth`;

    private readonly backendUrl =
        environment.apiUrl.replace(/\/api\/?$/, '');

    constructor(private readonly http: HttpClient) { }

    obtenerPerfil(): Observable<PerfilConstructorInstitucion> {
        return this.http.get<PerfilConstructorInstitucion>(
            `${this.constructorUrl}/perfil`,
            { withCredentials: true },
        );
    }

    obtenerProyectos(
        estado: EstadoProyecto,
    ): Observable<ProyectoConstructorResumen[]> {
        const params = new HttpParams().set('estado', estado);

        return this.http.get<ProyectoConstructorResumen[]>(
            `${this.constructorUrl}/proyectos`,
            {
                params,
                withCredentials: true,
            },
        );
    }

    obtenerDetalleProyecto(
        idProyecto: number,
    ): Observable<ProyectoConstructorDetalle> {
        return this.http.get<ProyectoConstructorDetalle>(
            `${this.constructorUrl}/proyectos/${idProyecto}`,
            { withCredentials: true },
        );
    }

    obtenerDetalleEtapa(
        idProyecto: number,
        etapa: string,
    ): Observable<DetalleEtapaConstructor> {
        return this.http.get<DetalleEtapaConstructor>(
            `${this.constructorUrl}/proyectos/${idProyecto}/etapas/${encodeURIComponent(etapa)}`,
            { withCredentials: true },
        );
    }

    obtenerHistorialEtapa(
        idProyecto: number,
        etapa: string,
    ): Observable<HistorialEtapaConstructor[]> {
        return this.http.get<HistorialEtapaConstructor[]>(
            `${this.constructorUrl}/proyectos/${idProyecto}/etapas/${encodeURIComponent(etapa)}/historial`,
            { withCredentials: true },
        );
    }

    subirEvidencia(
        idProyecto: number,
        etapa: string,
        file: File,
        nota = '',
    ): Observable<ApiArchivo> {
        const formData = new FormData();
        formData.append('file', file);

        if (nota.trim()) {
            formData.append('nota', nota.trim());
        }

        return this.http.post<ApiArchivo>(
            `${this.constructorUrl}/proyectos/${idProyecto}/etapas/${encodeURIComponent(etapa)}/reporte`,
            formData,
            { withCredentials: true },
        );
    }

    actualizarNotaEvidencia(
        idProyecto: number,
        etapa: string,
        storagePath: string,
        nota: string,
    ): Observable<ApiMensaje> {
        const params = new HttpParams()
            .set('storagePath', storagePath)
            .set('nota', nota);

        return this.http.post<ApiMensaje>(
            `${this.constructorUrl}/proyectos/${idProyecto}/etapas/${encodeURIComponent(etapa)}/archivo/nota`,
            null,
            {
                params,
                withCredentials: true,
            },
        );
    }

    eliminarEvidencia(
        idProyecto: number,
        etapa: string,
        storagePath: string,
    ): Observable<ApiMensaje> {
        const params = new HttpParams().set(
            'storagePath',
            storagePath,
        );

        return this.http.delete<ApiMensaje>(
            `${this.constructorUrl}/proyectos/${idProyecto}/etapas/${encodeURIComponent(etapa)}/archivo`,
            {
                params,
                withCredentials: true,
            },
        );
    }

    entregarEtapa(
        idProyecto: number,
        etapa: string,
    ): Observable<ApiMensaje> {
        return this.http.post<ApiMensaje>(
            `${this.constructorUrl}/proyectos/${idProyecto}/etapas/${encodeURIComponent(etapa)}/entregar`,
            null,
            { withCredentials: true },
        );
    }

    descargarPdfEtapa(
        idProyecto: number,
        etapa: string,
    ): Observable<Blob> {
        return this.http.get(
            `${this.constructorUrl}/proyectos/${idProyecto}/etapas/${encodeURIComponent(etapa)}/pdf`,
            {
                withCredentials: true,
                responseType: 'blob',
            },
        );
    }

    crearSolicitud(
        payload: SolicitudProyectoConstructor,
    ): Observable<SolicitudProyectoCreada> {
        return this.http.post<SolicitudProyectoCreada>(
            `${this.constructorUrl}/solicitudes`,
            payload,
            { withCredentials: true },
        );
    }

    obtenerEstados(): Observable<CatalogoItem[]> {
        return this.http.get<CatalogoItem[]>(
            `${this.apiBase}/geo/estados`,
            { withCredentials: true },
        );
    }

    obtenerMunicipios(
        estadoId: number,
    ): Observable<CatalogoItem[]> {
        const params = new HttpParams().set(
            'estadoId',
            estadoId.toString(),
        );

        return this.http.get<CatalogoItem[]>(
            `${this.apiBase}/geo/municipios`,
            {
                params,
                withCredentials: true,
            },
        );
    }

    obtenerLocalidades(
        municipioId: number,
    ): Observable<CatalogoItem[]> {
        const params = new HttpParams().set(
            'municipioId',
            municipioId.toString(),
        );

        return this.http.get<CatalogoItem[]>(
            `${this.apiBase}/geo/localidades`,
            {
                params,
                withCredentials: true,
            },
        );
    }

    obtenerTiposEdificacion(): Observable<CatalogoItem[]> {
        return this.http.get<CatalogoItem[]>(
            `${this.apiBase}/catalogos/tipos-edificacion`,
            { withCredentials: true },
        );
    }

    subirDocumentoInicial(
        idSolicitud: number,
        tipoDocumento: TipoDocumentoInicial | string,
        file: File,
    ): Observable<ApiMensaje> {
        const formData = new FormData();
        formData.append('file', file);

        return this.http.post<ApiMensaje>(
            `${this.constructorUrl}/solicitudes/${idSolicitud}/documentos/${encodeURIComponent(tipoDocumento)}`,
            formData,
            { withCredentials: true },
        );
    }

    obtenerDocumentacionProyecto(
        idProyecto: number,
    ): Observable<DocumentacionInicialConstructor> {
        return this.http.get<DocumentacionInicialConstructor>(
            `${this.constructorUrl}/proyectos/${idProyecto}/documentacion-inicial`,
            { withCredentials: true },
        );
    }

    subirFotoPerfil(file: File): Observable<ApiArchivo> {
        const formData = new FormData();
        formData.append('file', file);

        return this.http.post<ApiArchivo>(
            `${this.constructorUrl}/perfil/foto`,
            formData,
            { withCredentials: true },
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
            `${this.constructorUrl}/perfil/foto`,
            { withCredentials: true },
        );
    }

    cambiarPassword(
        payload: CambiarPasswordConstructor,
    ): Observable<ApiMensaje> {
        return this.http.post<ApiMensaje>(
            `${this.constructorUrl}/perfil/password`,
            payload,
            { withCredentials: true },
        );
    }

    cerrarSesion(): Observable<ApiMensaje> {
        return this.http.post<ApiMensaje>(
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