'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { Suspense } from 'react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });

    if (res?.error) {
      setError('Неверный email или пароль');
      setLoading(false);
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col" style={{
      backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(159, 172, 215, 0.15) 1px, transparent 0)',
      backgroundSize: '40px 40px'
    }}>
      <header className="w-full top-0 sticky bg-background border-b border-outline-variant flex justify-between items-center px-container-padding h-16 z-50">
        <div className="flex items-center gap-2">
          <span className="font-headline-md text-[32px] text-primary font-semibold">ScriptScribe</span>
        </div>
        <div className="hidden md:flex items-center gap-stack-lg">
          <nav className="flex gap-stack-md">
            <a className="font-label-caps text-[12px] text-on-surface-variant hover:text-primary transition-colors" href="#">ВОЗМОЖНОСТИ</a>
            <a className="font-label-caps text-[12px] text-on-surface-variant hover:text-primary transition-colors" href="#">ЦЕНЫ</a>
          </nav>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center px-container-padding py-stack-lg">
        <div className="max-w-[440px] w-full flex flex-col gap-stack-lg">
          <div className="flex flex-col items-center text-center gap-stack-sm mb-stack-md">
            <div className="w-16 h-16 bg-primary-container rounded-full flex items-center justify-center mb-stack-sm shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-on-primary-container text-[32px]">auto_stories</span>
            </div>
            <h1 className="font-headline-md text-[32px] text-on-surface font-semibold">Добро пожаловать</h1>
            <p className="font-body-md text-[16px] text-on-surface-variant">Продолжите создание вашего шедевра</p>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-lg shadow-sm">
            <form className="flex flex-col gap-stack-md" onSubmit={handleSubmit}>
              {error && (
                <div className="p-3 bg-error-container text-on-error-container rounded font-body-md text-sm">
                  {error}
                </div>
              )}
              <div className="flex flex-col gap-1">
                <label className="font-label-caps text-[12px] text-on-surface-variant uppercase" htmlFor="email">Электронная почта</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors text-[20px]">alternate_email</span>
                  <input 
                    className="w-full pl-10 pr-4 py-3 bg-transparent border-b-2 border-outline-variant focus:border-primary focus:ring-0 outline-none font-body-md text-[16px] transition-all placeholder:text-outline-variant" 
                    id="email" 
                    name="email" 
                    placeholder="name@example.com" 
                    required 
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <label className="font-label-caps text-[12px] text-on-surface-variant uppercase" htmlFor="password">Пароль</label>
                  <a className="font-label-caps text-[12px] text-primary hover:underline transition-all" href="#">Забыли пароль?</a>
                </div>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors text-[20px]">lock_open</span>
                  <input 
                    className="w-full pl-10 pr-12 py-3 bg-transparent border-b-2 border-outline-variant focus:border-primary focus:ring-0 outline-none font-body-md text-[16px] transition-all placeholder:text-outline-variant" 
                    id="password" 
                    name="password" 
                    placeholder="••••••••" 
                    required 
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <button 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors" 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 py-2">
                <input className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary bg-transparent" id="remember" type="checkbox"/>
                <label className="font-body-md text-[16px] text-on-surface-variant cursor-pointer" htmlFor="remember">Запомнить меня</label>
              </div>

              <button 
                className="w-full bg-primary text-on-primary py-4 rounded-lg font-label-caps text-[12px] tracking-widest hover:bg-primary-dim active:scale-[0.98] transition-all shadow-md shadow-primary/10 flex items-center justify-center gap-2 group disabled:opacity-70" 
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <><span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span> ВХОД...</>
                ) : (
                  <>ВОЙТИ <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform text-[20px]">arrow_forward</span></>
                )}
              </button>
            </form>

            <div className="mt-8 pt-8 border-t border-outline-variant flex flex-col gap-4">
              <p className="font-body-md text-[16px] text-on-surface-variant text-center">Или войти через</p>
              <div className="grid grid-cols-2 gap-2">
                <button className="flex items-center justify-center gap-2 px-4 py-2 border border-outline-variant rounded-lg font-label-caps text-[12px] text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-all">
                  <span className="material-symbols-outlined text-[20px]">google</span>
                  GOOGLE
                </button>
                <button className="flex items-center justify-center gap-2 px-4 py-2 border border-outline-variant rounded-lg font-label-caps text-[12px] text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-all">
                  <span className="material-symbols-outlined text-[20px]">phone_iphone</span>
                  APPLE
                </button>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="font-body-md text-[16px] text-on-surface-variant">
              Нет аккаунта?{' '}
              <Link className="text-primary font-semibold hover:underline" href="/register">
                Создать аккаунт
              </Link>
            </p>
          </div>
        </div>
      </main>

      <footer className="w-full bg-background border-t border-outline-variant flex flex-col md:flex-row justify-between items-center px-container-padding py-4">
        <p className="font-label-caps text-[12px] text-on-surface-variant">© 2026 SCRIPT SCRIBE TECHNOLOGIES</p>
        <div className="flex gap-4 mt-2 md:mt-0">
          <a className="font-label-caps text-[12px] text-on-surface-variant hover:text-primary transition-colors" href="#">Политика конфиденциальности</a>
          <a className="font-label-caps text-[12px] text-on-surface-variant hover:text-primary transition-colors" href="#">Условия использования</a>
        </div>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><span className="material-symbols-outlined animate-spin text-[32px] text-primary">progress_activity</span></div>}>
      <LoginContent />
    </Suspense>
  );
}
