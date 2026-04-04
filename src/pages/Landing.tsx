import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Toast from '../components/Toast';

export default function Landing() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedGuide, setExpandedGuide] = useState<'ios' | 'android' | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteName, setDeleteName] = useState('');
  const [deletePin, setDeletePin] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showForgotPin, setShowForgotPin] = useState(false);
  const [forgotName, setForgotName] = useState('');
  const [forgotPhone, setForgotPhone] = useState('');
  const [foundPin, setFoundPin] = useState('');
  const [forgotError, setForgotError] = useState('');
  const loginSectionRef = useRef<HTMLDivElement>(null);
  const [hasVisited, setHasVisited] = useState(false);
  const installGuideRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hasVisited = localStorage.getItem('hasVisited');
    setHasVisited(hasVisited === 'true');
  }, []);

  const scrollToSignUp = () => {
    loginSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleGuideToggle = (guide: 'ios' | 'android') => {
    const newGuide = expandedGuide === guide ? null : guide;
    setExpandedGuide(newGuide);

    if (newGuide) {
      setTimeout(() => {
        installGuideRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  };

  const handlePhoneInput = (value: string) => {
    if (value.length <= 4 && /^\d*$/.test(value)) {
      setPhone(value);
    }
  };

  const handlePinInput = (value: string) => {
    if (value.length <= 4 && /^\d*$/.test(value)) {
      setPin(value);
    }
  };

  const handleConfirmPinInput = (value: string) => {
    if (value.length <= 4 && /^\d*$/.test(value)) {
      setConfirmPin(value);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setToast({ message: '이름을 입력해주세요', type: 'error' });
      return;
    }

    if (phone.length !== 4) {
      setToast({ message: '전화번호 뒷 4자리를 입력해주세요', type: 'error' });
      return;
    }

    if (pin.length !== 4) {
      setToast({ message: 'PIN 4자리를 입력해주세요', type: 'error' });
      return;
    }

    if (confirmPin.length !== 4) {
      setToast({ message: 'PIN 확인을 입력해주세요', type: 'error' });
      return;
    }

    if (pin !== confirmPin) {
      setToast({ message: 'PIN이 일치하지 않습니다', type: 'error' });
      return;
    }

    setLoading(true);

    try {
      const { data: nameExists, error: nameCheckError } = await supabase
        .from('trainers')
        .select('id')
        .eq('name', name.trim())
        .maybeSingle();

      if (nameCheckError) throw nameCheckError;

      if (nameExists) {
        setToast({ message: '이미 사용 중인 이름입니다', type: 'error' });
        setLoading(false);
        return;
      }

      const { data: trainer, error: insertError } = await supabase
        .from('trainers')
        .insert([{
          name: name.trim(),
          pin,
          phone_last4: phone
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      localStorage.setItem('hasVisited', 'true');
      localStorage.setItem('trainerName', name.trim());
      setToast({ message: '회원가입 완료! 로그인해주세요', type: 'success' });

      setTimeout(() => {
        navigate('/signup');
      }, 1500);
    } catch (err: any) {
      setToast({ message: '회원가입 실패', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePinInput = (value: string) => {
    if (value.length <= 4 && /^\d*$/.test(value)) {
      setDeletePin(value);
    }
  };

  const handleForgotPinInput = (value: string) => {
    if (value.length <= 4 && /^\d*$/.test(value)) {
      setForgotPhone(value);
    }
  };

  const handleForgotPin = async () => {
    setForgotError('');
    setFoundPin('');

    if (!forgotName.trim()) {
      setForgotError('이름을 입력해주세요');
      return;
    }

    if (forgotPhone.length !== 4) {
      setForgotError('전화번호 뒷 4자리를 입력해주세요');
      return;
    }

    try {
      const { data: trainer, error: dbError } = await supabase
        .from('trainers')
        .select('pin')
        .eq('name', forgotName.trim())
        .eq('phone_last4', forgotPhone)
        .maybeSingle();

      if (dbError) throw dbError;

      if (!trainer) {
        setForgotError('일치하는 정보가 없습니다');
        return;
      }

      setFoundPin(trainer.pin);
    } catch (err: any) {
      setForgotError('오류가 발생했습니다');
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError('');

    if (!deleteName.trim()) {
      setDeleteError('이름을 입력해주세요');
      return;
    }

    if (deletePin.length !== 4) {
      setDeleteError('4자리 PIN을 입력해주세요');
      return;
    }

    setLoading(true);

    try {
      const { data: nameExists, error: nameCheckError } = await supabase
        .from('trainers')
        .select('id')
        .eq('name', deleteName.trim())
        .maybeSingle();

      if (nameCheckError) throw nameCheckError;

      if (!nameExists) {
        setDeleteError('이름을 확인해주세요');
        setLoading(false);
        return;
      }

      const { data: trainer, error: dbError } = await supabase
        .from('trainers')
        .select('*')
        .eq('name', deleteName.trim())
        .eq('pin', deletePin)
        .maybeSingle();

      if (dbError) throw dbError;

      if (!trainer) {
        setDeleteError('PIN 번호를 확인해주세요');
        setLoading(false);
        return;
      }

      await supabase.from('workouts').delete().eq('trainer_id', trainer.id);
      await supabase.from('members').delete().eq('trainer_id', trainer.id);
      await supabase.from('exercise_library').delete().eq('trainer_id', trainer.id);
      await supabase.from('trainers').delete().eq('id', trainer.id);

      localStorage.clear();
      setHasVisited(false);
      setShowDeleteConfirm(false);
      setDeleteName('');
      setDeletePin('');
      setDeleteError('');

      setToast({ message: '탈퇴 완료', type: 'success' });

      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (err: any) {
      setDeleteError(err.message || '계정 탈퇴에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111110] page-transition">
      {!hasVisited && (
        <>
          <section className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
            <div className="text-center max-w-2xl mx-auto">
              <p className="text-gray-500 text-xs font-medium tracking-[0.3em] mb-6">FOR TRAINERS</p>
              <h1 className="text-7xl font-bold text-white mb-6 tracking-tight">
                핏차트
              </h1>
              <p className="text-gray-400 text-xl mb-12">
                복잡한 건 없애고 기록만 남겼습니다
              </p>
              <button
                onClick={scrollToSignUp}
                className="text-gray-500 hover:text-gray-400 transition animate-bounce"
              >
                <ChevronDown size={32} />
              </button>
            </div>
          </section>

          <div className="border-t border-[#2c2c2a]" />

          <section className="py-24 px-6">
            <div className="max-w-2xl mx-auto">
              <div className="text-center space-y-8">
                <p className="text-white text-[32px] font-bold py-6 border-b border-[#2c2c2a]">간단하다</p>
                <p className="text-white text-[32px] font-bold py-6 border-b border-[#2c2c2a]">심플하다</p>
                <p className="text-white text-[32px] font-bold py-6">정확하다</p>
              </div>
            </div>
          </section>

          <div className="border-t border-[#2c2c2a]" />

          <section className="py-24 px-6">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-white text-2xl font-bold mb-4">
                관리 회원 10명 넘으면 기억 못합니다
              </h2>
              <p className="text-gray-400 text-lg">
                "저번에 뭐했더라..." 이 말, 해본 적 있으신가요?
              </p>
            </div>
          </section>

          <div className="border-t border-[#2c2c2a]" />

          <section className="py-24 px-6">
            <div className="max-w-2xl mx-auto space-y-12">
              <div className="text-center pb-12 border-b border-[#2c2c2a]">
                <h3 className="text-white text-xl font-bold mb-3">3초면 끝나는 수업 기록</h3>
                <p className="text-gray-400">카테고리 선택 → 운동 선택 → 중량 입력. 끝.</p>
              </div>
              <div className="text-center pb-12 border-b border-[#2c2c2a]">
                <h3 className="text-white text-xl font-bold mb-3">달력으로 한눈에 보는 히스토리</h3>
                <p className="text-gray-400">날짜별 수업 기록을 한눈에 확인하세요.</p>
              </div>
              <div className="text-center">
                <h3 className="text-white text-xl font-bold mb-3">회원 관리, 이제 손 안에</h3>
                <p className="text-gray-400">총 수업 횟수, 마지막 수업일까지 한눈에.</p>
              </div>
            </div>
          </section>

          <div className="border-t border-[#2c2c2a]" />
        </>
      )}

      <section ref={loginSectionRef} className={hasVisited ? "min-h-screen flex items-center justify-center py-24 px-6" : "py-24 px-6"}>
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">지금 시작하세요</h2>
            <p className="text-gray-400">무료로 사용할 수 있어요</p>
          </div>

          <div className="space-y-6">
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
                  className="w-full px-4 py-3 bg-[#1c1c1c] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                  placeholder="이름을 입력하세요"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
                  전화번호 뒷 4자리
                </label>
                <input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  required
                  value={phone}
                  onChange={(e) => handlePhoneInput(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1c1c1c] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition text-center text-2xl tracking-widest"
                  placeholder="••••"
                  maxLength={4}
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
                  onChange={(e) => handlePinInput(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1c1c1c] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition text-center text-2xl tracking-widest"
                  placeholder="••••"
                  maxLength={4}
                />
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
                  onChange={(e) => handleConfirmPinInput(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1c1c1c] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition text-center text-2xl tracking-widest"
                  placeholder="••••"
                  maxLength={4}
                />
              </div>

              {error && (
                <div className="text-red-400 text-sm bg-red-950/50 border border-red-900 p-3 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 active:bg-emerald-800 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '회원가입 중...' : '회원가입'}
              </button>
            </form>

            <div className="text-center space-y-3">
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem('hasVisited', 'true');
                  navigate('/signup');
                }}
                className="block w-full text-sm text-gray-400 hover:text-white transition"
              >
                이미 계정이 있으신가요? <span className="text-emerald-500 font-medium">로그인</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {!hasVisited && (
        <>
          <div className="border-t border-[#2c2c2a]" />

          <section className="py-16 px-6">
            <div className="max-w-md mx-auto">
              <div className="text-center mb-6">
                <p className="text-gray-400 text-sm">
                  📱 홈화면에 설치하면 앱처럼 사용할 수 있어요
                </p>
              </div>

              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => handleGuideToggle('ios')}
                  className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition ${
                    expandedGuide === 'ios'
                      ? 'bg-gray-700 text-white'
                      : 'bg-[#1c1c1c] border border-gray-700 text-gray-400 hover:text-white'
                  }`}
                >
                  아이폰
                </button>
                <button
                  onClick={() => handleGuideToggle('android')}
                  className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition ${
                    expandedGuide === 'android'
                      ? 'bg-gray-700 text-white'
                      : 'bg-[#1c1c1c] border border-gray-700 text-gray-400 hover:text-white'
                  }`}
                >
                  안드로이드
                </button>
              </div>

              {expandedGuide === 'ios' && (
                <div ref={installGuideRef} className="bg-[#1c1c1c] border border-gray-700 rounded-lg p-4 space-y-1.5 text-sm text-gray-400">
                  <p>1. 카카오톡에서 링크를 열어요</p>
                  <p>2. 우측 하단 공유(↑) 버튼을 탭해요</p>
                  <p>3. "Safari로 열기"를 선택해요</p>
                  <p>4. 하단 공유 버튼(□↑)을 탭해요</p>
                  <p>5. "홈 화면에 추가"를 선택해요</p>
                  <p>6. "추가"를 탭해요</p>
                </div>
              )}

              {expandedGuide === 'android' && (
                <div ref={installGuideRef} className="bg-[#1c1c1c] border border-gray-700 rounded-lg p-4 space-y-1.5 text-sm text-gray-400">
                  <p>1. 카카오톡에서 링크를 열어요</p>
                  <p>2. 우측 상단 ··· 버튼을 탭해요</p>
                  <p>3. "다른 브라우저로 열기"를 선택해요</p>
                  <p>4. 크롬에서 우측 상단 ··· 메뉴를 탭해요</p>
                  <p>5. "홈 화면에 추가"를 선택해요</p>
                  <p>6. "설치"를 탭해요</p>
                </div>
              )}
            </div>
          </section>
        </>
      )}

      {showForgotPin && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-6 z-50">
          <div className="bg-[#1c1c1c] border border-gray-800 rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-white mb-4">PIN 찾기</h2>
            <p className="text-gray-400 text-sm mb-6">
              등록하신 이름과 전화번호 뒷 4자리를 입력하세요.
            </p>

            <div className="space-y-4">
              <div>
                <label htmlFor="forgotName" className="block text-sm font-medium text-gray-300 mb-2">
                  이름
                </label>
                <input
                  id="forgotName"
                  type="text"
                  value={forgotName}
                  onChange={(e) => setForgotName(e.target.value)}
                  className="w-full px-4 py-3 bg-[#111110] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                  placeholder="이름을 입력하세요"
                />
              </div>

              <div>
                <label htmlFor="forgotPhone" className="block text-sm font-medium text-gray-300 mb-2">
                  전화번호 뒷 4자리
                </label>
                <input
                  id="forgotPhone"
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={forgotPhone}
                  onChange={(e) => handleForgotPinInput(e.target.value)}
                  className="w-full px-4 py-3 bg-[#111110] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition text-center text-2xl tracking-widest"
                  placeholder="••••"
                  maxLength={4}
                />
              </div>

              {foundPin && (
                <div className="bg-emerald-950/50 border border-emerald-900 text-emerald-400 text-sm p-4 rounded-lg text-center">
                  <p className="mb-2">회원님의 PIN은</p>
                  <p className="text-3xl font-bold tracking-widest">{foundPin}</p>
                  <p className="mt-2">입니다</p>
                </div>
              )}

              {forgotError && (
                <div className="bg-red-950/50 border border-red-900 text-red-400 text-sm p-3 rounded-lg">
                  {forgotError}
                </div>
              )}

              {!foundPin ? (
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPin(false);
                      setForgotName('');
                      setForgotPhone('');
                      setForgotError('');
                    }}
                    className="flex-1 px-4 py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-700 transition"
                  >
                    닫기
                  </button>
                  <button
                    type="button"
                    onClick={handleForgotPin}
                    className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition"
                  >
                    확인
                  </button>
                </div>
              ) : (
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPin(false);
                      setForgotName('');
                      setForgotPhone('');
                      setFoundPin('');
                      setForgotError('');
                    }}
                    className="w-full px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition"
                  >
                    확인
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-6 z-50">
          <div className="bg-[#1c1c1c] border border-gray-800 rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-white mb-4">계정 탈퇴</h2>
            <p className="text-gray-400 text-sm mb-6">
              계정을 탈퇴하면 모든 데이터가 삭제됩니다. 이름과 PIN을 입력하여 확인해주세요.
            </p>

            <div className="space-y-4">
              <div>
                <label htmlFor="deleteName" className="block text-sm font-medium text-gray-300 mb-2">
                  이름
                </label>
                <input
                  id="deleteName"
                  type="text"
                  value={deleteName}
                  onChange={(e) => setDeleteName(e.target.value)}
                  className="w-full px-4 py-3 bg-[#111110] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
                  placeholder="이름을 입력하세요"
                />
              </div>

              <div>
                <label htmlFor="deletePin" className="block text-sm font-medium text-gray-300 mb-2">
                  PIN
                </label>
                <input
                  id="deletePin"
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={deletePin}
                  onChange={(e) => handleDeletePinInput(e.target.value)}
                  className="w-full px-4 py-3 bg-[#111110] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition text-center text-2xl tracking-widest"
                  placeholder="••••"
                  maxLength={4}
                />
              </div>

              {deleteError && (
                <div className="text-red-400 text-sm bg-red-950/50 border border-red-900 p-3 rounded-lg">
                  {deleteError}
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteName('');
                    setDeletePin('');
                    setDeleteError('');
                  }}
                  className="flex-1 px-4 py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-700 transition"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '처리 중...' : '탈퇴'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
