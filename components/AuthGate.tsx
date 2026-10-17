'use client';

import React, { useState } from 'react';
import { Lock, Mail, KeyRound, ShieldCheck, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AuthGateProps {
  onAuthenticated: () => void;
}

export const AuthGate: React.FC<AuthGateProps> = ({ onAuthenticated }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    if (!email.trim() || !password.trim()) {
      setErrorMsg('メールアドレスとパスワードを入力してください。');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('パスワードは6文字以上で入力してください。');
      return;
    }

    try {
      setIsLoading(true);
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setErrorMsg('メールアドレスまたはパスワードが正しくありません。（初回利用時は「初回アカウント作成」から登録してください）');
          } else if (error.message.includes('Email not confirmed')) {
            setErrorMsg('メール認証が完了していません。届いた確認メールのリンクを開くか、Supabase管理画面の Authentication > Users でアカウントを確認してください。');
          } else {
            setErrorMsg(`ログインエラー: ${error.message}`);
          }
          return;
        }
        if (data.session) {
          onAuthenticated();
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (error) {
          setErrorMsg(`登録エラー: ${error.message}`);
          return;
        }
        if (data.session) {
          onAuthenticated();
        } else {
          setInfoMsg(
            '確認メールを送信しました！メール内のリンクをクリックしてからログインしてください。（※メール確認を省略したい場合は、Supabaseの Authentication > Sign In / Providers > Email の「Confirm email」をOFFにすると即座にログインできます）'
          );
          setMode('login');
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || '通信エラーが発生しました。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] flex flex-col justify-center items-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-3xl bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/25 mx-auto mb-3 font-black text-3xl border-4 border-white">
            ¥
          </div>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">
            シンプル家計簿 クラウド
          </h1>
          <p className="text-xs text-slate-500 mt-1 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-orange-500" />
            <span>本人認証・RLS（行レベルセキュリティ）保護済み</span>
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-orange-200/70">
          <div className="grid grid-cols-2 p-1 bg-orange-50 rounded-2xl mb-6 border border-orange-100">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
                setInfoMsg(null);
              }}
              className={`py-2.5 rounded-xl text-xs font-extrabold transition-all ${
                mode === 'login'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-orange-600'
              }`}
            >
              ログイン
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMsg(null);
                setInfoMsg(null);
              }}
              className={`py-2.5 rounded-xl text-xs font-extrabold transition-all ${
                mode === 'signup'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-orange-600'
              }`}
            >
              初回アカウント作成
            </button>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {infoMsg && (
            <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{infoMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                メールアドレス
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                パスワード（6文字以上）
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-extrabold rounded-2xl shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-sm mt-2"
            >
              <Lock className="w-4 h-4" />
              <span>
                {isLoading
                  ? '認証処理中...'
                  : mode === 'login'
                  ? 'ログインする'
                  : '自分専用アカウントを登録する'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
