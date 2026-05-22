import { login, signup } from './actions'
import { Dumbbell } from 'lucide-react'

export default async function LoginPage(props: { searchParams: Promise<{ message: string }> }) {
  const searchParams = await props.searchParams

  return (
    <div className="flex-1 flex flex-col w-full px-4 sm:max-w-md justify-center gap-6 mt-12 sm:mt-20 mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="retro-card overflow-hidden relative shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/10">
        
        {/* Retro Travel Poster Geometric Landscape Banner */}
        <div className="h-44 w-full relative overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-orange-950/40 border-b border-white/5">
          <svg viewBox="0 0 400 176" className="w-full h-full object-cover select-none">
            <defs>
              <linearGradient id="login-sky" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1e1b4b" />
                <stop offset="40%" stopColor="#4c1d95" />
                <stop offset="70%" stopColor="#b45309" />
                <stop offset="100%" stopColor="#ea580c" />
              </linearGradient>
              <linearGradient id="login-sun-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="100%" stopColor="#f97316" />
              </linearGradient>
            </defs>
            
            {/* Sky backdrop */}
            <rect width="400" height="176" fill="url(#login-sky)" />
            
            {/* Big sunset sun */}
            <circle cx="200" cy="110" r="38" fill="url(#login-sun-grad)" opacity="0.95" filter="drop-shadow(0px 0px 8px rgba(249,115,22,0.4))" />
            
            {/* Mountain ranges */}
            <polygon points="-20,176 110,95 240,176" fill="#311432" opacity="0.85" />
            <polygon points="160,176 290,85 420,176" fill="#1b1641" opacity="0.9" />
            <polygon points="70,176 200,105 330,176" fill="#2d124d" opacity="0.75" />
            
            {/* Lake / foreground water */}
            <rect y="145" width="400" height="31" fill="#0c0a21" />
            
            {/* Water reflections */}
            <ellipse cx="200" cy="152" rx="40" ry="1.5" fill="#fef08a" opacity="0.6" />
            <ellipse cx="200" cy="158" rx="25" ry="1" fill="#facc15" opacity="0.4" />
            <ellipse cx="200" cy="164" rx="12" ry="0.8" fill="#f97316" opacity="0.3" />
            
            {/* Distant Birds */}
            <path d="M 60,40 Q 65,36 70,40 Q 75,36 80,40" fill="none" stroke="#fef08a" strokeWidth="1" opacity="0.5" />
            <path d="M 310,50 Q 314,46 318,50 Q 322,46 326,50" fill="none" stroke="#fef08a" strokeWidth="1" opacity="0.4" />

            {/* Glowing Brand Badge overlay */}
            <g transform="translate(20, 20)">
              <rect width="40" height="40" rx="12" fill="rgba(10, 14, 26, 0.75)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" className="backdrop-blur-sm" />
              <path d="M14 20 L20 14 L26 20 L20 26 Z" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinejoin="round" />
              <circle cx="20" cy="20" r="2" fill="#ec4899" />
            </g>
          </svg>
          
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
          
          <div className="absolute bottom-4 left-6">
            <h1 className="text-2xl font-black tracking-wider text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
              JOS Workout
            </h1>
            <p className="text-xs font-bold text-orange-400/90 uppercase tracking-widest mt-0.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
              Journey of Strength
            </p>
          </div>
        </div>

        {/* Login Form body */}
        <form className="p-6 sm:p-8 flex flex-col gap-5 text-foreground bg-slate-900/40 backdrop-blur-md">
          <div className="space-y-1">
            <h2 className="text-lg font-black text-white tracking-wide">환영합니다!</h2>
            <p className="text-xs text-slate-400 font-semibold tracking-wide">
              오늘의 땀방울과 다가올 여정을 기록하기 위해 시작해보세요.
            </p>
          </div>

          <div className="space-y-1.5 mt-2">
            <label className="text-xs font-bold text-slate-300 tracking-wider uppercase" htmlFor="email">
              이메일 주소 (Email)
            </label>
            <input
              className="w-full bg-slate-950/60 border border-white/5 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all font-medium"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 tracking-wider uppercase" htmlFor="password">
              비밀번호 (Password)
            </label>
            <input
              className="w-full bg-slate-950/60 border border-white/5 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all font-medium"
              name="password"
              type="password"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="flex flex-col gap-3 mt-4">
            <button
              formAction={login}
              className="w-full bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-400 hover:to-pink-500 text-white font-extrabold rounded-xl py-3 text-sm transition-all duration-300 shadow-[0_4px_15px_-5px_rgba(249,115,22,0.4)] hover:scale-102 active:scale-98 cursor-pointer text-center"
            >
              로그인 (Sign In)
            </button>
            <button
              formAction={signup}
              className="w-full bg-slate-950/60 hover:bg-slate-900 text-slate-300 hover:text-white font-bold rounded-xl py-3 text-sm transition-all duration-300 border border-white/5 hover:border-white/10 cursor-pointer text-center"
            >
              회원가입 (Sign Up)
            </button>
          </div>

          {searchParams?.message && (
            <p className="mt-2 p-3.5 bg-red-950/30 border border-red-500/20 text-red-300 text-xs font-semibold text-center rounded-xl animate-shake">
              {searchParams.message}
            </p>
          )}
        </form>
      </div>
    </div>
  )
}

