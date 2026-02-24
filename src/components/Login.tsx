"use client";

import React, { useState } from 'react';
import { auth, provider, signInWithPopup } from '@/lib/firebase';
import * as LucideIcons from 'lucide-react';

const Icon = ({ name, size = 18, className = "" }: { name: string, size?: number, className?: string }) => {
    const LucideIcon = (LucideIcons as any)[name];
    if (!LucideIcon) return null;
    return <LucideIcon size={size} className={className} />;
};

export default function Login() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async () => {
        setIsLoading(true);
        setError('');
        try {
            await signInWithPopup(auth, provider);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'ログイン中にエラーが発生しました。');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen text-[#5D4037] bg-[#FDF8F6] flex flex-col items-center justify-center p-4">
            <div className="bg-white/80 backdrop-blur-md border border-[#EAD7D1] rounded-[2rem] p-8 md:p-12 w-full max-w-md shadow-2xl text-center">
                <div className="w-16 h-16 bg-[#D9826C] rounded-full flex items-center justify-center text-white shadow-sm mx-auto mb-6">
                    <Icon name="Sparkles" size={32} />
                </div>
                <h1 className="text-3xl font-serif font-bold text-[#A64B35] tracking-widest mb-2">ammiyu</h1>
                <p className="text-sm text-[#A64B35]/60 mb-8">顧客管理システムにログイン</p>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 text-left">
                        {error}
                        <div className="mt-2 text-xs opacity-80">
                            ※Firebaseの設定（.env.local）が正しく行われているか確認してください。
                        </div>
                    </div>
                )}

                <button
                    onClick={handleLogin}
                    disabled={isLoading}
                    className="w-full bg-white border-2 border-[#EAD7D1] text-[#A64B35] hover:border-[#D9826C] hover:bg-[#FDF8F6] px-6 py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-sm active:scale-95 text-base font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <>
                            <Icon name="Loader2" className="animate-spin" size={20} />
                            ログイン中...
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Googleでログイン
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
