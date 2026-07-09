import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';

export async function GET() {
    try {
        // Ejecutamos una consulta ultra ligera para "despertar" o "mantener viva" la base de datos de Supabase.
        // Limitamos a 1 solo registro para que no consuma ancho de banda ni recursos.
        const { data, error } = await supabase.from('platform').select('id').limit(1);

        if (error) {
            console.error("Ping Error:", error);
            return NextResponse.json(
                { status: 'error', message: 'Failed to ping database', details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            status: 'success',
            message: 'Supabase is awake!',
            timestamp: new Date().toISOString()
        });
    } catch (err: any) {
        return NextResponse.json(
            { status: 'error', message: 'Unexpected error', details: err.message },
            { status: 500 }
        );
    }
}
