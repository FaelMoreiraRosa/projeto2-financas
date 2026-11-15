const moedaBRL = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
});

export function formatCurrency(value) {
    const number = Number(value);
    return moedaBRL.format(Number.isFinite(number) ? number : 0);
}

export function formatDate(value) {
    if (!value) return '—';
    const [year, month, day] = String(value).slice(0, 10).split('-').map(Number);
    if (!year || !month || !day) return '—';

    return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(
        new Date(Date.UTC(year, month - 1, day))
    );
}

export function formatMonth(value) {
    const [year, month] = value.split('-').map(Number);
    return new Intl.DateTimeFormat('pt-BR', {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC'
    }).format(new Date(Date.UTC(year, month - 1, 1)));
}

export function monthRange(value) {
    const [year, month] = value.split('-').map(Number);
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    return { inicio: `${prefix}-01`, fim: `${prefix}-${String(lastDay).padStart(2, '0')}` };
}

export function currentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function todayISO() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
