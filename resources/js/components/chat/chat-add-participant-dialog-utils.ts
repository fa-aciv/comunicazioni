import type { EmployeeSummary } from '@/components/chat/chat-types';

export const SEARCH_RESULT_LIMIT = 50;

export function formatEmployeeSecondaryText(employee: EmployeeSummary) {
    if (employee.department_name) {
        return `${employee.department_name} · ${employee.email}`;
    }

    return employee.email;
}

export function matchesEmployeeSearch(employee: EmployeeSummary, searchTerm: string) {
    return [employee.name, employee.email, employee.department_name ?? ''].some(
        (value) => value.toLowerCase().includes(searchTerm),
    );
}
