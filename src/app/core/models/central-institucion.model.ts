// src/app/core/models/central-institucion.model.ts

export type CentralInstitucionView =
    | 'solicitudes'
    | 'proyectos'
    | 'usuarios-supervisores'
    | 'usuarios-constructores'
    | 'usuarios-directores'
    | 'password';

export type EstadoSolicitudCentral =
    | 'PENDIENTE'
    | 'APROBADA'
    | 'RECHAZADA';

export type EstadoProyectoCentral =
    | 'ACTIVO'
    | 'INACTIVO'
    | 'FINALIZADO';

export interface PerfilCentralInstitucion {
    idUsuario: number;
    username: string;
    nombreUsuario: string;
    rolUsuario: string;
    email?: string;
    fotoUrl: string;
    logoEmpresa: string;
    abreviacion: string;
}

export interface SolicitudCentralResumen {
    idSolicitud: number;
    nombreEscuela: string;
    constructor: string;
    fechaSolicitud: string;
    estadoSolicitud: EstadoSolicitudCentral;
}

export interface DetalleInmuebleCentral {
    nombreEscuela: string;
    cct1: string;
    cct2?: string | null;
    estado: string;
    municipio: string;
    ciudad: string;
    calleNumero: string;
    cp: string;
    responsableInmueble: string;
    contacto: string;
    numInmueblesEvaluar: number;
    numEntreEjes: number;
    tipoObra: string;
    tipoEdificacion: string;
}

export interface SolicitudCentralDetalle
    extends DetalleInmuebleCentral {
    idSolicitud: number;
    estadoSolicitud: EstadoSolicitudCentral;
    motivoRechazo?: string | null;
    fechaSolicitud?: string | null;
    quienEnvia: string;
    supervisorAsignado?: string | null;
}

export interface SupervisorCentral {
    id: number;
    nombre: string;
}

export interface ProyectoCentralResumen {
    idProyecto: number;
    idSolicitud: number;
    nombreEscuela: string;
    constructor: string;
    supervisor: string;
    fechaAprobacion: string;
    estadoProyecto: EstadoProyectoCentral;
}

export interface ProyectoCentralDetalle
    extends DetalleInmuebleCentral {
    idProyecto: number;
    idSolicitud: number;
    estadoProyecto: EstadoProyectoCentral;
    fechaAprobacion?: string | null;
    quienEnvia: string;
    supervisorAsignado: string;
    modoVista: 'CENTRAL' | string;
    soloLectura: boolean;
    puedeSubir: boolean;
    puedeComentar: boolean;
    puedeAprobar: boolean;
    estadosEtapa: Record<string, string>;
}

export interface ArchivoEvidenciaCentral {
    nombre: string;
    nota?: string | null;
    url: string;
    path?: string | null;
}

export interface ObservacionEtapaCentral {
    usuarioNombre: string;
    fecha: string;
    mensaje: string;
}

export interface EntregaEtapaCentral {
    usuarioNombre: string;
    fechaSubida: string;
    version: number;
    estadoEntrega: string;
    archivos: ArchivoEvidenciaCentral[];
}

export interface DetalleEtapaCentral {
    ultimaObservacion?: ObservacionEtapaCentral | null;
    entregaActual?: EntregaEtapaCentral | null;
}

export interface HistorialEtapaCentral {
    tipo: string;
    usuarioNombre: string;
    usuarioRol?: string;
    fecha: string;
    mensaje?: string;
    descripcion?: string;
    nombreArchivo?: string;
    urlArchivo?: string;
    archivos?: ArchivoEvidenciaCentral[];
}

export interface UsuarioCentral {
    idUsuario: number;
    nombre: string;
    apellido: string;
    username: string;
    email: string;
    rolNombre: string;
    rol?: { nombre?: string } | null;
}

export interface UsuarioCentralUpsert {
    nombre: string;
    apellido: string;
    username: string;
    email: string;
    password: string;
    rolNombre: string;
}

export interface CambiarPasswordCentral {
    passActual: string;
    passNueva: string;
    passRepetida: string;
}

export interface DocumentoInicialCentral {
    idDocumento?: number;
    tipoDocumento?: string;
    nombreDocumento: string;
    subido: boolean;
    fechaLimite?: string;
    archivoUrl?: string;
    nombreArchivoOriginal?: string;
    estadoDocumento?: string;
}

export interface DocumentacionInicialCentral {
    idSolicitud?: number;
    completo: boolean;
    mensaje: string;
    documentos: DocumentoInicialCentral[];
}

export interface ApiMensajeCentral {
    mensaje?: string;
    message?: string;
}

export interface ApiArchivoCentral
    extends ApiMensajeCentral {
    url: string;
}