'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Loader2 } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const router = useRouter();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                alert('¡Cuenta creada! Revisa tu correo o inicia sesión.');
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                router.push('/');
                router.refresh();
            }
        } catch (error: any) {
            setErrorMsg(error.message || 'Error de autenticación');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
                <div className="mb-8 text-center">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-blue-200">
                        <Lock className="text-white" size={24} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800">
                        {isSignUp ? 'Crear Cuenta' : 'Bienvenido'}
                    </h1>
                    <p className="text-slate-400 text-sm mt-2">
                        {isSignUp ? 'Gestiona tu negocio inteligente' : 'Ingresa para ver tu inventario'}
                    </p>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1 ml-1">EMAIL</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-700"
                                placeholder="tu@email.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1 ml-1">CONTRASEÑA</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-700"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {errorMsg && (
                        <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg font-medium">
                            {errorMsg}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-200 active:scale-[0.98] transition-all flex justify-center items-center gap-2"
                    >
                        {loading ? <Loader2 size={20} className="animate-spin" /> :
                            (isSignUp ? 'Registrarse' : 'Ingresar')
                        }
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="text-xs text-slate-500 hover:text-blue-600 font-medium transition-colors"
                    >
                        {isSignUp ? '¿Ya tienes cuenta? Ingresa aquí' : '¿Nuevo usuario? Crea una cuenta'}
                    </button>
                </div>
            </div>
        </div>
    );
}
