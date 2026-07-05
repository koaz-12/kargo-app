'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { LogOut, Settings as SettingsIcon, Loader2, Wallet, Box, Tags, User, Camera } from 'lucide-react';
import { toast } from 'sonner';

// Extracted sub-components
import PlatformSettings from '../../components/settings/PlatformSettings';
import CourierSettings from '../../components/settings/CourierSettings';
import StorageLocationSettings from '../../components/settings/StorageLocationSettings';
import AdjustmentTypeSettings from '../../components/settings/AdjustmentTypeSettings';
import AccountSettings from '../../components/settings/AccountSettings';
import FinancialDefaults from '../../components/settings/FinancialDefaults';
import ThemeToggle from '../../components/settings/ThemeToggle';

export default function SettingsPage() {
    const [email, setEmail] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [debouncedName, setDebouncedName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('general');
    const router = useRouter();

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                if (user.email) setEmail(user.email);
                const { data } = await supabase.from('user_preferences')
                    .select('display_name, avatar_url')
                    .eq('user_id', user.id)
                    .single();
                if (data) {
                    if (data.display_name) {
                        setDisplayName(data.display_name);
                        setDebouncedName(data.display_name);
                    }
                    if (data.avatar_url) {
                        setAvatarUrl(data.avatar_url);
                    }
                }
                setIsLoading(false);
            }
        };
        getUser();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (displayName !== debouncedName) {
                setDebouncedName(displayName);
                const save = async () => {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        await supabase.from('user_preferences').upsert({
                            user_id: user.id,
                            display_name: displayName
                        });
                    }
                };
                save();
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [displayName, debouncedName]);

    const handleDisplayNameChange = (val: string) => {
        setDisplayName(val);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setIsUploading(true);
            if (!event.target.files || event.target.files.length === 0) {
                return;
            }
            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user');

            const filePath = `${user.id}/avatar-${Math.random()}.${fileExt}`;

            // Upload image to supabase storage
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { upsert: true });

            if (uploadError) {
                throw uploadError;
            }

            // Get public url
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            // Update user_preferences
            const { error: updateError } = await supabase.from('user_preferences').upsert({
                user_id: user.id,
                avatar_url: publicUrl
            });

            if (updateError) throw updateError;

            setAvatarUrl(publicUrl);
            toast.success('Foto de perfil actualizada');
        } catch (error: any) {
            console.error('Error uploading avatar:', error.message);
            toast.error('Error al subir la imagen. Verifica que creaste el bucket en Supabase.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto pb-24 bg-slate-50 dark:bg-slate-950 min-h-screen">
            <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl px-5 py-4 sticky top-0 z-20 border-b border-slate-200/50 dark:border-slate-800/50 flex items-center gap-3 shadow-[0_2px_20px_rgb(0,0,0,0.02)] mb-6">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <SettingsIcon size={20} strokeWidth={2.5} />
                </div>
                <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Ajustes Generales</h1>
            </header>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <Loader2 className="animate-spin mb-4" size={32} />
                    <p className="text-sm font-bold">Cargando perfil...</p>
                </div>
            ) : (
                <div className="space-y-6 px-4">
                    {/* User Profile Section */}
                    <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 mb-6 flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                            <div className="relative group">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Avatar" className="w-16 h-16 rounded-2xl object-cover shadow-lg shadow-indigo-200" />
                                ) : (
                                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-200 flex items-center justify-center text-white font-black text-2xl">
                                        {email.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <label className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                                    {isUploading ? <Loader2 className="animate-spin text-white" size={20} /> : <Camera className="text-white" size={20} />}
                                    <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" disabled={isUploading} />
                                </label>
                            </div>
                            <div className="flex-1">
                                <p className="font-black text-slate-800 text-lg">Mi Perfil</p>
                                <p className="text-sm text-slate-500 font-medium">{email}</p>
                            </div>
                        </div>
                        <div className="mt-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Nombre a Mostrar</label>
                            <input
                                type="text"
                                placeholder="Tu Nombre (ej. Boss)"
                                value={displayName}
                                onChange={(e) => handleDisplayNameChange(e.target.value)}
                                className="w-full text-sm font-semibold border border-slate-200/60 bg-slate-50/50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex bg-slate-200/50 p-1.5 rounded-2xl gap-1 mb-4 overflow-x-auto hide-scrollbar">
                        <button
                            onClick={() => setActiveTab('general')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'general' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Wallet size={16} /> Finanzas
                        </button>
                        <button
                            onClick={() => setActiveTab('inventory')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'inventory' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Box size={16} /> Inventario
                        </button>
                        <button
                            onClick={() => setActiveTab('catalog')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'catalog' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Tags size={16} /> Catálogo
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="min-h-[300px]">
                        {activeTab === 'general' && (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <ThemeToggle />
                                <AccountSettings />
                                <FinancialDefaults />
                            </div>
                        )}
                        {activeTab === 'inventory' && (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <StorageLocationSettings />
                                <CourierSettings />
                                <AdjustmentTypeSettings />
                            </div>
                        )}
                        {activeTab === 'catalog' && (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <PlatformSettings />
                            </div>
                        )}
                    </div>

                    {/* Logout */}
                    <div className="pt-8">
                        <button
                            onClick={handleLogout}
                            className="w-full bg-red-50 text-red-600 font-bold py-4 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                        >
                            <LogOut size={18} strokeWidth={2.5} />
                            <span>Cerrar Sesión</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
