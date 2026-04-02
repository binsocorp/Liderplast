import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { AppProviders } from '@/components/layout/AppProviders';

export default async function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    const isAdmin = (profile as any)?.role === 'ADMIN';

    const { data: stockAlertItems } = await (supabase
        .from('inventory_items') as any)
        .select('current_stock, min_stock')
        .eq('is_active', true)
        .gt('min_stock', 0);

    const lowStockCount = (stockAlertItems as any[] | null)
        ?.filter((i: any) => Number(i.current_stock) < Number(i.min_stock)).length ?? 0;

    return (
        <AppProviders>
            <div className="flex h-screen overflow-hidden">
                <Sidebar isAdmin={isAdmin} lowStockCount={lowStockCount} />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <Header
                        userName={(profile as any)?.full_name || user.email || ''}
                        userRole={(profile as any)?.role || 'USER'}
                    />
                    <main className="flex-1 overflow-y-auto p-6 bg-gray-100">
                        {children}
                    </main>
                </div>
            </div>
        </AppProviders>
    );
}
