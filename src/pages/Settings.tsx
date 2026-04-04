import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import { supabase, Trainer, ExerciseLibrary } from '../lib/supabase';
import Toast from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Settings() {
  const navigate = useNavigate();
  const [trainer, setTrainer] = useState<Trainer | null>(null);
  const [exercises, setExercises] = useState<ExerciseLibrary[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [addingExerciseCategory, setAddingExerciseCategory] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newExerciseName, setNewExerciseName] = useState('');
  const [editingExercise, setEditingExercise] = useState<ExerciseLibrary | null>(null);
  const [editedName, setEditedName] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);

  useEffect(() => {
    const storedTrainer = localStorage.getItem('trainer');
    if (!storedTrainer) {
      navigate('/');
      return;
    }
    const trainerData = JSON.parse(storedTrainer);
    setTrainer(trainerData);
    loadExercises(trainerData.id);
  }, [navigate]);

  const loadExercises = async (trainerId: string) => {
    const { data } = await supabase
      .from('exercise_library')
      .select('*')
      .eq('trainer_id', trainerId)
      .order('category', { ascending: true });

    if (data) {
      if (data.length === 0) {
        await initializeDefaultExercises(trainerId);
        return;
      }

      setExercises(data);
      const uniqueCategories = [...new Set(data.map(e => e.category))];
      setCategories(uniqueCategories);
      if (uniqueCategories.length > 0 && !selectedCategory) {
        setSelectedCategory(uniqueCategories[0]);
      }
    }
  };

  const initializeDefaultExercises = async (trainerId: string) => {
    const defaultExercises = [
      { category: '가슴', name: '벤치프레스' },
      { category: '가슴', name: '인클라인 벤치프레스' },
      { category: '가슴', name: '덤벨플라이' },
      { category: '가슴', name: '케이블 크로스오버' },
      { category: '등', name: '랫풀다운' },
      { category: '등', name: '시티드 로우' },
      { category: '등', name: '바벨 로우' },
      { category: '등', name: '데드리프트' },
      { category: '하체', name: '스쿼트' },
      { category: '하체', name: '레그프레스' },
      { category: '하체', name: '런지' },
      { category: '하체', name: '레그컬' },
      { category: '하체', name: '레그익스텐션' },
      { category: '어깨', name: '밀리터리프레스' },
      { category: '어깨', name: '사이드 레터럴 레이즈' },
      { category: '어깨', name: '프론트 레이즈' },
      { category: '어깨', name: '리어 델트 플라이' },
      { category: '팔', name: '바벨 컬' },
      { category: '팔', name: '해머 컬' },
      { category: '팔', name: '트라이셉스 푸시다운' },
      { category: '팔', name: '오버헤드 익스텐션' },
    ];

    const exercisesToInsert = defaultExercises.map(ex => ({
      trainer_id: trainerId,
      category: ex.category,
      name: ex.name
    }));

    await supabase
      .from('exercise_library')
      .insert(exercisesToInsert);

    await loadExercises(trainerId);
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trainer || !newCategoryName.trim()) return;

    if (categories.includes(newCategoryName.trim())) {
      setToast({ message: '카테고리 중복', type: 'error' });
      return;
    }

    setCategories([...categories, newCategoryName.trim()]);
    setSelectedCategory(newCategoryName.trim());
    setNewCategoryName('');
    setShowAddCategory(false);
  };

  const handleAddExercise = async (category: string) => {
    if (!trainer || !newExerciseName.trim()) {
      setAddingExerciseCategory(null);
      setNewExerciseName('');
      return;
    }

    setLoading(true);
    try {
      await supabase
        .from('exercise_library')
        .insert([{
          trainer_id: trainer.id,
          category: category,
          name: newExerciseName.trim()
        }]);

      setNewExerciseName('');
      setAddingExerciseCategory(null);
      await loadExercises(trainer.id);
    } catch (err) {
      console.error('Error adding exercise:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (category: string) => {
    if (!trainer) return;

    setConfirmDialog({
      message: `"${category}" 카테고리를 삭제하시겠습니까?\n이 카테고리의 모든 운동이 함께 삭제됩니다.`,
      onConfirm: async () => {
        setConfirmDialog(null);
        setLoading(true);
        try {
          await supabase
            .from('exercise_library')
            .delete()
            .eq('trainer_id', trainer.id)
            .eq('category', category);

          await loadExercises(trainer.id);
          if (selectedCategory === category) {
            setSelectedCategory(categories.filter(c => c !== category)[0] || '');
          }
        } catch (err) {
          console.error('Error deleting category:', err);
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleDeleteExercise = async (exerciseId: string) => {
    setConfirmDialog({
      message: '이 운동을 삭제하시겠습니까?',
      onConfirm: async () => {
        setConfirmDialog(null);
        setLoading(true);
        try {
          await supabase
            .from('exercise_library')
            .delete()
            .eq('id', exerciseId);

          await loadExercises(trainer!.id);
        } catch (err) {
          console.error('Error deleting exercise:', err);
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleEditExercise = (exercise: ExerciseLibrary) => {
    setEditingExercise(exercise);
    setEditedName(exercise.name);
  };

  const handleSaveEdit = async () => {
    if (!editingExercise || !editedName.trim()) return;

    setLoading(true);
    try {
      await supabase
        .from('exercise_library')
        .update({ name: editedName.trim() })
        .eq('id', editingExercise.id);

      setEditingExercise(null);
      setEditedName('');
      await loadExercises(trainer!.id);
    } catch (err) {
      console.error('Error updating exercise:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredExercises = selectedCategory
    ? exercises.filter(e => e.category === selectedCategory)
    : [];

  if (!trainer) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#111110] page-transition">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-[#1c1c1c] border border-gray-800 text-gray-300 rounded-xl hover:bg-gray-800 transition"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">운동 라이브러리</h1>
        </div>

        <div className="mb-6">
          <button
            onClick={() => setShowAddCategory(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition text-sm w-full sm:w-auto justify-center"
          >
            <Plus size={16} />
            카테고리 추가
          </button>
        </div>

        <div className="space-y-6">
          {categories.map((category) => {
            const categoryExercises = exercises.filter(e => e.category === category);
            return (
              <div key={category}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm text-gray-400">{category}</h2>
                  <button
                    onClick={() => handleDeleteCategory(category)}
                    className="p-1.5 text-red-400 hover:text-red-300 transition"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="bg-[#1c1c1c] border border-gray-800 rounded-xl overflow-hidden">
                  <div className="divide-y divide-gray-800">
                    {categoryExercises.map((exercise) => (
                      <div
                        key={exercise.id}
                        className="p-4 flex items-center justify-between"
                      >
                        {editingExercise?.id === exercise.id ? (
                          <div className="flex-1 flex items-center gap-2">
                            <input
                              type="text"
                              value={editedName}
                              onChange={(e) => setEditedName(e.target.value)}
                              className="flex-1 px-3 py-2 bg-[#111110] border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                              autoFocus
                            />
                            <button
                              onClick={handleSaveEdit}
                              disabled={loading}
                              className="p-2 text-emerald-400 hover:text-emerald-300 transition"
                            >
                              <Check size={18} />
                            </button>
                            <button
                              onClick={() => {
                                setEditingExercise(null);
                                setEditedName('');
                              }}
                              className="p-2 text-gray-400 hover:text-gray-300 transition"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <p className="text-white">{exercise.name}</p>
                            <div className="flex gap-1 sm:gap-2">
                              <button
                                onClick={() => handleEditExercise(exercise)}
                                className="p-2 text-gray-400 hover:text-white transition"
                              >
                                <Pencil size={18} />
                              </button>
                              <button
                                onClick={() => handleDeleteExercise(exercise.id)}
                                className="p-2 text-red-400 hover:text-red-300 transition"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>

                  {addingExerciseCategory === category ? (
                    <div className="w-full p-4 border-t border-gray-800">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="운동 이름 입력"
                          value={newExerciseName}
                          onChange={(e) => setNewExerciseName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleAddExercise(category);
                            } else if (e.key === 'Escape') {
                              setAddingExerciseCategory(null);
                              setNewExerciseName('');
                            }
                          }}
                          className="flex-1 px-4 py-3 bg-[#111110] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                          autoFocus
                        />
                        <button
                          onClick={() => handleAddExercise(category)}
                          disabled={loading || !newExerciseName.trim()}
                          className="px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          저장
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setAddingExerciseCategory(category);
                        setNewExerciseName('');
                      }}
                      className="w-full p-4 text-emerald-400 hover:text-emerald-300 hover:bg-[#111110] transition flex items-center justify-center gap-2 border-t border-gray-800"
                    >
                      <Plus size={18} />
                      운동 추가
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showAddCategory && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-6 z-50">
          <div className="bg-[#1c1c1c] border border-gray-800 rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-white mb-4">새 카테고리 추가</h2>
            <form onSubmit={handleAddCategory}>
              <input
                type="text"
                placeholder="카테고리 이름"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="w-full px-4 py-3 bg-[#111110] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition mb-4"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddCategory(false);
                    setNewCategoryName('');
                  }}
                  className="flex-1 px-4 py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-700 transition"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={!newCategoryName.trim()}
                  className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  추가
                </button>
              </div>
            </form>
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

      {confirmDialog && (
        <ConfirmDialog
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </div>
  );
}
