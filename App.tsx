
import React, { useState, useCallback } from 'react';
import { ConversionType } from './types';
import { getConversionExplanation } from './services/geminiService';

declare global {
    interface Window {
        marked: {
            parse(markdownString: string): string;
        };
    }
}

const Header: React.FC = () => (
    <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">
            Convertidor de Sistemas Numéricos
        </h1>
        <p className="text-gray-400 mt-2 text-lg">
            Ingresa un número decimal y obtén la conversión junto a una explicación detallada.
        </p>
    </div>
);

const ConversionButton: React.FC<{
    type: ConversionType;
    label: string;
    currentType: ConversionType;
    setType: (type: ConversionType) => void;
}> = ({ type, label, currentType, setType }) => {
    const isActive = type === currentType;
    return (
        <button
            type="button"
            onClick={() => setType(type)}
            className={`flex-1 px-4 py-3 text-sm md:text-base font-semibold rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-teal-400
                ${isActive
                    ? 'bg-teal-500 text-white shadow-lg'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
        >
            {label}
        </button>
    );
};

const LoadingSpinner: React.FC = () => (
    <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400"></div>
    </div>
);

const ResultDisplay: React.FC<{
    result: string;
    explanation: string | null;
    isLoading: boolean;
    error: string | null;
    conversionType: ConversionType;
}> = ({ result, explanation, isLoading, error, conversionType }) => {
    
    const createMarkup = (htmlContent: string) => {
        return { __html: htmlContent };
    };

    const parsedExplanation = explanation ? window.marked.parse(explanation) : '';

    return (
        <div className="mt-8 bg-gray-800 rounded-lg shadow-2xl p-6 w-full animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-100 mb-4">Resultado</h2>
            <div className="bg-gray-900 rounded-md p-4 flex items-center justify-between">
                <span className="text-2xl md:text-3xl font-mono text-teal-400 break-all">{result}</span>
                <span className="text-sm font-semibold text-gray-400 bg-gray-700 px-3 py-1 rounded-full">{conversionType}</span>
            </div>
            
            <div className="mt-6 border-t border-gray-700 pt-6">
                 <h3 className="text-xl font-bold text-gray-100 mb-2">Proceso de Conversión</h3>
                 {isLoading && <LoadingSpinner />}
                 {error && <p className="text-red-400 bg-red-900/50 p-3 rounded-md">{error}</p>}
                 {explanation && (
                    <div 
                        className="prose prose-invert prose-p:text-gray-300 prose-headings:text-teal-400 prose-strong:text-white prose-code:text-yellow-400 prose-code:bg-gray-700 prose-code:rounded-sm prose-code:px-1 prose-code:py-0.5"
                        dangerouslySetInnerHTML={createMarkup(parsedExplanation)}
                    />
                 )}
            </div>
        </div>
    );
};


export default function App() {
    const [decimalInput, setDecimalInput] = useState<string>('');
    const [conversionType, setConversionType] = useState<ConversionType>('binary');
    const [result, setResult] = useState<string | null>(null);
    const [explanation, setExplanation] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [inputError, setInputError] = useState<string | null>(null);

    const handleConversion = useCallback(async () => {
        setResult(null);
        setExplanation(null);
        setError(null);
        setInputError(null);

        if (!decimalInput.trim()) {
            setInputError('Por favor, ingresa un número decimal.');
            return;
        }
        
        const decimalValue = parseInt(decimalInput, 10);

        if (isNaN(decimalValue)) {
            setInputError('El valor ingresado no es un número válido.');
            return;
        }

        if (decimalValue < 0) {
            setInputError('Por favor, ingresa un número positivo.');
            return;
        }

        setIsLoading(true);

        try {
            let convertedValue: string;
            switch (conversionType) {
                case 'binary':
                    convertedValue = decimalValue.toString(2);
                    break;
                case 'hexadecimal':
                    convertedValue = decimalValue.toString(16).toUpperCase();
                    break;
                case 'octal':
                    convertedValue = decimalValue.toString(8);
                    break;
            }
            setResult(convertedValue);
            
            // Fetch explanation from Gemini
            const geminiExplanation = await getConversionExplanation(String(decimalValue), conversionType);
            setExplanation(geminiExplanation);

        } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : "Ocurrió un error inesperado.";
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [decimalInput, conversionType]);
    
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        handleConversion();
    };

    return (
        <main className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 font-sans">
            <div className="w-full max-w-2xl mx-auto">
                <Header />
                <div className="bg-gray-800 rounded-lg shadow-2xl p-6">
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label htmlFor="decimal-input" className="block text-sm font-medium text-gray-300 mb-2">
                                Número Decimal
                            </label>
                            <input
                                id="decimal-input"
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={decimalInput}
                                onChange={(e) => setDecimalInput(e.target.value)}
                                placeholder="Ej: 25"
                                className="w-full bg-gray-900 border-2 border-gray-700 text-white rounded-md p-3 focus:border-teal-400 focus:ring-teal-400 transition-colors duration-200 text-lg"
                            />
                            {inputError && <p className="text-red-400 text-sm mt-2">{inputError}</p>}
                        </div>

                        <div className="mb-6">
                             <label className="block text-sm font-medium text-gray-300 mb-2">
                                Convertir a:
                            </label>
                            <div className="flex space-x-2 md:space-x-4">
                                <ConversionButton type="binary" label="Binario" currentType={conversionType} setType={setConversionType} />
                                <ConversionButton type="hexadecimal" label="Hexadecimal" currentType={conversionType} setType={setConversionType} />
                                <ConversionButton type="octal" label="Octal" currentType={conversionType} setType={setConversionType} />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-teal-500 to-blue-600 text-white font-bold py-3 px-4 rounded-md hover:from-teal-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Convirtiendo...
                                </>
                            ) : (
                                'Convertir'
                            )}
                        </button>
                    </form>
                </div>
                
                {result && (
                  <ResultDisplay 
                    result={result} 
                    explanation={explanation} 
                    isLoading={isLoading && !explanation}
                    error={error}
                    conversionType={conversionType}
                  />
                )}
            </div>
             <style jsx>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.5s ease-out forwards;
                }
            `}</style>
        </main>
    );
}
