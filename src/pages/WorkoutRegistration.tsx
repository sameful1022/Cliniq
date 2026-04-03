import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { supabase, Trainer, Member, ExerciseLibrary, WorkoutExercise } from '../lib/supabase';
import { getDisplayName } from '../lib/memberUtils';
import { getKSTDateString } from '../lib/dateUtils';
import Toast from '../components/Toast';

interface SelectedExercise extends WorkoutExercise {
  id: string;
}

export default function WorkoutRegistration() {
  const navigate = useNavigate();
  const { memberId } = useParams();
  const [trainer, setTrainer] = useState<Trainer | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [exercises, setExercises] = useState<ExerciseLibrary[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedExercises, setSelectedExercises] = useState<SelectedExercise[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [saving, setSaving] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [workoutDate, setWorkoutDate] = useState<string>('');

  useEffect(() => {
    const storedTrainer = localStorage.getItem('trainer');
    if (!storedTrainer) {
      navigate('/');
      return;
    }
    const trainerData = JSON.parse(storedTrainer);
    setTrainer(trainerData);

    const params = new URLSearchParams(window.location.search);
    const dateParam = params.get('date');
    const dateToUse = dateParam || getKSTDateString();
    setWorkoutDate(dateToUse);

    loadData(trainerData.id);
  }, [memberId, navigate]);

  const loadData = async (trainerId: string) => {
    if (!memberId) return;

    const { data: memberData } = await supabase
      .from('members')
      .select('*')
      .eq('id', memberId)
      .single();

    if (memberData) setMember(memberData);

    const { data: allMembersData } = await supabase
      .from('members')
      .select('*')
      .eq('trainer_id', trainerId);

    if (allMembersData) setAllMembers(allMembersData);

    const { data: exercisesData } = await supabase
      .from('exercise_library')
      .select('*')
      .eq('trainer_id', trainerId)
      .order('category', { ascending: true });

    if (exercisesData) {
      setExercises(exercisesData);
      const uniqueCategories = [...new Set(exercisesData.map(e => e.category))];
      setCategories(uniqueCategories);
    }

    setIsInitialLoading(false);
  };

  const handleExerciseSelect = (exercise: ExerciseLibrary) => {
    const newExercise: SelectedExercise = {
      id: crypto.randomUUID(),
      exercise_name: exercise.name,
      weight: 0
    };
    setSelectedExercises([...selectedExercises, newExercise]);
    setSelectedCategory(null);
  };

  const handleWeightChange = (id: string, weight: number) => {
    setSelectedExercises(selectedExercises.map(ex =>
      ex.id === id ? { ...ex, weight } : ex
    ));
  };

  const handleRemoveExercise = (id: string) => {
    setSelectedExercises(selectedExercises.filter(ex => ex.id !== id));
  };

  const handleSave = async () => {
    if (!trainer || !memberId) return;

    if (selectedExercises.length === 0) {
      setToast({ message: '운동을 추가해주세요', type: 'error' });
      return;
    }

    const hasInvalidWeight = selectedExercises.some(ex => ex.weight < 0);
    if (hasInvalidWeight) {
      setToast({ message: '모든 운동의 무게를 입력해주세요', type: 'error' });
      return;
    }

    setSaving(true);

    try {
      const exerciseList = selectedExercises.map(({ exercise_name, weight }) => ({
        exercise_name,
        weight
      }));

      const { data: existingWorkout } = await supabase
        .from('workouts')
        .select('*')
        .eq('member_id', memberId)
        .eq('date', workoutDate)
        .maybeSingle();

      if (existingWorkout) {
        const updatedExercises = [...(existingWorkout.exercises || []), ...exerciseList];
        await supabase
          .from('workouts')
          .update({ exercises: updatedExercises })
          .eq('id', existingWorkout.id);
      } else {
        await supabase
          .from('workouts')
          .insert([{
            member_id: memberId,
            trainer_id: trainer.id,
            date: workoutDate,
            exercises: exerciseList
          }]);
      }

      setToast({ message: '운동이 저장되었습니다', type: 'success' });
      setTimeout(() => {
        navigate(`/member/${memberId}`);
      }, 1000);
    } catch (error) {
      setToast({ message: '저장에 실패했습니다', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const categoryExercises = selectedCategory
    ? exercises.filter(e => e.category === selectedCategory)
    : [];

  if (!trainer || !member || isInitialLoading) {
    return (
      <div className="min-h-screen bg-[#111110] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111110] pb-32 page-transition">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-8">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate(`/member/${memberId}`);
            }}
            className="p-2 bg-[#1c1c1c] border border-gray-800 text-gray-300 rounded-xl hover:bg-gray-800 active:bg-gray-700 transition touch-manipulation"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-3xl font-bold text-white">{getDisplayName(member, allMembers)}</h1>
        </div>

        <div className="space-y-6">
          {selectedExercises.length > 0 && (
            <div className="bg-[#1c1c1c] border border-gray-800 rounded-xl p-6">
              <h2 className="text-white font-semibold mb-4">선택된 운동</h2>
              <div className="space-y-3">
                {selectedExercises.map((exercise) => (
                  <div key={exercise.id} className="bg-[#111110] rounded-lg p-4 flex items-center gap-4">
                    <div className="flex-1">
                      <p className="text-white font-medium mb-2">{exercise.exercise_name}</p>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          inputMode="numeric"
                          value={exercise.weight || ''}
                          onChange={(e) => handleWeightChange(exercise.id, Number(e.target.value))}
                          className="w-24 px-3 py-2 bg-[#1c1c1c] border border-gray-700 rounded-lg text-white text-center focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                          placeholder="0"
                        />
                        <span className="text-gray-400">kg</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRemoveExercise(exercise.id);
                      }}
                      className="p-2 text-gray-400 hover:text-red-400 active:text-red-500 transition touch-manipulation"
                    >
                      <X size={20} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-[#1c1c1c] border border-gray-800 rounded-xl p-6">
            <h2 className="text-white font-semibold mb-4">운동 추가</h2>

            {!selectedCategory ? (
              <div>
                <p className="text-gray-400 text-sm mb-3">카테고리 선택</p>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setSelectedCategory(category)}
                      className="py-3 px-4 bg-[#111110] border border-gray-700 text-white rounded-lg hover:bg-gray-800 active:bg-gray-700 transition font-medium"
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-gray-400 text-sm">{selectedCategory}</p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedCategory(null);
                    }}
                    className="text-sm text-gray-400 hover:text-white active:text-gray-300 transition touch-manipulation"
                  >
                    뒤로
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {categoryExercises.map((exercise) => (
                    <button
                      key={exercise.id}
                      type="button"
                      onClick={() => handleExerciseSelect(exercise)}
                      className="py-3 px-4 bg-[#111110] border border-gray-700 text-white rounded-lg hover:bg-gray-800 active:bg-gray-700 transition font-medium text-left"
                    >
                      {exercise.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#111110] via-[#111110] to-transparent">
        <div className="max-w-4xl mx-auto space-y-3">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSave();
            }}
            disabled={saving || selectedExercises.length === 0}
            className="w-full py-4 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 active:bg-emerald-800 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg touch-manipulation"
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>

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
