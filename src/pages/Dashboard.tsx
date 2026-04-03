import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Search, Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import { supabase, Trainer, Member } from '../lib/supabase';
import { getDisplayName } from '../lib/memberUtils';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';

interface MemberWithStats extends Member {
  workoutCount: number;
  lastWorkoutDate: string | null;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [trainer, setTrainer] = useState<Trainer | null>(null);
  const [members, setMembers] = useState<MemberWithStats[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<MemberWithStats | null>(null);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editingMemberName, setEditingMemberName] = useState('');
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    const storedTrainer = localStorage.getItem('trainer');
    if (!storedTrainer) {
      navigate('/');
      return;
    }
    const trainerData = JSON.parse(storedTrainer);
    setTrainer(trainerData);
    loadMembers(trainerData.id);
  }, [navigate]);

  const loadMembers = async (trainerId: string) => {
    const { data } = await supabase
      .from('members')
      .select('*')
      .eq('trainer_id', trainerId);

    if (data) {
      const membersWithStats = await Promise.all(
        data.map(async (member) => {
          const { data: workouts } = await supabase
            .from('workouts')
            .select('date')
            .eq('member_id', member.id)
            .order('date', { ascending: false });

          return {
            ...member,
            workoutCount: workouts?.length || 0,
            lastWorkoutDate: workouts && workouts.length > 0 ? workouts[0].date : null,
          };
        })
      );

      const sorted = [...membersWithStats].sort((a, b) => a.name.localeCompare(b.name, 'ko-KR'));
      setMembers(sorted);
      setIsInitialLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trainer || !newMemberName.trim()) return;

    setLoading(true);
    try {
      console.log('Adding member with trainer_id:', trainer.id);
      const { data, error } = await supabase
        .from('members')
        .insert([{ trainer_id: trainer.id, name: newMemberName.trim() }])
        .select();

      console.log('Insert result:', { data, error });

      if (error) {
        showToast(`회원 추가 실패: ${error.message}`, 'error');
        throw error;
      }

      setNewMemberName('');
      setShowAddMember(false);
      await loadMembers(trainer.id);
      showToast('회원이 추가되었습니다', 'success');
    } catch (err: any) {
      console.error('Error adding member:', err);
      showToast(`오류: ${err.message || '회원 추가에 실패했습니다'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMember = async () => {
    if (!trainer || !memberToDelete) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', memberToDelete.id);

      if (error) throw error;

      await loadMembers(trainer.id);
      showToast('회원이 삭제되었습니다', 'success');
      setMemberToDelete(null);
    } catch (err: any) {
      console.error('Error deleting member:', err);
      showToast(`삭제 실패: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditMember = (member: Member) => {
    setEditingMemberId(member.id);
    setEditingMemberName(member.name);
  };

  const handleSaveEdit = async (memberId: string) => {
    if (!trainer || !editingMemberName.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('members')
        .update({ name: editingMemberName.trim() })
        .eq('id', memberId);

      if (error) throw error;

      await loadMembers(trainer.id);
      showToast('회원 이름이 수정되었습니다', 'success');
      setEditingMemberId(null);
      setEditingMemberName('');
    } catch (err: any) {
      console.error('Error updating member:', err);
      showToast(`수정 실패: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingMemberId(null);
    setEditingMemberName('');
  };

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  if (!trainer || isInitialLoading) {
    return (
      <div className="min-h-screen bg-[#111110] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">로딩 중...</p>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    localStorage.removeItem('trainer');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#111110] page-transition">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
              핏차트
            </h1>
            <p className="text-gray-400 text-sm">{today}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowAddMember(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition font-medium"
            >
              <Plus size={18} />
              새 회원
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="p-2 bg-[#1c1c1c] border border-gray-800 text-gray-300 rounded-xl hover:bg-gray-800 transition"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
          <input
            type="text"
            placeholder="회원 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-[#1c1c1c] border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
          />
        </div>

        <div className="space-y-3">
          {filteredMembers.length === 0 ? (
            <div className="bg-[#1c1c1c] border border-gray-800 rounded-xl p-12 text-center">
              <p className="text-gray-400">
                {searchQuery ? '검색 결과가 없습니다' : '등록된 회원이 없습니다'}
              </p>
            </div>
          ) : (
            filteredMembers.map((member) => (
              <div
                key={member.id}
                className="w-full bg-[#1c1c1c] border border-gray-800 rounded-xl p-4 flex items-center justify-between hover:bg-gray-800 transition"
              >
                {editingMemberId === member.id ? (
                  <>
                    <input
                      type="text"
                      value={editingMemberName}
                      onChange={(e) => setEditingMemberName(e.target.value)}
                      className="flex-1 px-3 py-2 bg-[#111110] border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(member.id);
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                    />
                    <div className="flex gap-2 ml-3">
                      <button
                        onClick={() => handleSaveEdit(member.id)}
                        className="p-2 text-emerald-400 hover:bg-emerald-900/20 rounded-lg transition"
                      >
                        <Check size={18} />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="p-2 text-gray-400 hover:bg-gray-700 rounded-lg transition"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => navigate(`/member/${member.id}`)}
                      className="flex-1 text-left"
                    >
                      <p className="text-white font-medium">
                        {getDisplayName(member, members)} · {member.workoutCount}회
                      </p>
                      <p className="text-gray-500 text-sm mt-1">
                        {member.lastWorkoutDate
                          ? `마지막 수업: ${new Date(member.lastWorkoutDate).toLocaleDateString('ko-KR', { year: 'numeric', month: 'numeric', day: 'numeric' }).replace(/\. /g, '. ')}`
                          : '수업 기록 없음'}
                      </p>
                    </button>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditMember(member);
                        }}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMemberToDelete(member);
                        }}
                        className="p-2 hover:bg-red-900/20 rounded-lg transition"
                      >
                        <Trash2 size={18} className="text-red-400" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {showAddMember && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-6 z-50">
          <div className="bg-[#1c1c1c] border border-gray-800 rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-white mb-4">새 회원 추가</h2>
            <form onSubmit={handleAddMember}>
              <input
                type="text"
                placeholder="회원 이름"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                className="w-full px-4 py-3 bg-[#111110] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition mb-4"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddMember(false);
                    setNewMemberName('');
                  }}
                  className="flex-1 px-4 py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-700 transition"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={loading || !newMemberName.trim()}
                  className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '추가 중...' : '추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {memberToDelete && (
        <ConfirmDialog
          message="정말 삭제하시겠습니까?"
          onConfirm={handleDeleteMember}
          onCancel={() => setMemberToDelete(null)}
        />
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
