import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function SignUp() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [phoneLast4, setPhoneLast4] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedGuide, setExpandedGuide] = useState<'ios' | 'android' | null>(null);

  const handlePinInput = (value: string, setter: (val: string) => void) => {
    if (value.length <= 4 && /^\d*$/.test(value)) {
      setter(value);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('이름을 입력해주세요');
      return;
    }

    if (pin.length !== 4) {
      setError('4자리 PIN을 입력해주세요');
      return;
    }

    if (pin !== confirmPin) {
      setError('PIN이 일치하지 않습니다');
      return;
    }

    if (phoneLast4.length !== 4) {
      setError('전화번호 뒷 4자리를 입력해주세요');
      return;
    }

    setLoading(true);

    try {
      const { data: existingTrainer } = await supabase
        .from('trainers')
        .select('id')
        .eq('name', name.trim())
        .eq('pin', pin)
        .maybeSingle();

      if (existingTrainer) {
        throw new Error('이미 존재하는 계정입니다 (같은 이름과 PIN 조합)');
      }

      const { data: newTrainer, error: insertError } = await supabase
        .from('trainers')
        .insert([{ name: name.trim(), pin, phone_last4: phoneLast4 }])
        .select()
        .single();

      if (insertError) throw insertError;

      localStorage.setItem('trainer', JSON.stringify(newTrainer));
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || '회원가입에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111110] flex items-center justify-center p-6 page-transition">
      <div className="max-w-md w-full">
        <div className="mb-12">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="p-2 bg-[#1c1c1c] border border-gray-800 text-gray-300 rounded-xl hover:bg-gray-800 active:bg-gray-700 transition touch-manipulation"
          >
            <ArrowLeft size={20} />
          </button>
        </div>

        <div className="bg-[#1c1c1c] rounded-2xl p-8 border border-gray-800">
          <h2 className="text-2xl font-bold text-white mb-6">회원가입</h2>

          <form onSubmit={handleSignUp} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                이름
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-[#111110] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                placeholder="이름을 입력하세요"
              />
            </div>

            <div>
              <label htmlFor="pin" className="block text-sm font-medium text-gray-300 mb-2">
                PIN
              </label>
              <input
                id="pin"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                required
                value={pin}
                onChange={(e) => handlePinInput(e.target.value, setPin)}
                className="w-full px-4 py-3 bg-[#111110] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition text-center text-2xl tracking-widest"
                placeholder="••••"
                maxLength={4}
              />
              <p className="text-xs text-gray-500 mt-2 text-center">4자리 숫자를 입력하세요</p>
            </div>

            <div>
              <label htmlFor="confirmPin" className="block text-sm font-medium text-gray-300 mb-2">
                PIN 확인
              </label>
              <input
                id="confirmPin"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                required
                value={confirmPin}
                onChange={(e) => handlePinInput(e.target.value, setConfirmPin)}
                className="w-full px-4 py-3 bg-[#111110] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition text-center text-2xl tracking-widest"
                placeholder="••••"
                maxLength={4}
              />
              <p className="text-xs text-gray-500 mt-2 text-center">동일한 PIN을 다시 입력하세요</p>
            </div>

            <div>
              <label htmlFor="phoneLast4" className="block text-sm font-medium text-gray-300 mb-2">
                전화번호 뒷 4자리
              </label>
              <input
                id="phoneLast4"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                required
                value={phoneLast4}
                onChange={(e) => handlePinInput(e.target.value, setPhoneLast4)}
                className="w-full px-4 py-3 bg-[#111110] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition text-center text-2xl tracking-widest"
                placeholder="••••"
                maxLength={4}
              />
              <p className="text-xs text-gray-500 mt-2 text-center">PIN 찾기에 사용됩니다</p>
            </div>

            {error && (
              <div className="text-red-400 text-sm bg-red-950/50 border border-red-900 p-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '가입 중...' : '회원가입'}
            </button>
          </form>
        </div>

        <div className="mt-8 bg-[#1c1c1c] rounded-2xl p-6 border border-gray-800">
          <div className="text-center mb-4">
            <h3 className="text-xs text-gray-500 font-medium">
              📱 홈화면에 설치하기
            </h3>
          </div>

          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setExpandedGuide(expandedGuide === 'ios' ? null : 'ios')}
              className={`flex-1 py-2 px-4 rounded-lg text-xs font-medium transition ${
                expandedGuide === 'ios'
                  ? 'bg-gray-700 text-white'
                  : 'bg-[#111110] text-gray-400 hover:text-white'
              }`}
            >
              아이폰
            </button>
            <button
              onClick={() => setExpandedGuide(expandedGuide === 'android' ? null : 'android')}
              className={`flex-1 py-2 px-4 rounded-lg text-xs font-medium transition ${
                expandedGuide === 'android'
                  ? 'bg-gray-700 text-white'
                  : 'bg-[#111110] text-gray-400 hover:text-white'
              }`}
            >
              안드로이드
            </button>
          </div>

          {expandedGuide === 'ios' && (
            <div className="bg-[#111110] rounded-lg p-4 space-y-1.5 text-xs text-gray-400">
              <p>1. 카카오톡에서 링크를 열어요</p>
              <p>2. 우측 하단 공유(↑) 버튼을 탭해요</p>
              <p>3. "Safari로 열기"를 선택해요</p>
              <p>4. 하단 공유 버튼(□↑)을 탭해요</p>
              <p>5. "홈 화면에 추가"를 선택해요</p>
              <p>6. "추가"를 탭해요</p>
            </div>
          )}

          {expandedGuide === 'android' && (
            <div className="bg-[#111110] rounded-lg p-4 space-y-1.5 text-xs text-gray-400">
              <p>1. 카카오톡에서 링크를 열어요</p>
              <p>2. 우측 상단 ··· 버튼을 탭해요</p>
              <p>3. "다른 브라우저로 열기"를 선택해요</p>
              <p>4. 크롬에서 우측 상단 ··· 메뉴를 탭해요</p>
              <p>5. "홈 화면에 추가"를 선택해요</p>
              <p>6. "설치"를 탭해요</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
