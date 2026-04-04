import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Toast from '../components/Toast';

export default function SignUp() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showForgotPin, setShowForgotPin] = useState(false);
  const [forgotName, setForgotName] = useState('');
  const [forgotPhone, setForgotPhone] = useState('');
  const [foundPin, setFoundPin] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteName, setDeleteName] = useState('');
  const [deletePin, setDeletePin] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const handlePinInput = (value: string) => {
    if (value.length <= 4 && /^\d*$/.test(value)) {
      setPin(value);
    }
  };

  const handleForgotPinInput = (value: string) => {
    if (value.length <= 4 && /^\d*$/.test(value)) {
      setForgotPhone(value);
    }
  };

  const handleDeletePinInput = (value: string) => {
    if (value.length <= 4 && /^\d*$/.test(value)) {
      setDeletePin(value);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setToast({ message: '이름 입력 필요', type: 'error' });
      return;
    }

    if (pin.length !== 4) {
      setToast({ message: 'PIN 입력 필요', type: 'error' });
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
        setToast({ message: '계정 없음', type: 'error' });
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
        setToast({ message: 'PIN 불일치', type: 'error' });
        setLoading(false);
        return;
      }

      localStorage.setItem('trainer', JSON.stringify(trainer));
      localStorage.setItem('hasVisited', 'true');
      localStorage.setItem('trainerName', trainer.name);
      navigate('/dashboard');
    } catch (err: any) {
      setToast({ message: '로그인 실패', type: 'error' });
    } finally {
      setLoading(false);
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
    <div className="min-h-screen bg-[#111110] flex items-center justify-center p-6 page-transition">
      <div className="max-w-md w-full">
        <div className="mb-12">
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem('hasVisited');
              localStorage.removeItem('trainerName');
              navigate('/landing');
            }}
            className="p-2 bg-[#1c1c1c] border border-gray-800 text-gray-300 rounded-xl hover:bg-gray-800 active:bg-gray-700 transition touch-manipulation"
          >
            <ArrowLeft size={20} />
          </button>
        </div>

        <div className="bg-[#1c1c1c] rounded-2xl p-8 border border-gray-800">
          <h2 className="text-2xl font-bold text-white mb-6">로그인</h2>

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
              className="block w-full text-sm text-gray-400 hover:text-emerald-400 transition"
            >
              PIN을 잊으셨나요?
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="block w-full text-sm text-gray-400 hover:text-red-400 transition"
            >
              계정 탈퇴
            </button>
          </div>
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
