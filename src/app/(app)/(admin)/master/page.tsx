import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';

const MASTER_SECTIONS = [
    { name: 'Provincias', href: '/master/provinces', description: 'Gestionar provincias y zonas vendibles', icon: '🗺️' },
    { name: 'Clientes', href: '/master/clients', description: 'Clientes de la empresa', icon: '👥' },
    { name: 'Vendedores', href: '/master/sellers', description: 'Vendedores internos y externos', icon: '🧑‍💼' },
    { name: 'Revendedores', href: '/master/resellers', description: 'Revendedores asociados', icon: '🤝' },
    { name: 'Proveedores', href: '/master/suppliers', description: 'Proveedores de materiales', icon: '🏭' },
    { name: 'Catálogo', href: '/master/catalog', description: 'Productos y servicios', icon: '📦' },
    { name: 'Precios', href: '/master/prices', description: 'Matriz de precios por provincia', icon: '💰' },
    { name: 'Instaladores', href: '/master/installers', description: 'Equipos de instalación', icon: '🔧' },
    { name: 'Tipos de Camión', href: '/master/truck-types', description: 'Tipos de camiones y capacidad', icon: '🚛' },
    { name: 'Fletes', href: '/master/fletes', description: 'Gestión de tipos de camión y fletes', icon: '🚚' },
];

export default function MasterDataPage() {
    return (
        <>
            <PageHeader title="Datos Maestros" subtitle="Administración de tablas de referencia" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {MASTER_SECTIONS.map((section) => (
                    <Link
                        key={section.href}
                        href={section.href}
                        className="bg-white rounded-xl border border-gray-200 p-5 hover:border-primary-300 hover:shadow-md transition-all group"
                    >
                        <div className="flex items-start gap-4">
                            <span className="text-2xl">{section.icon}</span>
                            <div>
                                <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                                    {section.name}
                                </h3>
                                <p className="text-sm text-gray-500 mt-0.5">{section.description}</p>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </>
    );
}
