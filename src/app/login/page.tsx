import { login, signup } from './actions'
import { Dumbbell } from 'lucide-react'

export default async function LoginPage(props: { searchParams: Promise<{ message: string }> }) {
  const searchParams = await props.searchParams

  return (
    <div className="flex-1 flex flex-col w-full px-4 sm:max-w-md justify-center gap-6 mt-16 sm:mt-24 mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="retro-card overflow-hidden bg-white border border-slate-100 rounded-[2.5rem] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.04)] p-8 sm:p-10 flex flex-col gap-8">
        
        {/* Header section with brand identity */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 shadow-inner flex items-center justify-center">
            <Dumbbell className="w-8 h-8 text-slate-800" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              JOS Workout
            </h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Journey of Strength
            </p>
          </div>
          <div className="w-12 h-[2px] bg-slate-100 rounded-full mt-2" />
        </div>

        {/* Welcome Message */}
        <div className="space-y-1 text-center sm:text-left">
          <h2 className="text-lg font-bold text-slate-900 tracking-wide">환영합니다!</h2>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            오늘의 땀방울과 다가올 여정을 기록하기 위해 시작해보세요.
          </p>
        </div>

        {/* Login Form body */}
        <form className="flex flex-col gap-5 text-foreground">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 tracking-wider uppercase" htmlFor="email">
              이메일 주소 (Email)
            </label>
            <input
              className="w-full bg-slate-50/50 border border-slate-200/80 rounded-2xl px-4 py-3.5 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all font-semibold"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 tracking-wider uppercase" htmlFor="password">
              비밀번호 (Password)
            </label>
            <input
              className="w-full bg-slate-50/50 border border-slate-200/80 rounded-2xl px-4 py-3.5 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all font-semibold"
              name="password"
              type="password"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="flex flex-col gap-3.5 mt-5">
            <button
              formAction={login}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl py-3.5 text-sm transition-all duration-300 shadow-sm hover:scale-[1.01] active:scale-[0.99] cursor-pointer text-center"
            >
              로그인 (Sign In)
            </button>
            <button
              formAction={signup}
              className="w-full bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 font-bold rounded-2xl py-3.5 text-sm transition-all duration-300 border border-slate-200 hover:border-slate-300 cursor-pointer text-center"
            >
              회원가입 (Sign Up)
            </button>
          </div>

          {searchParams?.message && (
            <p className="mt-2 p-3.5 bg-red-50 border border-red-100 text-red-600 text-xs font-semibold text-center rounded-2xl animate-shake">
              {searchParams.message}
            </p>
          )}
        </form>
      </div>
    </div>
  )
}


