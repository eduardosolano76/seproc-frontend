// src/app/core/models/supervisor-institucion.model.ts

export type SupervisorInstitucionView =
    | 'proyectos'
    | 'password';

export type EstadoProyecto =
    | 'ACTIVO'
    | 'INACTIVO'
    | 'FINALIZADO';

export interface PerfilSupervisorInstitucion {
    idUsuario: number;
    username: string;
    nombreUsuario: string;
    rolUsuario: string;
    email: string;
    fotoUrl: string;
    logoEmpresa: string;
    abreviacion: string;
}

export interface ProyectoSupervisorResumen {
    idProyecto: number;
    idSolicitud: number;
    nombreEscuela: string;
    constructor: string;
    fechaAprobacion: string;
    estadoProyecto: EstadoProyecto;
}

export interface ProyectoSupervisorDetalle {
    idProyecto: number;
    idSolicitud: number;
    estadoProyecto: EstadoProyecto;
    fechaAprobacion?: string | null;
    quienEnvia: string;
    supervisorAsignado: string;
    nombreEscuela: string;
    estado: string;
    municipio: string;
    ciudad: string;
    tipoObra: string;
    tipoEdificacion: string;
    modoVista: 'SUPERVISOR' | string;
    soloLectura: boolean;
    puedeSubir: boolean;
    puedeComentar: boolean;
    puedeAprobar: boolean;
    estadosEtapa: Record<string, string>;
}

export interface ArchivoEvidenciaSupervisor {
    nombre: string;
    nota?: string | null;
    url: string;
    path?: string | null;
}

export interface ObservacionEtapaSupervisor {
    usuarioNombre: string;
    fecha: string;
    mensaje: string;
}

export interface EntregaEtapaSupervisor {
    usuarioNombre: string;
    fechaSubida: string;
    version: number;
    estadoEntrega: string;
    archivos: ArchivoEvidenciaSupervisor[];
}

export interface DetalleEtapaSupervisor {
    ultimaObservacion?: ObservacionEtapaSupervisor | null;
    entregaActual?: EntregaEtapaSupervisor | null;
}

export interface HistorialEtapaSupervisor {
    tipo: string;
    usuarioNombre: string;
    usuarioRol?: string;
    fecha: string;
    mensaje?: string;
    descripcion?: string;
    nombreArchivo?: string;
    urlArchivo?: string;
    archivos?: ArchivoEvidenciaSupervisor[];
}

export interface DocumentoInicialSupervisor {
    idDocumento?: number;
    tipoDocumento?: string;
    nombreDocumento: string;
    subido: boolean;
    fechaLimite?: string;
    archivoUrl?: string;
    nombreArchivoOriginal?: string;
    estadoDocumento?: string;
}

export interface DocumentacionInicialSupervisor {
    idSolicitud?: number;
    completo: boolean;
    mensaje: string;
    documentos: DocumentoInicialSupervisor[];
}

export interface CambiarPasswordSupervisor {
    passActual: string;
    passNueva: string;
    passRepetida: string;
}

export interface ApiMensajeSupervisor {
    mensaje: string;
}

export interface ApiArchivoSupervisor {
    mensaje?: string;
    url: string;
}