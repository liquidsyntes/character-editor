'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }
    setLoading(true);
    setError('');

    // Our Credentials provider automatically creates the account if it doesn't exist
    const res = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });

    if (res?.error) {
      setError('Ошибка при регистрации. Возможно, email уже используется.');
      setLoading(false);
    } else {
      router.push('/');
      router.refresh();
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-body-md overflow-x-hidden relative">
      <header className="w-full top-0 sticky bg-background border-b border-outline-variant flex justify-between items-center px-container-padding h-16 z-50">
        <div className="font-headline-md text-[32px] text-primary font-semibold">ScriptScribe</div>
        <div className="hidden md:flex gap-gutter">
          <a className="font-label-caps text-[12px] text-on-surface-variant hover:text-primary transition-colors uppercase tracking-widest" href="#">О системе</a>
          <a className="font-label-caps text-[12px] text-on-surface-variant hover:text-primary transition-colors uppercase tracking-widest" href="#">Поддержка</a>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center px-6 py-stack-lg relative overflow-hidden">
        {/* Atmospheric Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20 overflow-hidden">
          <div 
            className="absolute -top-1/4 -right-1/4 w-[600px] h-[600px] bg-primary-container rounded-full blur-[120px]"
            style={{ transform: `translate(${mousePos.x * 20}px, ${mousePos.y * 20}px)` }}
          ></div>
          <div 
            className="absolute -bottom-1/4 -left-1/4 w-[500px] h-[500px] bg-tertiary-container rounded-full blur-[100px]"
            style={{ transform: `translate(${mousePos.x * 40}px, ${mousePos.y * 40}px)` }}
          ></div>
        </div>

        <div className="w-full max-w-[480px] bg-surface-container-lowest border border-outline-variant p-stack-lg relative z-10 rounded-xl">
          <div className="text-center mb-stack-lg">
            <div className="mb-stack-sm">
              <span className="material-symbols-outlined text-primary text-[36px]">auto_stories</span>
            </div>
            <h1 className="font-headline-md text-[32px] text-on-surface mb-2 font-semibold">Создать аккаунт</h1>
            <p className="font-body-md text-[16px] text-on-surface-variant">Начните проектировать свой следующий шедевр уже сегодня.</p>
          </div>

          <form className="flex flex-col gap-stack-md" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 bg-error-container text-on-error-container rounded font-body-md text-sm">
                {error}
              </div>
            )}
            
            <div className="flex flex-col gap-1 group">
              <label className="font-label-caps text-[12px] text-outline uppercase">Имя</label>
              <input 
                className="border-0 border-b border-outline-variant bg-transparent px-0 py-2 focus:ring-0 focus:border-primary transition-all font-body-lg text-[18px] text-on-surface placeholder:text-outline-variant outline-none" 
                placeholder="Александр Пушкин" 
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1 group">
              <label className="font-label-caps text-[12px] text-outline uppercase">Email</label>
              <div className="relative flex items-center border border-outline-variant bg-surface-container-low px-3 py-2 rounded focus-within:border-primary transition-all focus-within:shadow-[0_4px_20px_-2px_rgba(0,91,175,0.15)]">
                <span className="material-symbols-outlined text-on-surface-variant mr-3 text-[20px]">mail</span>
                <input 
                  className="bg-transparent border-none p-0 w-full focus:ring-0 font-body-md text-[16px] text-on-surface placeholder:text-outline-variant outline-none" 
                  placeholder="author@scriptscribe.app" 
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1 group">
              <label className="font-label-caps text-[12px] text-outline uppercase">Пароль</label>
              <div className="relative flex items-center border border-outline-variant bg-surface-container-low px-3 py-2 rounded focus-within:border-primary transition-all focus-within:shadow-[0_4px_20px_-2px_rgba(0,91,175,0.15)]">
                <span className="material-symbols-outlined text-on-surface-variant mr-3 text-[20px]">lock</span>
                <input 
                  className="bg-transparent border-none p-0 w-full focus:ring-0 font-body-md text-[16px] text-on-surface placeholder:text-outline-variant outline-none" 
                  placeholder="••••••••" 
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  minLength={5}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1 group">
              <label className="font-label-caps text-[12px] text-outline uppercase">Подтверждение пароля</label>
              <div className="relative flex items-center border border-outline-variant bg-surface-container-low px-3 py-2 rounded focus-within:border-primary transition-all focus-within:shadow-[0_4px_20px_-2px_rgba(0,91,175,0.15)]">
                <span className="material-symbols-outlined text-on-surface-variant mr-3 text-[20px]">shield</span>
                <input 
                  className="bg-transparent border-none p-0 w-full focus:ring-0 font-body-md text-[16px] text-on-surface placeholder:text-outline-variant outline-none" 
                  placeholder="••••••••" 
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  minLength={5}
                />
              </div>
            </div>

            <button 
              className="mt-4 w-full bg-primary text-on-primary py-3 px-6 rounded-lg font-headline-sm text-[20px] text-center hover:bg-primary-dim active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-70 flex justify-center items-center gap-2" 
              type="submit"
              disabled={loading}
            >
              {loading && <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>}
              Зарегистрироваться
            </button>

            <p className="text-center font-label-caps text-[10px] text-outline leading-tight mt-2">
              Нажимая «Зарегистрироваться», вы соглашаетесь с нашими <br/>
              <a className="text-primary hover:underline transition-all" href="#">Условиями обслуживания</a> и <a className="text-primary hover:underline transition-all" href="#">Политикой конфиденциальности</a>.
            </p>
          </form>

          <div className="flex items-center gap-4 my-8">
            <div className="h-[1px] flex-grow bg-outline-variant"></div>
            <span className="font-label-caps text-[12px] text-outline">ИЛИ</span>
            <div className="h-[1px] flex-grow bg-outline-variant"></div>
          </div>

          <div className="text-center">
            <p className="font-body-md text-[16px] text-on-surface-variant">
              Уже есть аккаунт? 
              <Link className="text-primary font-semibold hover:underline transition-all ml-1 cursor-pointer" href="/login">
                Войти
              </Link>
            </p>
          </div>
        </div>
      </main>

      <footer className="w-full bottom-0 bg-background border-t border-outline-variant flex flex-col md:flex-row justify-between items-center px-container-padding py-4">
        <div className="font-label-caps text-[12px] text-on-surface mb-2 md:mb-0">
          © 2026 ScriptScribe Technologies. Все права защищены.
        </div>
        <div className="flex gap-6">
          <a className="font-label-caps text-[12px] text-on-surface-variant hover:text-primary transition-colors cursor-pointer" href="#">Политика конфиденциальности</a>
          <a className="font-label-caps text-[12px] text-on-surface-variant hover:text-primary transition-colors cursor-pointer" href="#">Условия использования</a>
          <a className="font-label-caps text-[12px] text-on-surface-variant hover:text-primary transition-colors cursor-pointer" href="#">Поддержка</a>
        </div>
      </footer>
    </div>
  );
}
