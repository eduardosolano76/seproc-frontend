// src/app/core/models/direccion-institucion.model.ts

export type DireccionInstitucionView = 'proyectos' | 'password';

export type EstadoProyectoDireccion =
    | 'ACTIVO'
    | 'INACTIVO'
    | 'FINALIZADO';

export interface PerfilDireccionInstitucion {
    idUsuario: number;
    username: string;
    nombreUsuario: string;
    rolUsuario: string;
    fotoUrl: string;
    logoEmpresa: string;
    abreviacion: string;
}

export interface ProyectoDireccionResumen {
    idProyecto: number;
    idSolicitud: number;
    nombreEscuela: string;
    constructor: string;
    supervisor: string;
    fechaAprobacion: string;
    estadoProyecto: EstadoProyectoDireccion;
}

export interface ProyectoDireccionDetalle {
    idProyecto: number;
    idSolicitud: number;
    nombreEscuela: string;
    tipoObra: string;
    tipoEdificacion: string;
    estadoProyecto: EstadoProyectoDireccion;
    fechaAprobacion?: string | null;
    quienEnvia: string;
    supervisorAsignado: string;
    soloLectura: boolean;
    estadosEtapa: Record<string, string>;
}

export interface ArchivoEvidenciaDireccion {
    nombre: string;
    nota?: string | null;
    url: string;
}

export interface ObservacionEtapaDireccion {
    usuarioNombre: string;
    fecha: string;
    mensaje: string;
}

export interface EntregaEtapaDireccion {
    usuarioNombre: string;
    fechaSubida: string;
    version: number;
    estadoEntrega: string;
    archivos: ArchivoEvidenciaDireccion[];
}

export interface DetalleEtapaDireccion {
    ultimaObservacion?: ObservacionEtapaDireccion | null;
    entregaActual?: EntregaEtapaDireccion | null;
}

export interface HistorialEtapaDireccion {
    tipo: string;
    usuarioNombre: string;
    usuarioRol?: string;
    fecha: string;
    mensaje?: string;
    descripcion?: string;
    nombreArchivo?: string;
    urlArchivo?: string;
}

export interface DocumentoInicialDireccion {
    idDocumento?: number;
    nombreDocumento: string;
    subido: boolean;
    fechaLimite?: string;
    archivoUrl?: string;
    nombreArchivoOriginal?: string;
    estadoDocumento?: string;
}

export interface DocumentacionInicialDireccion {
    completo: boolean;
    mensaje: string;
    documentos: DocumentoInicialDireccion[];
}

export interface CambiarPasswordDireccion {
    actual: string;
    nueva: string;
    repetida: string;
}

export interface ApiMensajeDireccion {
    mensaje: string;
}

export interface ApiArchivoDireccion {
    mensaje?: string;
    url: string;
}