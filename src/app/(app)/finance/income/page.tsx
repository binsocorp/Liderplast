import { PageHeader } from '@/components/ui/PageHeader';

export default function IncomePage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
            <div className="w-20 h-20 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Módulo de Ingresos</h1>
            <p className="text-gray-500 max-w-md">
                Esta sección se encuentra en construcción y será desarrollada en la próxima iteración del sistema financiero.
            </p>
        </div>
    );
}
