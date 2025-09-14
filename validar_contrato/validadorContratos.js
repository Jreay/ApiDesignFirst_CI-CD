const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Función para ejecutar todas las validaciones y generar el JSON
const runValidations = () => {
    let allValidationsPassed = true;
    const results = [];

    const generatedPath = path.join(__dirname, 'openapiGenerado.yaml');
    const mockupPath = path.join(__dirname, '../contrato/openapi.yaml');

    try {
        const generatedContract = yaml.load(fs.readFileSync(generatedPath, 'utf8'));
        const mockupContract = yaml.load(fs.readFileSync(mockupPath, 'utf8'));

        // VALIDACIÓN DE TAGS
        const tagsPassed = validateTags(generatedContract, mockupContract);
        results.push({"Tienen los mismos tags con la misma descripción": tagsPassed});
        if (!tagsPassed) allValidationsPassed = false;

        // VALIDACIÓN DE PATHS
        const pathsPassed = validatePaths(generatedContract, mockupContract);
        results.push({"Tienen los mismos paths": pathsPassed});
        if (!pathsPassed) allValidationsPassed = false;

        // VALIDACIÓN DE MÉTODOS
        const methodsPassed = validateMethods(generatedContract, mockupContract);
        results.push({"Tienen los mismos métodos para cada path": methodsPassed});
        if (!methodsPassed) allValidationsPassed = false;

        // VALIDACIÓN DE SUMMARIES
        const summariesPassed = validateSummaries(generatedContract, mockupContract);
        results.push({"Tienen los mismos summarys para cada path": summariesPassed});
        if (!summariesPassed) allValidationsPassed = false;

        // VALIDACIÓN DE PARÁMETROS
        const paramsPassed = validateParameters(generatedContract, mockupContract);
        results.push({"Tienen los mismos parámetros con las mismas propiedades": paramsPassed});
        if (!paramsPassed) allValidationsPassed = false;

    } catch (error) {
        console.error("Ocurrió un error al ejecutar las validaciones:", error);
        allValidationsPassed = false;
    }
    
    // Construir el objeto JSON final
    const finalResult = {
        "Validación de Contratos": allValidationsPassed,
        "Validaciones": results
    };

    // Guardar el resultado en un archivo JSON
    const filePath = path.join(__dirname, '../resultados/resultadoCompare.json');
    fs.writeFileSync(filePath, JSON.stringify(finalResult, null, 2), 'utf8');

    console.log("Validaciones completadas. Resultado guardado en 'resultadoCompare.json'");
    if (!allValidationsPassed) {
        process.exit(1);
    }
};

// --- FUNCIONES DE VALIDACIÓN ---
const validateTags = (generatedContract, mockupContract) => {
    const generatedTags = generatedContract.tags;
    const mockupTags = mockupContract.tags;
    if (generatedTags.length !== mockupTags.length) return false;
    for (const mockupTag of mockupTags) {
        const generatedTag = generatedTags.find(t => t.name === mockupTag.name);
        if (!generatedTag || generatedTag.description !== mockupTag.description) return false;
    }
    return true;
};

const validatePaths = (generatedContract, mockupContract) => {
    const generatedPaths = Object.keys(generatedContract.paths);
    const mockupPaths = Object.keys(mockupContract.paths);
    if (generatedPaths.length !== mockupPaths.length) return false;
    for (const path of mockupPaths) {
        if (!generatedPaths.includes(path)) return false;
    }
    return true;
};

const validateMethods = (generatedContract, mockupContract) => {
    for (const path in mockupContract.paths) {
        const mockupMethods = Object.keys(mockupContract.paths[path] || {}).sort();
        const generatedMethods = Object.keys(generatedContract.paths[path] || {}).sort();
        if (JSON.stringify(generatedMethods) !== JSON.stringify(mockupMethods)) return false;
    }
    return true;
};

const validateSummaries = (generatedContract, mockupContract) => {
    for (const path in mockupContract.paths) {
        for (const method in mockupContract.paths[path]) {
            const mockupSummary = mockupContract.paths[path][method].summary;
            const generatedSummary = generatedContract.paths[path][method].summary;
            if (generatedSummary !== mockupSummary) return false;
        }
    }
    return true;
};

const validateParameters = (generatedContract, mockupContract) => {
    for (const path in mockupContract.paths) {
        for (const method in mockupContract.paths[path]) {
            const mockupParams = mockupContract.paths[path][method].parameters || [];
            const generatedParams = generatedContract.paths[path][method].parameters || [];
            if (generatedParams.length !== mockupParams.length) return false;
            for (const mockupParam of mockupParams) {
                const generatedParam = generatedParams.find(p => p.name === mockupParam.name && p.in === mockupParam.in);
                if (!generatedParam ||
                    generatedParam.required !== mockupParam.required ||
                    (generatedParam.schema && generatedParam.schema.type) !== (mockupParam.schema && mockupParam.schema.type)) {
                    return false;
                }
            }
        }
    }
    return true;
};

// Ejecutar el proceso
runValidations();