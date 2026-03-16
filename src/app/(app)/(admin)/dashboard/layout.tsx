export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="max-w-[1600px] mx-auto">
            {children}
        </div>
    );
}
