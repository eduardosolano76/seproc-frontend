// src/app/core/models/constructor-institucion.model.ts

export type ConstructorInstitucionView =
    | 'proyectos'
    | 'password';

export type EstadoProyecto =
    | 'ACTIVO'
    | 'INACTIVO'
    | 'FINALIZADO';

export type TipoDocumentoInicial =
    | 'LICENCIA_CONSTRUCCION'
    | 'MECANICA_SUELOS'
    | 'ESTUDIO_AMBIENTAL';

export interface PerfilConstructorInstitucion {
    idUsuario: number;
    username: string;
    nombreUsuario: string;
    rolUsuario: string;
    email: string;
    fotoUrl: string;
    logoEmpresa: string;
    abreviacion: string;
}

export interface ProyectoConstructorResumen {
    idProyecto: number;
    idSolicitud: number;
    nombreEscuela: string;
    supervisor: string;
    fechaAprobacion: string;
    estadoProyecto: EstadoProyecto;
}

export interface ProyectoConstructorDetalle {
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
    modoVista: 'CONSTRUCTOR' | string;
    soloLectura: boolean;
    puedeSubir: boolean;
    puedeComentar: boolean;
    puedeAprobar: boolean;
    estadosEtapa: Record<string, string>;
}

export interface ArchivoEvidenciaConstructor {
    nombre: string;
    nota?: string | null;
    url: string;
    path?: string | null;
}

export interface ObservacionEtapaConstructor {
    usuarioNombre: string;
    fecha: string;
    mensaje: string;
}

export interface EntregaEtapaConstructor {
    usuarioNombre: string;
    fechaSubida: string;
    version: number;
    estadoEntrega: string;
    archivos: ArchivoEvidenciaConstructor[];
}

export interface DetalleEtapaConstructor {
    ultimaObservacion?: ObservacionEtapaConstructor | null;
    entregaActual?: EntregaEtapaConstructor | null;
}

export interface HistorialEtapaConstructor {
    tipo: string;
    usuarioNombre: string;
    usuarioRol?: string;
    fecha: string;
    mensaje?: string;
    descripcion?: string;
    nombreArchivo?: string;
    urlArchivo?: string;
    archivos?: ArchivoEvidenciaConstructor[];
}

export interface CatalogoItem {
    id: number;
    nombre: string;
}

export interface SolicitudProyectoConstructor {
    nombreEscuela: string;
    cct1: string;
    cct2: string | null;
    idEstado: number;
    idMunicipio: number;
    idLocalidad: number;
    calleNumero: string;
    cp: string;
    responsable: string;
    contacto: string;
    numInmuebles: number;
    numEntreEjes: number;
    idTipoEdificacion: number;
    tipoObra: string;
}

export interface SolicitudProyectoCreada {
    idSolicitud: number;
    mensaje: string;
}

export interface DocumentoInicialConstructor {
    idDocumento?: number;
    tipoDocumento?: TipoDocumentoInicial | string;
    nombreDocumento: string;
    subido: boolean;
    fechaLimite?: string;
    archivoUrl?: string;
    nombreArchivoOriginal?: string;
    estadoDocumento?: string;
}

export interface DocumentacionInicialConstructor {
    idSolicitud?: number;
    completo: boolean;
    mensaje: string;
    documentos: DocumentoInicialConstructor[];
}

export interface CambiarPasswordConstructor {
    passActual: string;
    passNueva: string;
    passRepetida: string;
}

export interface ApiMensaje {
    mensaje: string;
}

export interface ApiArchivo {
    mensaje?: string;
    url: string;
}