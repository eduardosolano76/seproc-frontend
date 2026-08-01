// src/app/seproc/pages/constructor-institucion-dashboard/constructor-institucion-dashboard.component.ts

import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
    ChangeDetectorRef,
    Component,
    DestroyRef,
    HostListener,
    OnInit,
    inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
    FormsModule,
    NonNullableFormBuilder,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import {
    catchError,
    distinctUntilChanged,
    finalize,
    forkJoin,
    map,
    of,
    switchMap,
} from 'rxjs';

import {
    ArchivoEvidenciaConstructor,
    CambiarPasswordConstructor,
    CatalogoItem,
    ConstructorInstitucionView,
    DetalleEtapaConstructor,
    DocumentacionInicialConstructor,
    DocumentoInicialConstructor,
    EstadoProyecto,
    HistorialEtapaConstructor,
    PerfilConstructorInstitucion,
    ProyectoConstructorDetalle,
    ProyectoConstructorResumen,
    SolicitudProyectoConstructor,
    TipoDocumentoInicial,
} from '../../../core/models/constructor-institucion.model';
import {
    ConstructorInstitucionService,
} from '../../../core/services/constructor-institucion.service';

interface EtapaVisual {
    clave: string;
    nombre: string;
    estado: string;
}

interface BloqueVisual {
    clave:
    | 'preliminares'
    | 'cimentacion'
    | 'estructura'
    | 'acabados';
    nombre: string;
    estado: string;
}

type CampoPassword =
    | 'actual'
    | 'nueva'
    | 'repetida';

type CampoSolicitud =
    | 'nombreEscuela'
    | 'cct1'
    | 'idEstado'
    | 'idMunicipio'
    | 'idLocalidad'
    | 'calleNumero'
    | 'cp'
    | 'responsable'
    | 'contacto'
    | 'numInmuebles'
    | 'numEntreEjes'
    | 'idTipoEdificacion'
    | 'tipoObra';

type AccionConfirmada =
    | 'ENTREGAR_ETAPA'
    | 'ELIMINAR_EVIDENCIA';

@Component({
    selector: 'app-constructor-institucion-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
    ],
    templateUrl:
        './constructor-institucion-dashboard.component.html',
    styleUrl:
        './constructor-institucion-dashboard.component.css',
})
export class ConstructorInstitucionDashboardComponent
    implements OnInit {
    private readonly fb = inject(NonNullableFormBuilder);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly titleService = inject(Title);
    private readonly constructorService = inject(
        ConstructorInstitucionService,
    );
    private readonly destroyRef = inject(DestroyRef);
    private readonly cdr = inject(ChangeDetectorRef);

    private versionFotoPerfil = Date.now();

    readonly vistasValidas: ConstructorInstitucionView[] = [
        'proyectos',
        'password',
    ];

    readonly FOTO_PERFIL_PREDETERMINADA =
        '/assets/seproc/sinFotoPerfil.png';

    readonly tiposObra = [
        'Edificación',
        'Barda perimetral',
        'Techado',
        'Pisos',
    ];

    readonly documentosInicialesSolicitud: Array<{
        tipo: TipoDocumentoInicial;
        nombre: string;
    }> = [
            {
                tipo: 'LICENCIA_CONSTRUCCION',
                nombre: 'Licencia de construcción',
            },
            {
                tipo: 'MECANICA_SUELOS',
                nombre: 'Estudio de mecánica de suelos',
            },
            {
                tipo: 'ESTUDIO_AMBIENTAL',
                nombre: 'Estudio ambiental',
            },
        ];

    perfil: PerfilConstructorInstitucion | null = null;
    vista: ConstructorInstitucionView = 'proyectos';

    menuPerfilAbierto = false;
    menuMovilAbierto = false;

    cargandoContenido = false;
    cargandoDetalleProyecto = false;
    enviando = false;

    mensaje = '';
    tipoMensaje: 'success' | 'error' = 'success';
    busqueda = '';

    estadoProyecto: EstadoProyecto = 'ACTIVO';
    proyectos: ProyectoConstructorResumen[] = [];
    proyectoDetalle: ProyectoConstructorDetalle | null = null;

    vistaProyecto:
        | 'lista'
        | 'proceso'
        | 'bloque'
        | 'etapa'
        | 'historial' = 'lista';

    bloqueActual: BloqueVisual | null = null;
    etapasBloque: EtapaVisual[] = [];
    etapaActual: EtapaVisual | null = null;
    detalleEtapa: DetalleEtapaConstructor | null = null;
    historialEtapa: HistorialEtapaConstructor[] = [];

    subiendoEvidencia = false;
    descargandoPdf = false;
    guardandoNotas: Record<string, boolean> = {};
    notasArchivos: Record<string, string> = {};

    modalConfirmacionAbierto = false;
    accionConfirmada: AccionConfirmada | null = null;
    evidenciaPendienteEliminar:
        ArchivoEvidenciaConstructor | null = null;
    procesandoConfirmacion = false;

    modalNuevaSolicitudAbierto = false;
    cargandoCatalogos = false;
    enviandoSolicitud = false;

    modalResultadoSolicitudAbierto = false;
    mensajeResultadoSolicitud = '';
    tipoResultadoSolicitud: 'success' | 'error' = 'success';

    estados: CatalogoItem[] = [];
    municipios: CatalogoItem[] = [];
    localidades: CatalogoItem[] = [];
    tiposEdificacion: CatalogoItem[] = [];

    archivosSolicitud:
        Partial<Record<TipoDocumentoInicial, File>> = {};

    documentacionProyecto:
        DocumentacionInicialConstructor | null = null;
    modalDocumentacionAbierto = false;
    cargandoModalDocumentacion = false;
    subiendoDocumento = '';

    modalSinFotoAbierto = false;
    modalEliminarFotoAbierto = false;
    eliminandoFoto = false;
    modalExitoFotoAbierto = false;
    mensajeExitoFoto = '';

    intentoCambiarPassword = false;
    modalExitoPasswordAbierto = false;

    intentoEnviarSolicitud = false;

    modalExitoAbierto = false;
    tituloModalExito = '';
    mensajeModalExito = '';

    readonly solicitudForm = this.fb.group({
        nombreEscuela: ['', Validators.required],
        cct1: ['', Validators.required],
        cct2: [''],
        idEstado: ['', Validators.required],
        idMunicipio: ['', Validators.required],
        idLocalidad: ['', Validators.required],
        calleNumero: ['', Validators.required],
        cp: [
            '',
            [
                Validators.required,
                Validators.pattern(/^\d{5}$/),
            ],
        ],
        responsable: ['', Validators.required],
        contacto: ['', Validators.required],
        numInmuebles: [
            1,
            [
                Validators.required,
                Validators.min(1),
            ],
        ],
        numEntreEjes: [
            1,
            [
                Validators.required,
                Validators.min(1),
            ],
        ],
        idTipoEdificacion: ['', Validators.required],
        tipoObra: ['', Validators.required],
    });

    readonly passwordForm = this.fb.group({
        actual: ['', Validators.required],
        nueva: [
            '',
            [
                Validators.required,
                Validators.minLength(8),
                Validators.pattern(
                    /^(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/,
                ),
            ],
        ],
        repetida: ['', Validators.required],
    });

    @HostListener('document:click', ['$event'])
    cerrarMenuPerfilAlHacerClickFuera(
        event: MouseEvent,
    ): void {
        const elemento = event.target as HTMLElement;

        if (
            this.menuPerfilAbierto &&
            !elemento.closest('.userbox')
        ) {
            this.menuPerfilAbierto = false;
        }
    }

    ngOnInit(): void {
        const abreviacionGuardada = sessionStorage
            .getItem('institucionAbreviacion')
            ?.trim();

        this.titleService.setTitle(
            abreviacionGuardada
                ? `${abreviacionGuardada.toUpperCase()} | Modulo Constructor`
                : 'SEPROC | Modulo Constructor',
        );

        this.cargarPerfil();

        this.route.queryParamMap
            .pipe(
                map(
                    (params) =>
                        params.get('view') ?? 'proyectos',
                ),
                map((view) =>
                    this.esVistaValida(view)
                        ? view
                        : 'proyectos',
                ),
                distinctUntilChanged(),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe((view) => {
                this.vista = view;
                this.cargarVistaActual();
            });
    }

    tieneDocumentoSolicitudSeleccionado(
        tipo: TipoDocumentoInicial,
    ): boolean {
        return !!this.archivosSolicitud[tipo];
    }

    quitarDocumentoSolicitud(
        tipo: TipoDocumentoInicial,
        input: HTMLInputElement,
    ): void {
        if (this.enviandoSolicitud) {
            return;
        }

        delete this.archivosSolicitud[tipo];
        input.value = '';
    }

    cerrarResultadoSolicitud(): void {
        this.modalResultadoSolicitudAbierto = false;
        this.mensajeResultadoSolicitud = '';
    }

    private esVistaValida(
        view: string,
    ): view is ConstructorInstitucionView {
        return this.vistasValidas.includes(
            view as ConstructorInstitucionView,
        );
    }

    cambiarVista(
        view: ConstructorInstitucionView,
    ): void {
        this.menuMovilAbierto = false;

        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { view },
            queryParamsHandling: 'merge',
            replaceUrl: true,
        });
    }

    private cargarVistaActual(): void {
        this.busqueda = '';
        this.vistaProyecto = 'lista';
        this.proyectoDetalle = null;

        if (this.vista === 'proyectos') {
            this.cargarProyectos();
            return;
        }

        this.cargandoContenido = false;
    }

    private cargarPerfil(): void {
        this.constructorService
            .obtenerPerfil()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (perfil) => {
                    this.perfil = perfil;

                    const abreviacion =
                        perfil.abreviacion?.trim() ||
                        sessionStorage
                            .getItem('institucionAbreviacion')
                            ?.trim();

                    if (abreviacion) {
                        sessionStorage.setItem(
                            'institucionAbreviacion',
                            abreviacion.toLowerCase(),
                        );

                        this.titleService.setTitle(
                            `${abreviacion.toUpperCase()} | Modulo Constructor`,
                        );
                    }

                    this.cdr.detectChanges();
                },
                error: (error) => {
                    this.mostrarError(error);
                },
            });
    }

    cargarProyectos(): void {
        this.cargandoContenido = true;

        this.constructorService
            .obtenerProyectos(this.estadoProyecto)
            .pipe(
                finalize(() => {
                    this.cargandoContenido = false;
                    this.cdr.markForCheck();
                }),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe({
                next: (proyectos) => {
                    this.proyectos = proyectos;
                },
                error: (error) => {
                    this.mostrarError(error);
                },
            });
    }

    seleccionarEstadoProyecto(
        estado: EstadoProyecto,
    ): void {
        this.estadoProyecto = estado;
        this.cargarProyectos();
    }

    get proyectosFiltrados():
        ProyectoConstructorResumen[] {
        const texto = this.normalizar(this.busqueda);

        if (!texto) {
            return this.proyectos;
        }

        return this.proyectos.filter(
            (proyecto) =>
                this.normalizar(
                    proyecto.nombreEscuela,
                ).includes(texto) ||
                this.normalizar(
                    proyecto.supervisor,
                ).includes(texto),
        );
    }

    abrirProyecto(idProyecto: number): void {
        this.vistaProyecto = 'proceso';
        this.proyectoDetalle = null;
        this.cargandoDetalleProyecto = true;

        this.constructorService
            .obtenerDetalleProyecto(idProyecto)
            .pipe(
                finalize(() => {
                    this.cargandoDetalleProyecto = false;
                    this.cdr.markForCheck();
                }),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe({
                next: (proyecto) => {
                    this.proyectoDetalle = proyecto;
                },
                error: (error) => {
                    this.mostrarError(error);
                    this.vistaProyecto = 'lista';
                },
            });
    }

    volverAListaProyectos(): void {
        this.vistaProyecto = 'lista';
        this.proyectoDetalle = null;
        this.bloqueActual = null;
        this.etapaActual = null;
        this.detalleEtapa = null;
        this.historialEtapa = [];
    }

    get bloquesProyecto(): BloqueVisual[] {
        if (!this.proyectoDetalle) {
            return [];
        }

        const bloques: Array<{
            clave: BloqueVisual['clave'];
            nombre: string;
            etapas: EtapaVisual[];
        }> = [
                {
                    clave: 'preliminares',
                    nombre: 'Trabajos preliminares',
                    etapas: this.crearEtapasPreliminares(),
                },
                {
                    clave: 'cimentacion',
                    nombre: 'Cimentación',
                    etapas: this.crearEtapasCimentacion(),
                },
                {
                    clave: 'estructura',
                    nombre: 'Estructura',
                    etapas: this.crearEtapasEstructura(),
                },
                {
                    clave: 'acabados',
                    nombre: 'Albañilería y acabados',
                    etapas: this.crearEtapasAcabados(),
                },
            ];

        return bloques.map((bloque) => ({
            clave: bloque.clave,
            nombre: bloque.nombre,
            estado: this.resolverEstadoGrupo(
                bloque.etapas.map((etapa) => etapa.clave),
            ),
        }));
    }

    abrirBloque(bloque: BloqueVisual): void {
        if (
            this.claseVisualEtapa(bloque.estado) ===
            'locked'
        ) {
            return;
        }

        this.bloqueActual = bloque;

        switch (bloque.clave) {
            case 'preliminares':
                this.etapasBloque =
                    this.crearEtapasPreliminares();
                break;

            case 'cimentacion':
                this.etapasBloque =
                    this.crearEtapasCimentacion();
                break;

            case 'estructura':
                this.etapasBloque =
                    this.crearEtapasEstructura();
                break;

            case 'acabados':
                this.etapasBloque =
                    this.crearEtapasAcabados();
                break;
        }

        this.vistaProyecto = 'bloque';
    }

    abrirEtapa(etapa: EtapaVisual): void {
        if (
            !this.proyectoDetalle ||
            this.claseVisualEtapa(etapa.estado) ===
            'locked'
        ) {
            return;
        }

        this.etapaActual = etapa;
        this.vistaProyecto = 'etapa';
        this.cargarDetalleEtapa();
    }

    private cargarDetalleEtapa(): void {
        if (
            !this.proyectoDetalle ||
            !this.etapaActual
        ) {
            return;
        }

        this.cargandoContenido = true;

        this.constructorService
            .obtenerDetalleEtapa(
                this.proyectoDetalle.idProyecto,
                this.etapaActual.clave,
            )
            .pipe(
                finalize(() => {
                    this.cargandoContenido = false;
                    this.cdr.markForCheck();
                }),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe({
                next: (detalle) => {
                    this.detalleEtapa = detalle;
                    this.inicializarNotasArchivos();
                    this.vistaProyecto = 'etapa';
                },
                error: (error) => {
                    this.mostrarError(error);
                },
            });
    }

    abrirHistorialEtapa(): void {
        if (
            !this.proyectoDetalle ||
            !this.etapaActual
        ) {
            return;
        }

        this.cargandoContenido = true;

        this.constructorService
            .obtenerHistorialEtapa(
                this.proyectoDetalle.idProyecto,
                this.etapaActual.clave,
            )
            .pipe(
                finalize(() => {
                    this.cargandoContenido = false;
                    this.cdr.markForCheck();
                }),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe({
                next: (historial) => {
                    this.historialEtapa = historial;
                    this.vistaProyecto = 'historial';
                },
                error: (error) => {
                    this.mostrarError(error);
                },
            });
    }

    seleccionarEvidencia(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];

        if (
            !file ||
            !this.proyectoDetalle ||
            !this.etapaActual
        ) {
            input.value = '';
            return;
        }

        const formatos = [
            'image/png',
            'image/jpeg',
            'image/webp',
        ];

        if (!formatos.includes(file.type)) {
            this.notificar(
                'Selecciona una imagen PNG, JPG o WEBP.',
                'error',
            );
            input.value = '';
            return;
        }

        this.subiendoEvidencia = true;

        this.constructorService
            .subirEvidencia(
                this.proyectoDetalle.idProyecto,
                this.etapaActual.clave,
                file,
            )
            .pipe(
                finalize(() => {
                    this.subiendoEvidencia = false;
                    input.value = '';
                    this.cdr.markForCheck();
                }),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe({
                next: (respuesta) => {
                    this.mostrarModalExito(
                        'Evidencia guardada',
                        respuesta.mensaje ||
                        "Archivo subido como borrador correctamente. Recuerda presionar 'Entregar' para enviarlo al supervisor.",
                    );

                    this.cargarDetalleEtapa();
                },
                error: (error) => {
                    this.mostrarError(error);
                },
            });
    }

    guardarNotaArchivo(
        archivo: ArchivoEvidenciaConstructor,
    ): void {
        if (
            !this.proyectoDetalle ||
            !this.etapaActual
        ) {
            return;
        }

        const storagePath = archivo.path?.trim();

        if (!storagePath) {
            this.notificar(
                'No se encontró la ruta de la evidencia.',
                'error',
            );
            return;
        }

        const clave = this.claveArchivo(archivo);
        const nota = (
            this.notasArchivos[clave] ?? ''
        ).trim();
        const notaAnterior = (
            archivo.nota === 'SIN_NOTA'
                ? ''
                : archivo.nota ?? ''
        ).trim();

        if (nota === notaAnterior) {
            return;
        }

        this.guardandoNotas[clave] = true;

        this.constructorService
            .actualizarNotaEvidencia(
                this.proyectoDetalle.idProyecto,
                this.etapaActual.clave,
                storagePath,
                nota,
            )
            .pipe(
                finalize(() => {
                    this.guardandoNotas[clave] = false;
                    this.cdr.markForCheck();
                }),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe({
                next: () => {
                    archivo.nota = nota;
                },
                error: (error) => {
                    this.notasArchivos[clave] = notaAnterior;
                    this.mostrarError(error);
                },
            });
    }

    prepararEliminarEvidencia(
        archivo: ArchivoEvidenciaConstructor,
    ): void {
        if (!archivo.path) {
            this.notificar(
                'No se encontró la ruta de la evidencia.',
                'error',
            );
            return;
        }

        this.evidenciaPendienteEliminar = archivo;
        this.accionConfirmada = 'ELIMINAR_EVIDENCIA';
        this.modalConfirmacionAbierto = true;
    }

    prepararEntregaEtapa(): void {
        this.evidenciaPendienteEliminar = null;
        this.accionConfirmada = 'ENTREGAR_ETAPA';
        this.modalConfirmacionAbierto = true;
    }

    confirmarAccionEtapa(): void {
        if (
            this.procesandoConfirmacion ||
            !this.proyectoDetalle ||
            !this.etapaActual ||
            !this.accionConfirmada
        ) {
            return;
        }

        this.procesandoConfirmacion = true;

        const peticion =
            this.accionConfirmada ===
                'ENTREGAR_ETAPA'
                ? this.constructorService.entregarEtapa(
                    this.proyectoDetalle.idProyecto,
                    this.etapaActual.clave,
                )
                : this.constructorService.eliminarEvidencia(
                    this.proyectoDetalle.idProyecto,
                    this.etapaActual.clave,
                    this.evidenciaPendienteEliminar
                        ?.path ?? '',
                );

        peticion
            .pipe(
                finalize(() => {
                    this.procesandoConfirmacion = false;
                    this.modalConfirmacionAbierto = false;
                    this.accionConfirmada = null;
                    this.evidenciaPendienteEliminar = null;
                    this.cdr.markForCheck();
                }),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe({
                next: (respuesta) => {
                    if (
                        this.accionConfirmada ===
                        'ELIMINAR_EVIDENCIA'
                    ) {
                        this.mostrarModalExito(
                            'Imagen eliminada',
                            'Imagen eliminada correctamente.',
                        );
                    } else {
                        this.mostrarModalExito(
                            'Evidencia entregada',
                            respuesta.mensaje ||
                            'La evidencia fue entregada correctamente al supervisor.',
                        );
                    }

                    this.cargarDetalleEtapa();
                },
                error: (error) => {
                    this.mostrarError(error);
                },
            });
    }

    cerrarModalExito(): void {
        this.modalExitoAbierto = false;
        this.tituloModalExito = '';
        this.mensajeModalExito = '';
    }

    private mostrarModalExito(
        titulo: string,
        mensaje: string,
    ): void {
        this.tituloModalExito = titulo;
        this.mensajeModalExito = mensaje;
        this.modalExitoAbierto = true;
        this.cdr.markForCheck();
    }

    cancelarConfirmacion(): void {
        if (this.procesandoConfirmacion) {
            return;
        }

        this.modalConfirmacionAbierto = false;
        this.accionConfirmada = null;
        this.evidenciaPendienteEliminar = null;
    }

    descargarPdfEtapa(): void {
        if (
            !this.proyectoDetalle ||
            !this.etapaActual ||
            this.descargandoPdf
        ) {
            return;
        }

        this.descargandoPdf = true;

        this.constructorService
            .descargarPdfEtapa(
                this.proyectoDetalle.idProyecto,
                this.etapaActual.clave,
            )
            .pipe(
                finalize(() => {
                    this.descargandoPdf = false;
                    this.cdr.markForCheck();
                }),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe({
                next: (blob) => {
                    const url = URL.createObjectURL(blob);
                    const enlace = document.createElement('a');

                    enlace.href = url;
                    enlace.download =
                        `Reporte_${this.etapaActual?.clave ?? 'etapa'}.pdf`;
                    enlace.click();

                    URL.revokeObjectURL(url);
                },
                error: (error) => {
                    this.mostrarError(error);
                },
            });
    }

    get estadoEntregaActual(): string {
        return this.detalleEtapa
            ?.entregaActual
            ?.estadoEntrega
            ?.trim()
            .toUpperCase() ?? '';
    }

    get puedeModificarEvidencias(): boolean {
        if (!this.proyectoDetalle?.puedeSubir) {
            return false;
        }

        return ![
            'ENVIADA',
            'APROBADA',
        ].includes(this.estadoEntregaActual);
    }

    get puedeEntregarEtapa(): boolean {
        return (
            this.estadoEntregaActual === 'BORRADOR' &&
            (
                this.detalleEtapa
                    ?.entregaActual
                    ?.archivos
                    ?.length ?? 0
            ) > 0
        );
    }

    get etapaAprobada(): boolean {
        return this.estadoEntregaActual === 'APROBADA';
    }

    private inicializarNotasArchivos(): void {
        this.notasArchivos = {};

        for (
            const archivo of
            this.detalleEtapa
                ?.entregaActual
                ?.archivos ?? []
        ) {
            this.notasArchivos[
                this.claveArchivo(archivo)
            ] =
                archivo.nota === 'SIN_NOTA'
                    ? ''
                    : archivo.nota ?? '';
        }
    }

    claveArchivo(
        archivo: ArchivoEvidenciaConstructor,
    ): string {
        return archivo.path || archivo.url || archivo.nombre;
    }

    abrirNuevaSolicitud(): void {
        this.intentoEnviarSolicitud = false;
        this.modalNuevaSolicitudAbierto = true;
        this.cargandoCatalogos = true;
        this.estados = [];
        this.municipios = [];
        this.localidades = [];
        this.tiposEdificacion = [];

        forkJoin({
            estados:
                this.constructorService.obtenerEstados(),
            tipos:
                this.constructorService
                    .obtenerTiposEdificacion(),
        })
            .pipe(
                finalize(() => {
                    this.cargandoCatalogos = false;
                    this.cdr.markForCheck();
                }),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe({
                next: ({ estados, tipos }) => {
                    this.estados = estados;
                    this.tiposEdificacion = tipos;
                },
                error: (error) => {
                    this.modalNuevaSolicitudAbierto = false;
                    this.mostrarError(error);
                },
            });
    }

    cerrarNuevaSolicitud(): void {
        if (this.enviandoSolicitud) {
            return;
        }

        this.modalNuevaSolicitudAbierto = false;
        this.limpiarSolicitud();
    }

    cargarMunicipios(): void {
        const idEstado = Number(
            this.solicitudForm.controls.idEstado.value,
        );

        this.solicitudForm.controls.idMunicipio.setValue('');
        this.solicitudForm.controls.idLocalidad.setValue('');
        this.municipios = [];
        this.localidades = [];

        if (!idEstado) {
            return;
        }

        this.constructorService
            .obtenerMunicipios(idEstado)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (municipios) => {
                    this.municipios = municipios;
                    this.cdr.markForCheck();
                },
                error: (error) => {
                    this.mostrarError(error);
                },
            });
    }

    cargarLocalidades(): void {
        const idMunicipio = Number(
            this.solicitudForm.controls.idMunicipio.value,
        );

        this.solicitudForm.controls.idLocalidad.setValue('');
        this.localidades = [];

        if (!idMunicipio) {
            return;
        }

        this.constructorService
            .obtenerLocalidades(idMunicipio)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (localidades) => {
                    this.localidades = localidades;
                    this.cdr.markForCheck();
                },
                error: (error) => {
                    this.mostrarError(error);
                },
            });
    }

    seleccionarDocumentoSolicitud(
        tipo: TipoDocumentoInicial,
        event: Event,
    ): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];

        if (!file) {
            delete this.archivosSolicitud[tipo];
            return;
        }

        if (
            file.type !== 'application/pdf' &&
            !file.name.toLowerCase().endsWith('.pdf')
        ) {
            this.notificar(
                'La documentación inicial debe estar en formato PDF.',
                'error',
            );
            input.value = '';
            delete this.archivosSolicitud[tipo];
            return;
        }

        this.archivosSolicitud[tipo] = file;
    }

    nombreDocumentoSeleccionado(
        tipo: TipoDocumentoInicial,
    ): string {
        return (
            this.archivosSolicitud[tipo]?.name ||
            'No se ha seleccionado ningún archivo'
        );
    }

    enviarSolicitud(): void {
        if (this.enviandoSolicitud) {
            return;
        }

        this.intentoEnviarSolicitud = true;
        this.solicitudForm.markAllAsTouched();

        if (this.solicitudForm.invalid) {
            return;
        }

        const datos = this.solicitudForm.getRawValue();

        const payload: SolicitudProyectoConstructor = {
            nombreEscuela: datos.nombreEscuela.trim(),
            cct1: datos.cct1.trim(),
            cct2: datos.cct2.trim() || null,
            idEstado: Number(datos.idEstado),
            idMunicipio: Number(datos.idMunicipio),
            idLocalidad: Number(datos.idLocalidad),
            calleNumero: datos.calleNumero.trim(),
            cp: datos.cp.trim(),
            responsable: datos.responsable.trim(),
            contacto: datos.contacto.trim(),
            numInmuebles: Number(datos.numInmuebles),
            numEntreEjes: Number(datos.numEntreEjes),
            idTipoEdificacion:
                Number(datos.idTipoEdificacion),
            tipoObra: datos.tipoObra,
        };

        this.enviandoSolicitud = true;

        this.constructorService
            .crearSolicitud(payload)
            .pipe(
                switchMap((respuesta) => {
                    const cargas =
                        this.documentosInicialesSolicitud
                            .map(({ tipo }) => {
                                const file =
                                    this.archivosSolicitud[tipo];

                                return file
                                    ? this.constructorService
                                        .subirDocumentoInicial(
                                            respuesta.idSolicitud,
                                            tipo,
                                            file,
                                        )
                                    : null;
                            })
                            .filter(
                                (
                                    carga,
                                ): carga is ReturnType<
                                    ConstructorInstitucionService[
                                    'subirDocumentoInicial'
                                    ]
                                > => carga !== null,
                            );

                    if (cargas.length === 0) {
                        return of({
                            respuesta,
                            errorDocumentos: '',
                        });
                    }

                    return forkJoin(cargas).pipe(
                        map(() => ({
                            respuesta,
                            errorDocumentos: '',
                        })),
                        catchError((error) =>
                            of({
                                respuesta,
                                errorDocumentos:
                                    this.obtenerMensajeError(error),
                            }),
                        ),
                    );
                }),
                finalize(() => {
                    this.enviandoSolicitud = false;
                    this.cdr.markForCheck();
                }),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe({
                next: ({ respuesta, errorDocumentos }) => {
                    this.modalNuevaSolicitudAbierto = false;
                    this.limpiarSolicitud();

                    if (errorDocumentos) {
                        this.mostrarResultadoSolicitud(
                            `${respuesta.mensaje} Sin embargo, no se pudieron subir todos los documentos: ${errorDocumentos}`,
                            'error',
                        );
                        return;
                    }

                    this.mostrarResultadoSolicitud(
                        respuesta.mensaje ||
                        'Solicitud enviada correctamente.',
                        'success',
                    );
                },
                error: (error) => {
                    this.mostrarResultadoSolicitud(
                        this.obtenerMensajeError(error),
                        'error',
                    );
                },
            });
    }

    private mostrarResultadoSolicitud(
        mensaje: string,
        tipo: 'success' | 'error',
    ): void {
        this.mensajeResultadoSolicitud = mensaje;
        this.tipoResultadoSolicitud = tipo;
        this.modalResultadoSolicitudAbierto = true;
        this.cdr.markForCheck();
    }

    campoSolicitudInvalido(campo: CampoSolicitud): boolean {
        const control = this.solicitudForm.controls[campo];

        return (
            this.intentoEnviarSolicitud &&
            control.invalid
        );
    }

    mensajeCampoSolicitud(
        campo: CampoSolicitud,
    ): string {
        const control =
            this.solicitudForm.controls[campo];

        if (control.hasError('required')) {
            return 'Este campo es obligatorio.';
        }

        if (control.hasError('pattern')) {
            return 'El código postal debe tener 5 dígitos.';
        }

        if (control.hasError('min')) {
            return 'El valor mínimo es 1.';
        }

        return '';
    }

    private limpiarSolicitud(): void {
        this.intentoEnviarSolicitud = false;

        this.solicitudForm.reset({
            nombreEscuela: '',
            cct1: '',
            cct2: '',
            idEstado: '',
            idMunicipio: '',
            idLocalidad: '',
            calleNumero: '',
            cp: '',
            responsable: '',
            contacto: '',
            numInmuebles: 1,
            numEntreEjes: 1,
            idTipoEdificacion: '',
            tipoObra: '',
        });

        this.archivosSolicitud = {};
        this.municipios = [];
        this.localidades = [];
    }

    abrirDocumentacionProyecto(): void {
        if (!this.proyectoDetalle) {
            return;
        }

        this.modalDocumentacionAbierto = true;
        this.cargarDocumentacionProyecto();
    }

    private cargarDocumentacionProyecto(): void {
        if (!this.proyectoDetalle) {
            return;
        }

        this.cargandoModalDocumentacion = true;
        this.documentacionProyecto = null;

        this.constructorService
            .obtenerDocumentacionProyecto(
                this.proyectoDetalle.idProyecto,
            )
            .pipe(
                finalize(() => {
                    this.cargandoModalDocumentacion = false;
                    this.cdr.markForCheck();
                }),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe({
                next: (documentacion) => {
                    this.documentacionProyecto = documentacion;
                },
                error: (error) => {
                    this.modalDocumentacionAbierto = false;
                    this.mostrarError(error);
                },
            });
    }

    subirDocumentoProyecto(
        documento: DocumentoInicialConstructor,
        event: Event,
    ): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        const idSolicitud =
            this.documentacionProyecto?.idSolicitud ||
            this.proyectoDetalle?.idSolicitud;

        if (!file || !idSolicitud) {
            input.value = '';
            return;
        }

        if (
            file.type !== 'application/pdf' &&
            !file.name.toLowerCase().endsWith('.pdf')
        ) {
            this.notificar(
                'Selecciona un documento PDF.',
                'error',
            );
            input.value = '';
            return;
        }

        const tipo =
            this.resolverTipoDocumento(documento);
        const clave =
            documento.idDocumento?.toString() || tipo;

        this.subiendoDocumento = clave;

        this.constructorService
            .subirDocumentoInicial(
                idSolicitud,
                tipo,
                file,
            )
            .pipe(
                finalize(() => {
                    this.subiendoDocumento = '';
                    input.value = '';
                    this.cdr.markForCheck();
                }),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe({
                next: (respuesta) => {
                    this.notificar(
                        respuesta.mensaje ||
                        'Documento subido correctamente.',
                        'success',
                    );
                    this.cargarDocumentacionProyecto();
                },
                error: (error) => {
                    this.mostrarError(error);
                },
            });
    }

    claveDocumento(
        documento: DocumentoInicialConstructor,
    ): string {
        return (
            documento.idDocumento?.toString() ||
            this.resolverTipoDocumento(documento)
        );
    }

    private resolverTipoDocumento(
        documento: DocumentoInicialConstructor,
    ): TipoDocumentoInicial | string {
        if (documento.tipoDocumento) {
            return documento.tipoDocumento;
        }

        const nombre =
            this.normalizar(documento.nombreDocumento);

        if (nombre.includes('licencia')) {
            return 'LICENCIA_CONSTRUCCION';
        }

        if (
            nombre.includes('mecanica') ||
            nombre.includes('suelo')
        ) {
            return 'MECANICA_SUELOS';
        }

        return 'ESTUDIO_AMBIENTAL';
    }

    private crearEtapasPreliminares():
        EtapaVisual[] {
        return this.prepararEtapas([
            {
                clave: 'limpieza_trazo_nivelacion',
                nombre: 'Limpieza, trazo y nivelación',
            },
        ]);
    }

    private crearEtapasCimentacion():
        EtapaVisual[] {
        return this.prepararEtapas([
            {
                clave: 'excavacion',
                nombre: 'Excavación',
            },
            {
                clave: 'plantilla_concreto',
                nombre: 'Plantilla de concreto',
            },
            {
                clave: 'zapata',
                nombre: 'Zapata',
            },
            {
                clave: 'contratrabe',
                nombre: 'Contratrabe',
            },
            {
                clave: 'columnas_castillos_cimentacion',
                nombre: 'Columnas o castillos',
            },
            {
                clave: 'cimbra_murete_enrase',
                nombre: 'Cimbra y murete de enrase',
            },
            {
                clave: 'concreto_cimentacion',
                nombre: 'Concreto',
            },
            {
                clave: 'habilitado_cadenas_cimentacion',
                nombre: 'Habilitado de cadenas',
            },
            {
                clave: 'relleno',
                nombre: 'Relleno',
            },
        ]);
    }

    private crearEtapasEstructura():
        EtapaVisual[] {
        const niveles = this.obtenerNumeroNiveles();
        const etapas:
            Array<{
                clave: string;
                nombre: string;
            }> = [];

        for (
            let nivel = 1;
            nivel <= niveles;
            nivel++
        ) {
            const prefijo = `estructura_n${nivel}_`;

            etapas.push(
                {
                    clave:
                        `${prefijo}habilitado_castillos`,
                    nombre:
                        `Nivel ${nivel}: Habilitado de castillos`,
                },
                {
                    clave:
                        `${prefijo}habilitado_columnas`,
                    nombre:
                        `Nivel ${nivel}: Habilitado de columnas`,
                },
                {
                    clave:
                        `${prefijo}habilitado_muros_concreto`,
                    nombre:
                        `Nivel ${nivel}: Muros de concreto`,
                },
                {
                    clave:
                        `${prefijo}habilitado_cadenas_intermedias`,
                    nombre:
                        `Nivel ${nivel}: Cadenas intermedias`,
                },
                {
                    clave:
                        `${prefijo}cimbra_verticales`,
                    nombre:
                        `Nivel ${nivel}: Cimbra vertical`,
                },
                {
                    clave:
                        `${prefijo}concreto_verticales`,
                    nombre:
                        `Nivel ${nivel}: Concreto vertical`,
                },
                {
                    clave:
                        `${prefijo}habilitado_dalas`,
                    nombre:
                        `Nivel ${nivel}: Habilitado de dalas`,
                },
                {
                    clave:
                        `${prefijo}habilitado_vigas_trabes`,
                    nombre:
                        `Nivel ${nivel}: Vigas y trabes`,
                },
                {
                    clave:
                        `${prefijo}cimbra_horizontales`,
                    nombre:
                        `Nivel ${nivel}: Cimbra horizontal`,
                },
                {
                    clave:
                        `${prefijo}concreto_horizontales`,
                    nombre:
                        `Nivel ${nivel}: Concreto horizontal`,
                },
                {
                    clave:
                        `${prefijo}cimbra_losa`,
                    nombre:
                        `Nivel ${nivel}: Cimbra para losa`,
                },
                {
                    clave:
                        `${prefijo}habilitado_losa`,
                    nombre:
                        `Nivel ${nivel}: Habilitado para losa`,
                },
                {
                    clave:
                        `${prefijo}concreto_losa`,
                    nombre:
                        `Nivel ${nivel}: Concreto de losa`,
                },
                {
                    clave:
                        `${prefijo}habilitado_barandal_concreto`,
                    nombre:
                        `Nivel ${nivel}: Barandal de concreto`,
                },
                {
                    clave:
                        `${prefijo}cimbra_otros_concreto`,
                    nombre:
                        `Nivel ${nivel}: Cimbra de otros elementos`,
                },
                {
                    clave:
                        `${prefijo}concreto_otros_concreto`,
                    nombre:
                        `Nivel ${nivel}: Otros elementos de concreto`,
                },
            );
        }

        return this.prepararEtapas(etapas);
    }

    private crearEtapasAcabados():
        EtapaVisual[] {
        return this.prepararEtapas([
            {
                clave: 'pisos',
                nombre: 'Pisos',
            },
            {
                clave: 'guarnicion',
                nombre: 'Guarnición',
            },
        ]);
    }

    private prepararEtapas(
        etapas: Array<{
            clave: string;
            nombre: string;
        }>,
    ): EtapaVisual[] {
        const estados =
            this.proyectoDetalle?.estadosEtapa ?? {};

        const existeAlguna = etapas.some(
            (etapa) =>
                Object.prototype.hasOwnProperty.call(
                    estados,
                    etapa.clave,
                ),
        );

        const etapasFinales = existeAlguna
            ? etapas.filter((etapa) =>
                Object.prototype.hasOwnProperty.call(
                    estados,
                    etapa.clave,
                ),
            )
            : etapas;

        return etapasFinales.map((etapa) => ({
            ...etapa,
            estado:
                estados[etapa.clave]?.toUpperCase() ??
                'BLOQUEADA',
        }));
    }

    private resolverEstadoGrupo(
        claves: string[],
    ): string {
        const estados =
            this.proyectoDetalle?.estadosEtapa ?? {};

        const valores = claves.map(
            (clave) =>
                estados[clave]?.toUpperCase() ??
                'BLOQUEADA',
        );

        if (valores.length === 0) {
            return 'BLOQUEADA';
        }

        if (
            valores.every(
                (estado) => estado === 'APROBADA',
            )
        ) {
            return 'APROBADA';
        }

        if (
            valores.some((estado) =>
                [
                    'EN_PROCESO',
                    'CON_OBSERVACIONES',
                    'DISPONIBLE',
                    'APROBADA',
                ].includes(estado),
            )
        ) {
            return 'EN_PROCESO';
        }

        return 'BLOQUEADA';
    }

    private obtenerNumeroNiveles(): number {
        const tipo =
            this.proyectoDetalle
                ?.tipoEdificacion
                ?.toUpperCase();

        if (tipo === 'U3C') {
            return 3;
        }

        if (tipo === 'U2C') {
            return 2;
        }

        return 1;
    }

    claseVisualEtapa(
        estado?: string,
    ): 'done' | 'current' | 'locked' {
        const valor = estado?.toUpperCase();

        if (valor === 'APROBADA') {
            return 'done';
        }

        if (
            valor === 'EN_PROCESO' ||
            valor === 'CON_OBSERVACIONES' ||
            valor === 'DISPONIBLE'
        ) {
            return 'current';
        }

        return 'locked';
    }

    iconoEtapa(estado?: string): string {
        switch (this.claseVisualEtapa(estado)) {
            case 'done':
                return '/assets/seproc/listo.png';

            case 'current':
                return '/assets/seproc/proceso.png';

            default:
                return '/assets/seproc/bloqueado.png';
        }
    }

    obtenerClaseTipo(tipo: string): string {
        const valor = this.normalizar(tipo);

        if (valor.includes('entrega')) {
            return 'tipo-entrega';
        }

        if (
            valor.includes('aprobacion') ||
            valor.includes('aprobado')
        ) {
            return 'tipo-aprobacion';
        }

        if (valor.includes('observacion')) {
            return 'tipo-observacion';
        }

        if (valor.includes('borrador')) {
            return 'tipo-borrador';
        }

        return 'tipo-default';
    }

    formatearEstado(valor?: string | null): string {
        const texto = (valor ?? '')
            .replace(/_/g, ' ')
            .trim()
            .toLowerCase();

        return texto
            ? texto.charAt(0).toUpperCase() +
            texto.slice(1)
            : '—';
    }

    campoPasswordInvalido(
        campo: CampoPassword,
    ): boolean {
        const control =
            this.passwordForm.controls[campo];
        const tieneTexto =
            String(control.value ?? '').length > 0;

        if (
            campo === 'nueva' &&
            tieneTexto &&
            (
                control.hasError('minlength') ||
                control.hasError('pattern')
            )
        ) {
            return true;
        }

        return (
            this.intentoCambiarPassword &&
            control.invalid
        );
    }

    mensajeCampoPassword(
        campo: CampoPassword,
    ): string {
        const control =
            this.passwordForm.controls[campo];
        const tieneTexto =
            String(control.value ?? '').length > 0;

        if (
            campo === 'nueva' &&
            tieneTexto &&
            (
                control.hasError('minlength') ||
                control.hasError('pattern')
            )
        ) {
            return 'Debe tener al menos 8 caracteres, un número y un carácter especial.';
        }

        if (
            this.intentoCambiarPassword &&
            control.hasError('required')
        ) {
            return 'Este campo es obligatorio.';
        }

        return '';
    }

    cambiarPassword(): void {
        this.intentoCambiarPassword = true;

        if (
            this.passwordForm.invalid ||
            this.enviando
        ) {
            return;
        }

        const valores =
            this.passwordForm.getRawValue();

        if (valores.nueva !== valores.repetida) {
            this.notificar(
                'Las contraseñas nuevas no coinciden.',
                'error',
            );
            return;
        }

        const payload: CambiarPasswordConstructor = {
            passActual: valores.actual,
            passNueva: valores.nueva,
            passRepetida: valores.repetida,
        };

        this.enviando = true;

        this.constructorService
            .cambiarPassword(payload)
            .pipe(
                finalize(() => {
                    this.enviando = false;
                    this.cdr.markForCheck();
                }),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe({
                next: () => {
                    this.passwordForm.reset();
                    this.intentoCambiarPassword = false;
                    this.mensaje = '';
                    this.modalExitoPasswordAbierto = true;
                },
                error: (error) => {
                    this.mostrarError(error);
                },
            });
    }

    subirFoto(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];

        if (!file) {
            return;
        }

        const formatos = [
            'image/png',
            'image/jpeg',
            'image/webp',
        ];

        if (!formatos.includes(file.type)) {
            this.notificar(
                'Selecciona una imagen PNG, JPG o WEBP.',
                'error',
            );
            input.value = '';
            return;
        }

        this.constructorService
            .subirFotoPerfil(file)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (respuesta) => {
                    if (this.perfil) {
                        this.perfil = {
                            ...this.perfil,
                            fotoUrl: respuesta.url,
                        };
                    }

                    this.versionFotoPerfil = Date.now();
                    this.menuPerfilAbierto = false;
                    this.mensajeExitoFoto =
                        'Foto actualizada correctamente.';
                    this.modalExitoFotoAbierto = true;
                    input.value = '';
                    this.cdr.detectChanges();
                },
                error: (error) => {
                    input.value = '';
                    this.mostrarError(error);
                },
            });
    }

    eliminarFoto(): void {
        const foto = this.fotoPerfil;
        this.menuPerfilAbierto = false;

        if (
            !foto ||
            foto.includes('sinFotoPerfil.png')
        ) {
            this.modalSinFotoAbierto = true;
            return;
        }

        this.modalEliminarFotoAbierto = true;
    }

    confirmarEliminarFoto(): void {
        if (this.eliminandoFoto) {
            return;
        }

        this.eliminandoFoto = true;

        this.constructorService
            .eliminarFotoPerfil()
            .pipe(
                finalize(() => {
                    this.eliminandoFoto = false;
                    this.cdr.markForCheck();
                }),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe({
                next: (respuesta) => {
                    if (this.perfil) {
                        this.perfil = {
                            ...this.perfil,
                            fotoUrl: '',
                        };
                    }

                    this.versionFotoPerfil = Date.now();
                    this.modalEliminarFotoAbierto = false;
                    this.mensajeExitoFoto =
                        respuesta.mensaje ||
                        'Foto eliminada correctamente.';
                    this.modalExitoFotoAbierto = true;
                    this.cdr.detectChanges();
                },
                error: (error) => {
                    this.mostrarError(error);
                },
            });
    }

    verFoto(): void {
        const foto = this.fotoPerfil;
        this.menuPerfilAbierto = false;

        if (
            !foto ||
            foto.includes('sinFotoPerfil.png')
        ) {
            this.modalSinFotoAbierto = true;
            return;
        }

        window.open(foto, '_blank', 'noopener');
    }

    cerrarSesion(): void {
        this.constructorService
            .cerrarSesion()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    const abreviacion = (
                        this.perfil?.abreviacion ||
                        sessionStorage.getItem(
                            'institucionAbreviacion',
                        ) ||
                        ''
                    )
                        .trim()
                        .toLowerCase();

                    sessionStorage.removeItem(
                        'institucionAbreviacion',
                    );

                    this.router.navigate(
                        abreviacion
                            ? ['/login', abreviacion]
                            : ['/inicio'],
                        { replaceUrl: true },
                    );
                },
                error: (error) => {
                    this.mostrarError(error);
                },
            });
    }

    usarFotoPredeterminada(event: Event): void {
        const imagen =
            event.target as HTMLImageElement;

        if (
            !imagen.src.endsWith(
                this.FOTO_PERFIL_PREDETERMINADA,
            )
        ) {
            imagen.src =
                this.FOTO_PERFIL_PREDETERMINADA;
        }
    }

    get fotoPerfil(): string {
        const fotoUrl =
            this.perfil?.fotoUrl?.trim();

        if (
            !fotoUrl ||
            fotoUrl.toLowerCase() === 'null' ||
            fotoUrl.toLowerCase() === 'undefined' ||
            fotoUrl.includes('sinFotoPerfil.png')
        ) {
            return this.FOTO_PERFIL_PREDETERMINADA;
        }

        const url =
            this.constructorService
                .resolverRecurso(fotoUrl);
        const separador =
            url.includes('?') ? '&' : '?';

        return `${url}${separador}v=${this.versionFotoPerfil}`;
    }

    get logoEmpresa(): string {
        const logoUrl =
            this.perfil?.logoEmpresa?.trim();

        const logoInvalido =
            !logoUrl ||
            logoUrl.toLowerCase() === 'null' ||
            logoUrl.toLowerCase() === 'undefined';

        if (!logoInvalido) {
            return this.constructorService
                .resolverRecurso(logoUrl);
        }

        return this.obtenerLogoAlternativo();
    }

    private obtenerLogoAlternativo(): string {
        const abreviacion =
            this.perfil?.abreviacion?.trim() ||
            sessionStorage
                .getItem('institucionAbreviacion')
                ?.trim() ||
            'SEPROC';

        return `https://ui-avatars.com/api/?name=${encodeURIComponent(abreviacion)}&background=155093&color=fff`;
    }

    usarLogoAlternativo(event: Event): void {
        const imagen =
            event.target as HTMLImageElement;

        if (
            imagen.dataset['logoAlternativo'] ===
            'true'
        ) {
            return;
        }

        imagen.dataset['logoAlternativo'] = 'true';
        imagen.src = this.obtenerLogoAlternativo();
    }

    recurso(url?: string | null): string {
        return this.constructorService
            .resolverRecurso(url);
    }

    claseEstadoGeneral(
        estado?: string,
    ): string {
        switch (estado?.toUpperCase()) {
            case 'ACTIVO':
                return 'dot-aprobada';

            case 'FINALIZADO':
                return 'dot-rechazada';

            default:
                return 'dot-pendiente';
        }
    }

    private normalizar(
        valor?: string | null,
    ): string {
        return (valor ?? '')
            .trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }

    private obtenerMensajeError(
        error: unknown,
    ): string {
        const httpError =
            error as HttpErrorResponse;

        if (typeof httpError?.error === 'string') {
            return httpError.error;
        }

        if (httpError?.error?.mensaje) {
            return httpError.error.mensaje;
        }

        if (httpError?.error?.message) {
            return httpError.error.message;
        }

        if (httpError?.message) {
            return httpError.message;
        }

        return 'No fue posible completar la operación.';
    }

    private mostrarError(error: unknown): void {
        this.notificar(
            this.obtenerMensajeError(error),
            'error',
        );
    }

    private notificar(
        mensaje: string,
        tipo: 'success' | 'error',
    ): void {
        this.mensaje = mensaje;
        this.tipoMensaje = tipo;
        this.cdr.markForCheck();

        window.setTimeout(() => {
            if (this.mensaje === mensaje) {
                this.mensaje = '';
                this.cdr.markForCheck();
            }
        }, 5000);
    }
}