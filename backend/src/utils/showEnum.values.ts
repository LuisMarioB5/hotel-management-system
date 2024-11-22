type EnumObject = { [key: string]: object };

// Función para construir el objeto con el nombre del enum y sus valores
export function getEnumValues(enumObjs: EnumObject): { [key: string]: string[] } {
    const result: { [key: string]: string[] } = {};

    for (const [enumName, enumObj] of Object.entries(enumObjs)) {
        const values = Object.keys(enumObj)
            .filter(key => isNaN(Number(key)))  // Filtrar las claves numéricas
            .map(key => enumObj[key as keyof typeof enumObj] as string); // Convertir a string
        result[enumName] = values;
    }

    return result;
}
