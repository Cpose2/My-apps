
import { GoogleGenAI } from "@google/genai";
import { ConversionType } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getBaseName = (type: ConversionType): string => {
    switch (type) {
        case 'binary': return 'Binario (base 2)';
        case 'hexadecimal': return 'Hexadecimal (base 16)';
        case 'octal': return 'Octal (base 8)';
    }
};

export async function getConversionExplanation(decimal: string, type: ConversionType): Promise<string> {
    const baseName = getBaseName(type);
    const prompt = `
        Eres un profesor de matemáticas experto en sistemas numéricos. Tu tarea es explicar de manera didáctica y paso a paso cómo convertir un número decimal a otra base.

        Número decimal a convertir: ${decimal}
        Base de destino: ${baseName}

        Instrucciones:
        1.  NO incluyas el resultado final en tu respuesta. El resultado ya fue calculado y se muestra por separado. Enfócate ÚNICAMENTE en la explicación detallada del proceso.
        2.  Utiliza un lenguaje claro, sencillo y amigable, como si se lo explicaras a un estudiante que ve el tema por primera vez.
        3.  Formatea tu respuesta usando Markdown. Utiliza encabezados, listas y texto en negrita para una mejor legibilidad.
        4.  Para conversiones a binario y octal, detalla el método de divisiones sucesivas. Muestra cada división (ej: \`25 ÷ 2 = 12\`), el cociente y el residuo. Explica explícitamente cómo se recolectan los residuos (de abajo hacia arriba) para formar el número final.
        5.  Para la conversión a hexadecimal, además de las divisiones sucesivas por 16, explica claramente cómo los residuos del 10 al 15 se convierten en las letras A, B, C, D, E y F. Incluye una pequeña tabla de referencia si es necesario.
        6.  Empieza directamente con la explicación. No agregues saludos ni introducciones como "Claro, aquí tienes la explicación" o "¡Por supuesto!".
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error fetching explanation from Gemini:", error);
        throw new Error("No se pudo generar la explicación. Por favor, inténtalo de nuevo.");
    }
}
