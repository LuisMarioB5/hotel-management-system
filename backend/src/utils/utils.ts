export function parseIsActive (value: string): boolean | null {
    if (value === 'true' || value === 'Activo') return true;
    if (value === 'false' || value === 'Inactivo') return false;
    return null;
};
