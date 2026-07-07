'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Users, UserPlus, Shield, ShieldCheck, Mail, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function TeamPage() {
    const [members, setMembers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [inviteEmail, setInviteEmail] = useState('');
    const [isInviting, setIsInviting] = useState(false);
    const [isOwner, setIsOwner] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        loadTeam();
    }, []);

    const loadTeam = async () => {
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }
            setUserId(user.id);

            // Fetch team members using the secure view
            const { data: teamData, error: teamError } = await supabase
                .from('workspace_team_view')
                .select('*')
                .order('role', { ascending: false });

            if (teamError) throw teamError;

            setMembers(teamData || []);

            // Check if current user is owner
            const currentUserRole = teamData?.find(m => m.user_id === user.id)?.role;
            setIsOwner(currentUserRole === 'owner');

        } catch (error: any) {
            console.error('Error loading team:', error);
            toast.error('Error al cargar el equipo');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail.trim()) return;

        setIsInviting(true);
        try {
            const { data, error } = await supabase.rpc('add_assistant_by_email', {
                target_email: inviteEmail.trim()
            });

            if (error) throw error;

            if (data.success) {
                toast.success(data.message);
                setInviteEmail('');
                loadTeam(); // Reload members list
            } else {
                toast.error(data.error);
            }
        } catch (error: any) {
            console.error('Invite error:', error);
            toast.error('Ocurrió un error al intentar agregar al asistente.');
        } finally {
            setIsInviting(false);
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        if (!confirm('¿Estás seguro de que deseas revocar el acceso a este asistente?')) return;

        try {
            const { error } = await supabase
                .from('workspace_members')
                .delete()
                .eq('id', memberId);

            if (error) throw error;

            toast.success('Asistente eliminado del equipo.');
            loadTeam();
        } catch (error: any) {
            console.error('Remove member error:', error);
            toast.error('No se pudo eliminar al asistente.');
        }
    };

    return (
        <div className="max-w-md mx-auto min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 relative">
            <header className="sticky top-0 z-20 pt-6 pb-4 pl-4 pr-16 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/50 flex items-center gap-3">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-900 rounded-full shadow-sm text-slate-700 active:scale-95 transition-transform"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none">Mi Equipo</h1>
                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">Gestión de Acceso</p>
                </div>
            </header>

            <div className="px-4 mt-6 space-y-6">
                {/* Invite Section (Only for Owners) */}
                {isOwner && (
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                <UserPlus size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800">Agregar Asistente</h3>
                                <p className="text-xs text-slate-500">Invita a alguien a tu espacio.</p>
                            </div>
                        </div>

                        <form onSubmit={handleInvite} className="flex gap-2">
                            <div className="relative flex-1">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail size={16} className="text-slate-400" />
                                </div>
                                <input
                                    type="email"
                                    placeholder="correo@ejemplo.com"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isInviting || !inviteEmail.trim()}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-xl font-bold text-sm shadow-md shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none flex items-center justify-center min-w-[80px]"
                            >
                                {isInviting ? <Loader2 size={18} className="animate-spin" /> : 'Invitar'}
                            </button>
                        </form>
                        <p className="text-[10px] text-slate-400 mt-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <strong>Nota:</strong> El asistente debe haberse registrado previamente en la aplicación para poder añadirlo a tu espacio.
                        </p>
                    </div>
                )}

                {/* Team List */}
                <div>
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3 px-1">
                        <Users size={16} className="text-slate-400" />
                        Miembros Actuales ({members.length})
                    </h3>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                            <Loader2 className="animate-spin mb-3" size={24} />
                            <p className="text-xs font-bold">Cargando equipo...</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {members.map((member) => (
                                <div key={member.member_record_id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg text-white shadow-inner
                                            ${member.role === 'owner' ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-gradient-to-br from-emerald-400 to-emerald-600'}`}>
                                            {member.email?.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm">
                                                {member.user_id === userId ? 'Tú' : member.email}
                                            </p>
                                            <div className="flex items-center gap-1 mt-0.5">
                                                {member.role === 'owner' ? (
                                                    <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                                                        <ShieldCheck size={12} /> PROPIETARIO
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                                                        <Shield size={12} /> ASISTENTE
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {isOwner && member.role !== 'owner' && (
                                        <button
                                            onClick={() => handleRemoveMember(member.member_record_id)}
                                            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors"
                                            title="Revocar Acceso"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
