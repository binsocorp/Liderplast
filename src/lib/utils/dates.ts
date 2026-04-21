export function parseLocalDate(d: string): Date {
    const [y, m, day] = d.split('T')[0].split('-').map(Number);
    return new Date(y, m - 1, day);
}

export function formatLocalDate(d: string): string {
    return new Intl.DateTimeFormat('es-AR').format(parseLocalDate(d));
}

export function todayLocalString(): string {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
}

export function startOfMonthLocalString(): string {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-01`;
}
