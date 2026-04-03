import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Toast from '../components/Toast';

export default function Login() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
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

  const handlePinInput = (value: string) => {
    if (value.length <= 4 && /^\d*$/.test(value)) {
      setPin(value);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setToast({ message: '이름을 입력해주세요', type: 'error' });
      return;
    }

    if (pin.length !== 4) {
      setToast({ message: '4자리 PIN을 입력해주세요', type: 'error' });
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

      if (!nameExists) {
        setToast({ message: '등록되지 않은 계정입니다. 회원가입을 해주세요', type: 'error' });
        setLoading(false);
        return;
      }

      const { data: trainer, error: dbError } = await supabase
        .from('trainers')
        .select('*')
        .eq('name', name.trim())
        .eq('pin', pin)
        .maybeSingle();

      if (dbError) throw dbError;

      if (!trainer) {
        setToast({ message: 'PIN 번호가 올바르지 않습니다', type: 'error' });
        setLoading(false);
        return;
      }

      localStorage.setItem('trainer', JSON.stringify(trainer));
      navigate('/dashboard');
    } catch (err: any) {
      setToast({ message: err.message || '로그인에 실패했습니다', type: 'error' });
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
      const { data: trainer, error: dbError } = await supabase
        .from('trainers')
        .select('*')
        .eq('name', deleteName.trim())
        .eq('pin', deletePin)
        .maybeSingle();

      if (dbError) throw dbError;

      if (!trainer) {
        setDeleteError('이름 또는 PIN이 올바르지 않습니다');
        setLoading(false);
        return;
      }

      await supabase.from('workouts').delete().eq('trainer_id', trainer.id);
      await supabase.from('members').delete().eq('trainer_id', trainer.id);
      await supabase.from('exercise_library').delete().eq('trainer_id', trainer.id);
      await supabase.from('trainers').delete().eq('id', trainer.id);

      localStorage.removeItem('trainer');
      setShowDeleteConfirm(false);
      setDeleteName('');
      setDeletePin('');
      setDeleteError('');

      setToast({ message: '탈퇴가 완료되었습니다', type: 'success' });

      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err: any) {
      setDeleteError(err.message || '계정 탈퇴에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111110] flex items-center justify-center p-6 page-transition">
      <div className="max-w-md w-full">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-white mb-4 tracking-tight">
            핏차트
          </h1>
          <p className="text-gray-400 text-xl font-light">
            당신의 회원, 당신만의 기록
          </p>
        </div>

        <div className="bg-[#1c1c1c] rounded-2xl p-8 border border-gray-800">
          <form onSubmit={handleLogin} className="space-y-6">
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
                onChange={(e) => handlePinInput(e.target.value)}
                className="w-full px-4 py-3 bg-[#111110] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition text-center text-2xl tracking-widest"
                placeholder="••••"
                maxLength={4}
              />
              <p className="text-xs text-gray-500 mt-2 text-center">4자리 숫자를 입력하세요</p>
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
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <button
              type="button"
              onClick={() => setShowForgotPin(true)}
              className="text-sm text-gray-400 hover:text-emerald-400 transition"
            >
              PIN을 잊으셨나요?
            </button>
            <button
              type="button"
              onClick={() => navigate('/signup')}
              className="block w-full text-sm text-gray-400 hover:text-white transition"
            >
              계정이 없으신가요? <span className="text-emerald-500 font-medium">회원가입</span>
            </button>
            <div>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-xs text-gray-500 hover:text-gray-400 transition"
              >
                계정 탈퇴
              </button>
            </div>
          </div>
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
