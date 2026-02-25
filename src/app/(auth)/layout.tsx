export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white tracking-tight">Liderplast</h1>
                    <p className="text-primary-200 mt-1 text-sm">Sistema de Gestión</p>
                </div>
                {children}
            </div>
        </div>
    );
}
