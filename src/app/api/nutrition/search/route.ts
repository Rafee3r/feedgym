import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Comprehensive Mock Database
const FOOD_DATABASE = [
    { id: "1", name: "Huevo Cocido", calories: 78, protein: 6, carbs: 0.6, fats: 5, unit: "unidad", portion: 1 },
    { id: "2", name: "Pechuga de Pollo", calories: 165, protein: 31, carbs: 0, fats: 3.6, unit: "100g", portion: 100 },
    { id: "3", name: "Arroz Blanco Cocido", calories: 130, protein: 2.7, carbs: 28, fats: 0.3, unit: "100g", portion: 100 },
    { id: "4", name: "Avena", calories: 389, protein: 16.9, carbs: 66, fats: 6.9, unit: "100g", portion: 100 },
    { id: "5", name: "Plátano", calories: 89, protein: 1.1, carbs: 22.8, fats: 0.3, unit: "unidad", portion: 1 },
    { id: "6", name: "Manzana", calories: 52, protein: 0.3, carbs: 14, fats: 0.2, unit: "unidad", portion: 1 },
    { id: "7", name: "Leche Entera", calories: 61, protein: 3.2, carbs: 4.8, fats: 3.3, unit: "100ml", portion: 100 },
    { id: "8", name: "Pan Integral", calories: 250, protein: 13, carbs: 41, fats: 3, unit: "100g", portion: 100 },
    { id: "9", name: "Atún en Agua", calories: 116, protein: 26, carbs: 0, fats: 0.8, unit: "lata (100g)", portion: 100 },
    { id: "10", name: "Aguacate", calories: 160, protein: 2, carbs: 8.5, fats: 14.7, unit: "100g", portion: 100 },
    { id: "11", name: "Yogur Griego", calories: 59, protein: 10, carbs: 3.6, fats: 0.4, unit: "100g", portion: 100 },
    { id: "12", name: "Almentras", calories: 579, protein: 21, carbs: 22, fats: 50, unit: "100g", portion: 100 },
    { id: "13", name: "Carne Molida 5% Grasa", calories: 137, protein: 21, carbs: 0, fats: 5, unit: "100g", portion: 100 },
    { id: "14", name: "Papa Cocida", calories: 87, protein: 1.9, carbs: 20, fats: 0.1, unit: "100g", portion: 100 },
    { id: "15", name: "Brócoli", calories: 34, protein: 2.8, carbs: 6.6, fats: 0.4, unit: "100g", portion: 100 },
    { id: "16", name: "Aceite de Oliva", calories: 884, protein: 0, carbs: 0, fats: 100, unit: "100ml", portion: 100 },
    { id: "17", name: "Proteína Whey", calories: 120, protein: 24, carbs: 3, fats: 1, unit: "scoop (30g)", portion: 1 },
    { id: "18", name: "Queso Mozzarella", calories: 280, protein: 28, carbs: 3.1, fats: 17, unit: "100g", portion: 100 },
    { id: "19", name: "Pasta Cocida", calories: 131, protein: 5, carbs: 25, fats: 1.1, unit: "100g", portion: 100 },
    { id: "20", name: "Salmón", calories: 208, protein: 20, carbs: 0, fats: 13, unit: "100g", portion: 100 },
    { id: "21", name: "Lentejas Cocidas", calories: 116, protein: 9, carbs: 20, fats: 0.4, unit: "100g", portion: 100 },
    { id: "22", name: "Frijoles Negros", calories: 132, protein: 8.9, carbs: 23.7, fats: 0.5, unit: "100g", portion: 100 },
    { id: "23", name: "Tortilla de Maíz", calories: 52, protein: 1.4, carbs: 10.7, fats: 0.7, unit: "unidad", portion: 1 },
    { id: "24", name: "Espinacas", calories: 23, protein: 2.9, carbs: 3.6, fats: 0.4, unit: "100g", portion: 100 },
    { id: "25", name: "Zanahoria", calories: 41, protein: 0.9, carbs: 9.6, fats: 0.2, unit: "100g", portion: 100 },
];

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.toLowerCase();

    if (!query) {
        return NextResponse.json([]);
    }

    const results = FOOD_DATABASE.filter(item =>
        item.name.toLowerCase().includes(query)
    );

    return NextResponse.json(results);
}
