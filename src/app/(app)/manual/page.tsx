'use client';

import { useState } from 'react';

interface Section {
    heading: string;
    content: string | React.ReactNode;
}

interface AccordionItem {
    title: string;
    subtitle?: string;
    icon: React.ReactNode;
    sections: Section[];
}

function Accordion({ item }: { item: AccordionItem }) {
    const [open, setOpen] = useState(false);

    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-gray-50 transition-colors text-left"
            >
                <div className="flex items-center gap-3">
                    <span className="text-indigo-600">{item.icon}</span>
                    <div>
                        <span className="font-semibold text-gray-800 text-base">{item.title}</span>
                        {item.subtitle && (
                            <p className="text-xs text-gray-400 mt-0.5">{item.subtitle}</p>
                        )}
                    </div>
                </div>
                <svg
                    className={`w-5 h-5 text-gray-400 transition-transform duration-200 flex-shrink-0 ${open ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {open && (
                <div className="bg-gray-50 border-t border-gray-200 divide-y divide-gray-100">
                    {item.sections.map((section, i) => (
                        <div key={i} className="px-6 py-4">
                            <h3 className="text-xs font-semibold text-indigo-700 uppercase tracking-wider mb-2">
                                {section.heading}
                            </h3>
                            <div className="text-sm text-gray-600 leading-relaxed">
                                {section.content}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function Steps({ items }: { items: string[] }) {
    return (
        <ol className="list-decimal list-inside space-y-1">
            {items.map((item, i) => (
                <li key={i} dangerouslySetInnerHTML={{ __html: item }} />
            ))}
        </ol>
    );
}

function Pills({ items }: { items: { label: string; color: string; desc: string }[] }) {
    return (
        <ul className="space-y-1.5">
            {items.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                    <span className={`inline-block mt-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${item.color}`}>
                        {item.label}
                    </span>
                    <span>{item.desc}</span>
                </li>
            ))}
        </ul>
    );
}

const MANUAL_ITEMS: AccordionItem[] = [
    {
        title: 'Cotizaciones',
        subtitle: 'Presupuestos para clientes antes de confirmar pedidos',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
        ),
        sections: [
            {
                heading: '¿Cuándo usarlo?',
                content: 'Cuando un cliente solicita un presupuesto antes de confirmar un pedido. Es el primer paso del ciclo de venta: cotizás, el cliente aprueba, y luego convertís la cotización en un pedido.'
            },
            {
                heading: 'Cómo crear una cotización',
                content: <Steps items={[
                    'Ir a <strong>Cotizaciones → Nueva cotización</strong>.',
                    'Seleccionar el cliente, provincia y vendedor asignado.',
                    'Agregar los productos con cantidad y precio unitario.',
                    'Revisar el total y guardar.',
                ]} />
            },
            {
                heading: 'Estados posibles',
                content: <Pills items={[
                    { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700', desc: 'Cotización enviada, esperando respuesta del cliente.' },
                    { label: 'Aprobada', color: 'bg-green-100 text-green-700', desc: 'El cliente confirmó. Lista para convertir en pedido.' },
                    { label: 'Rechazada', color: 'bg-red-100 text-red-700', desc: 'El cliente no aceptó la cotización.' },
                    { label: 'Convertida', color: 'bg-blue-100 text-blue-700', desc: 'Ya fue transformada en un pedido activo.' },
                ]} />
            },
            {
                heading: 'Convertir a pedido',
                content: 'Desde el detalle de una cotización aprobada, hacé clic en "Convertir a pedido". El sistema crea automáticamente el pedido con todos los ítems y precios. La cotización queda marcada como Convertida.'
            },
            {
                heading: 'PDF',
                content: 'Cada cotización tiene un botón para generar el PDF con membrete de Liderplast. Podés descargarlo y enviárselo directamente al cliente.'
            },
        ]
    },
    {
        title: 'Pedidos',
        subtitle: 'Gestión completa del ciclo de venta confirmado',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        ),
        sections: [
            {
                heading: '¿Cuándo usarlo?',
                content: 'Cuando el cliente ya confirmó la compra. Un pedido puede crearse directamente o surgir de una cotización aprobada. Desde acá se gestiona toda la operación: producción, flete y entrega.'
            },
            {
                heading: 'Vistas disponibles',
                content: (
                    <ul className="space-y-1">
                        <li><strong>Kanban</strong> — vista por columnas de estado, ideal para seguimiento visual del flujo.</li>
                        <li><strong>Lista</strong> — vista tabular, útil para buscar, filtrar y exportar.</li>
                        <li><strong>Archivados</strong> — pedidos completados o cancelados que ya no están en el flujo activo.</li>
                    </ul>
                )
            },
            {
                heading: 'Estados del pedido',
                content: <Pills items={[
                    { label: 'Pendiente', color: 'bg-gray-100 text-gray-600', desc: 'Pedido recibido, aún sin procesar.' },
                    { label: 'En producción', color: 'bg-yellow-100 text-yellow-700', desc: 'Los productos están siendo fabricados.' },
                    { label: 'Listo', color: 'bg-blue-100 text-blue-700', desc: 'Producción terminada, esperando ser despachado.' },
                    { label: 'En ruta', color: 'bg-purple-100 text-purple-700', desc: 'Asignado a un flete, en camino al cliente.' },
                    { label: 'Entregado', color: 'bg-green-100 text-green-700', desc: 'Confirmado como entregado.' },
                    { label: 'Archivado', color: 'bg-gray-100 text-gray-500', desc: 'Cerrado y fuera del flujo activo.' },
                ]} />
            },
            {
                heading: 'Remito',
                content: 'Desde el detalle de un pedido entregado o en ruta podés generar el remito en PDF para la entrega física al cliente.'
            },
            {
                heading: 'Archivados',
                content: 'Los pedidos archivados se encuentran en Pedidos → Archivados. No se pueden modificar, solo consultar. Archivá un pedido cuando ya fue completamente cerrado y no necesita seguimiento.'
            },
        ]
    },
    {
        title: 'Fletes',
        subtitle: 'Planificación y seguimiento de viajes de entrega',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h8m-8 4h8m-8 4h4M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
            </svg>
        ),
        sections: [
            {
                heading: '¿Cuándo usarlo?',
                content: 'Cuando hay pedidos listos para despachar y necesitás organizar un viaje. Acá planificás qué camión va, qué chofer lo lleva, a qué provincia, y qué pedidos lleva ese viaje.'
            },
            {
                heading: 'Cómo crear un flete',
                content: <Steps items={[
                    'Ir a <strong>Fletes → Nuevo flete</strong>.',
                    'Seleccionar vehículo, chofer y provincia de destino.',
                    'Asignar los pedidos que forman parte del viaje.',
                    'Guardar. El flete queda en estado Planificado.',
                ]} />
            },
            {
                heading: 'Estados del flete',
                content: <Pills items={[
                    { label: 'Planificado', color: 'bg-yellow-100 text-yellow-700', desc: 'Viaje organizado, aún no salió.' },
                    { label: 'En ruta', color: 'bg-blue-100 text-blue-700', desc: 'El camión ya salió hacia el destino.' },
                    { label: 'Entregado', color: 'bg-green-100 text-green-700', desc: 'Todos los pedidos del viaje fueron entregados.' },
                ]} />
            },
            {
                heading: 'Hoja de ruta',
                content: 'Desde el detalle de un flete podés generar la hoja de ruta en PDF para el chofer. Incluye los pedidos, cliente y dirección de entrega.'
            },
        ]
    },
    {
        title: 'Inventario — Stock',
        subtitle: 'Control de materias primas, insumos y productos terminados',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
        ),
        sections: [
            {
                heading: '¿Cuándo usarlo?',
                content: 'Para ver el estado actual del stock de cada ítem. Acá se visualizan materias primas, insumos y productos terminados con su stock actual, mínimo y costo.'
            },
            {
                heading: 'Tipos de ítems',
                content: (
                    <ul className="space-y-1">
                        <li><strong>Materia prima</strong> — insumos principales para producción (ej: resinas, pigmentos).</li>
                        <li><strong>Insumo</strong> — materiales auxiliares (ej: bolsas, etiquetas).</li>
                        <li><strong>Producto final</strong> — artículos terminados listos para vender.</li>
                    </ul>
                )
            },
            {
                heading: 'Alertas de stock bajo',
                content: 'Cuando el stock de un ítem cae por debajo del mínimo configurado, aparece una alerta visual en el sidebar (número rojo). Revisá el inventario y generá una compra si es necesario.'
            },
            {
                heading: 'Ajuste manual de stock',
                content: 'Si necesitás corregir una diferencia de inventario, podés registrar un movimiento manual desde Inventario → Movimientos, seleccionando el ítem y la cantidad a agregar o descontar.'
            },
        ]
    },
    {
        title: 'Inventario — Movimientos',
        subtitle: 'Historial de entradas y salidas de stock',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
        ),
        sections: [
            {
                heading: '¿Cuándo usarlo?',
                content: 'Para auditar por qué cambió el stock de un ítem. Cada producción, compra o ajuste manual genera un movimiento registrado acá con fecha, tipo y usuario responsable.'
            },
            {
                heading: 'Tipos de movimiento',
                content: (
                    <ul className="space-y-1">
                        <li><strong>Entrada</strong> — ingreso de stock (compra, ajuste positivo).</li>
                        <li><strong>Salida</strong> — descuento de stock (consumo en producción, ajuste negativo).</li>
                        <li><strong>Producción</strong> — generado automáticamente al registrar una producción.</li>
                    </ul>
                )
            },
            {
                heading: 'Movimiento manual',
                content: <Steps items={[
                    'Ir a <strong>Inventario → Movimientos → Nuevo movimiento</strong>.',
                    'Seleccionar el ítem y el tipo (entrada o salida).',
                    'Ingresar la cantidad y opcionalmente una observación.',
                    'Confirmar. El stock se actualiza de inmediato.',
                ]} />
            },
        ]
    },
    {
        title: 'Inventario — Compras',
        subtitle: 'Registro de órdenes de compra a proveedores',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
        ),
        sections: [
            {
                heading: '¿Cuándo usarlo?',
                content: 'Cuando comprás materiales a un proveedor. Registrar la compra acá actualiza automáticamente el stock y genera el egreso correspondiente en Finanzas.'
            },
            {
                heading: 'Cómo registrar una compra',
                content: <Steps items={[
                    'Ir a <strong>Inventario → Compras → Nueva compra</strong>.',
                    'Seleccionar el proveedor y método de pago.',
                    'Agregar los ítems comprados con cantidad y costo unitario.',
                    'Confirmar. El stock se incrementa y se crea el egreso en Finanzas.',
                ]} />
            },
            {
                heading: 'Vinculación con Finanzas',
                content: 'Cada compra genera automáticamente un egreso en el módulo de Finanzas. Si el egreso ya existe, la compra muestra el estado del mismo. No es necesario cargarlo dos veces.'
            },
        ]
    },
    {
        title: 'Producción',
        subtitle: 'Registro de órdenes de fabricación y consumo de materiales',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        ),
        sections: [
            {
                heading: '¿Cuándo usarlo?',
                content: 'Cuando se fabrica un lote de productos. Al registrar una producción, el sistema descuenta automáticamente las materias primas e insumos según el BOM del producto e incrementa el stock del producto final.'
            },
            {
                heading: 'Prerequisito: BOM configurado',
                content: 'Para poder registrar una producción, el producto debe tener su BOM (lista de materiales) cargado. Si el producto no aparece en el selector, verificá en Producción → BOM.'
            },
            {
                heading: 'Cómo registrar una producción',
                content: <Steps items={[
                    'Ir a <strong>Producción → Nueva producción</strong>.',
                    'Seleccionar el producto final a fabricar.',
                    'Ingresar la cantidad producida.',
                    'Confirmar. El sistema descuenta materiales y suma stock del producto.',
                ]} />
            },
            {
                heading: 'Reversión de producción',
                content: 'Si cometiste un error, podés revertir una producción desde su detalle. Esto devuelve los materiales al stock y descuenta el producto final. Solo disponible para producciones recientes.'
            },
        ]
    },
    {
        title: 'Producción — BOM',
        subtitle: 'Lista de materiales para cada producto',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
        ),
        sections: [
            {
                heading: '¿Qué es el BOM?',
                content: 'BOM (Bill of Materials) es la receta de un producto: define qué materiales y en qué cantidades se necesitan para fabricar una unidad. Sin BOM, no se puede registrar producción.'
            },
            {
                heading: 'Cómo cargar o editar un BOM',
                content: <Steps items={[
                    'Ir a <strong>Producción → BOM</strong>.',
                    'Seleccionar el producto final.',
                    'Agregar cada material (materia prima o insumo) con su cantidad por unidad.',
                    'Guardar. El BOM queda activo para futuras producciones.',
                ]} />
            },
            {
                heading: 'Impacto en costos',
                content: 'El BOM también alimenta el módulo de Costos. Cuando cambian los precios de los materiales, el costo estimado del producto se recalcula automáticamente en Producción → Costos.'
            },
        ]
    },
    {
        title: 'Producción — Costos',
        subtitle: 'Costo estimado de fabricación por producto',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
        ),
        sections: [
            {
                heading: '¿Cuándo usarlo?',
                content: 'Para conocer cuánto cuesta fabricar cada producto, basándose en el BOM y el costo promedio de los materiales. Usalo para tomar decisiones de precio y margen.'
            },
            {
                heading: '¿Cómo se calcula?',
                content: 'El sistema multiplica la cantidad de cada material del BOM por su costo promedio registrado en Inventario. El resultado es el costo de fabricación estimado por unidad.'
            },
            {
                heading: 'Cuándo se desactualiza',
                content: 'Si compraste materiales a un precio diferente y actualizaste el costo en Inventario, el costo estimado se actualiza automáticamente la próxima vez que abrís la página de Costos.'
            },
        ]
    },
    {
        title: 'Producción — Rendimiento',
        subtitle: 'Estadísticas históricas de producción',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
        ),
        sections: [
            {
                heading: '¿Cuándo usarlo?',
                content: 'Para analizar cuánto se produjo por período, qué productos se fabricaron más y cómo evolucionó la producción en el tiempo. Útil para planificación y revisiones mensuales.'
            },
            {
                heading: '¿Qué muestra?',
                content: (
                    <ul className="space-y-1">
                        <li>Unidades producidas por producto y período.</li>
                        <li>Comparativa de producción entre meses.</li>
                        <li>Historial de todos los lotes registrados.</li>
                    </ul>
                )
            },
        ]
    },
    {
        title: 'Finanzas — Ingresos',
        subtitle: 'Registro de entradas de dinero',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        sections: [
            {
                heading: '¿Cuándo usarlo?',
                content: 'Para registrar cobros de clientes u otras entradas de dinero que no sean ventas directas. Cada ingreso se asocia a una categoría, subcategoría y método de pago.'
            },
            {
                heading: 'Cómo registrar un ingreso',
                content: <Steps items={[
                    'Ir a <strong>Finanzas → Ingresos → Nuevo ingreso</strong>.',
                    'Completar fecha, monto, categoría y método de pago.',
                    'Opcionalmente agregar descripción o referencia.',
                    'Guardar. El ingreso queda registrado y afecta el saldo de Caja.',
                ]} />
            },
        ]
    },
    {
        title: 'Finanzas — Egresos',
        subtitle: 'Registro de salidas de dinero y gastos operativos',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
        ),
        sections: [
            {
                heading: '¿Cuándo usarlo?',
                content: 'Para registrar cualquier gasto de la empresa: servicios, sueldos, insumos, impuestos, etc. Los egresos generados por compras de inventario se crean automáticamente; los demás se cargan manualmente acá.'
            },
            {
                heading: 'Cómo registrar un egreso',
                content: <Steps items={[
                    'Ir a <strong>Finanzas → Egresos → Nuevo egreso</strong>.',
                    'Completar fecha de emisión y fecha de vencimiento.',
                    'Seleccionar proveedor, categoría, subcategoría y método de pago.',
                    'Ingresar el monto y guardar.',
                ]} />
            },
            {
                heading: 'Egresos de compras',
                content: 'Cuando registrás una compra en Inventario → Compras, el egreso se crea solo. No lo cargues de nuevo acá: aparecerá automáticamente vinculado a la orden de compra.'
            },
            {
                heading: 'Estados del egreso',
                content: <Pills items={[
                    { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700', desc: 'Gasto registrado pero aún no pagado.' },
                    { label: 'Pagado', color: 'bg-green-100 text-green-700', desc: 'El pago fue efectuado.' },
                    { label: 'Anulado', color: 'bg-red-100 text-red-700', desc: 'Egreso cancelado, no afecta el saldo.' },
                ]} />
            },
        ]
    },
    {
        title: 'Finanzas — Caja',
        subtitle: 'Saldo por cuenta y movimientos entre cuentas',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
        ),
        sections: [
            {
                heading: '¿Cuándo usarlo?',
                content: 'Para ver el saldo actual de cada cuenta de pago (efectivo, banco, etc.) y registrar transferencias entre cuentas. Es la vista consolidada de la posición financiera del negocio.'
            },
            {
                heading: 'Transferencia entre cuentas',
                content: <Steps items={[
                    'Ir a <strong>Finanzas → Caja → Nueva transferencia</strong>.',
                    'Seleccionar cuenta de origen y cuenta de destino.',
                    'Ingresar el monto y la fecha.',
                    'Confirmar. Ambas cuentas se actualizan automáticamente.',
                ]} />
            },
            {
                heading: 'Relación con Ingresos y Egresos',
                content: 'El saldo de Caja es la suma de todos los ingresos menos todos los egresos pagados, más/menos las transferencias. No se carga manualmente: es el resultado de la operación registrada.'
            },
        ]
    },
];

const MODULE_GROUPS = [
    { label: 'Ventas', keys: ['Cotizaciones', 'Pedidos', 'Fletes'] },
    { label: 'Inventario', keys: ['Inventario — Stock', 'Inventario — Movimientos', 'Inventario — Compras'] },
    { label: 'Producción', keys: ['Producción', 'Producción — BOM', 'Producción — Costos', 'Producción — Rendimiento'] },
    { label: 'Finanzas', keys: ['Finanzas — Ingresos', 'Finanzas — Egresos', 'Finanzas — Caja'] },
];

export default function ManualPage() {
    return (
        <div className="p-8 max-w-3xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Manual de Uso</h1>
                <p className="text-gray-500 mt-1 text-sm">
                    Guía de referencia para cada módulo del sistema. Expandí cada sección para ver instrucciones detalladas.
                </p>
            </div>

            <div className="space-y-8">
                {MODULE_GROUPS.map((group) => {
                    const items = MANUAL_ITEMS.filter(i => group.keys.includes(i.title));
                    return (
                        <div key={group.label}>
                            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-1">
                                {group.label}
                            </h2>
                            <div className="space-y-2">
                                {items.map((item) => (
                                    <Accordion key={item.title} item={item} />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
