import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Plus, Minus, Check, ChevronDown, ChevronUp, Settings } from 'lucide-react';
import { supabase, Trainer, Member, ExerciseLibrary } from '../lib/supabase';
import { getDisplayName } from '../lib/memberUtils';
import { getKSTDateString } from '../lib/dateUtils';
import Toast from '../components/Toast';

interface ExerciseSet {
  id: string;
  weight: number;
  reps: number;
  completed: boolean;
}

interface SelectedExercise {
  id: string;
  exercise_name: string;
  sets: ExerciseSet[];
  saved: boolean;
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
  const [showExerciseSelector, setShowExerciseSelector] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(true);
  const [workoutDate, setWorkoutDate] = useState<string>('');
  const [savingExerciseId, setSavingExerciseId] = useState<string | null>(null);
  const [collapsedExercises, setCollapsedExercises] = useState<Set<string>>(new Set());
  const [editingField, setEditingField] = useState<{ exerciseId: string; setId: string; field: 'weight' | 'reps' } | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');

  useEffect(() => {
    const storedTrainer = localStorage.getItem('trainer');
    console.log('localStorage trainer key:', storedTrainer);
    if (!storedTrainer) {
      navigate('/');
      return;
    }
    const trainerData = JSON.parse(storedTrainer);
    console.log('Parsed trainer data:', trainerData);
    console.log('Trainer ID being used:', trainerData.id);
    setTrainer(trainerData);

    const params = new URLSearchParams(window.location.search);
    const dateParam = params.get('date');
    const dateToUse = dateParam || getKSTDateString();
    setWorkoutDate(dateToUse);

    loadData(trainerData.id);
  }, [memberId, navigate]);

  const createDefaultExercises = async (trainerId: string) => {
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

    await supabase.from('exercise_library').insert(exercisesToInsert);
  };

  const loadData = async (trainerId: string) => {
    try {
      if (memberId) {
        const { data: memberData } = await supabase
          .from('members')
          .select('*')
          .eq('id', memberId)
          .maybeSingle();

        if (memberData) setMember(memberData);
      }

      const { data: allMembersData } = await supabase
        .from('members')
        .select('*')
        .eq('trainer_id', trainerId);

      if (allMembersData) setAllMembers(allMembersData);

      console.log('Fetching exercises for trainer_id:', trainerId);
      const { data: exercisesData, error: exercisesError } = await supabase
        .from('exercise_library')
        .select('*')
        .eq('trainer_id', trainerId)
        .order('category', { ascending: true });

      console.log('Exercises data:', exercisesData);
      console.log('Exercises error:', exercisesError);

      if (exercisesData && exercisesData.length === 0) {
        console.log('Exercise library is empty, creating default exercises');
        await createDefaultExercises(trainerId);

        const { data: reloadedExercises } = await supabase
          .from('exercise_library')
          .select('*')
          .eq('trainer_id', trainerId)
          .order('category', { ascending: true });

        if (reloadedExercises) {
          setExercises(reloadedExercises);
          const uniqueCategories = [...new Set(reloadedExercises.map(e => e.category))];
          console.log('Categories:', uniqueCategories);
          setCategories(uniqueCategories);
        }
      } else if (exercisesData) {
        setExercises(exercisesData);
        const uniqueCategories = [...new Set(exercisesData.map(e => e.category))];
        console.log('Categories:', uniqueCategories);
        setCategories(uniqueCategories);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
  };

  const handleExerciseClick = (exercise: ExerciseLibrary) => {
    // Remove any unsaved exercises before adding a new one
    const savedExercisesOnly = selectedExercises.filter(ex => ex.saved);

    const newExercise: SelectedExercise = {
      id: crypto.randomUUID(),
      exercise_name: exercise.name,
      sets: [
        {
          id: crypto.randomUUID(),
          weight: 0,
          reps: 10,
          completed: false
        }
      ],
      saved: false
    };
    setSelectedExercises([...savedExercisesOnly, newExercise]);
    setSelectedCategory(null);
    setShowExerciseSelector(false);
  };

  const handleAddExercise = () => {
    // Remove any unsaved exercises before going back to selector
    const savedExercisesOnly = selectedExercises.filter(ex => ex.saved);
    setSelectedExercises(savedExercisesOnly);
    setShowExerciseSelector(true);
    setSelectedCategory(null);
  };

  const handleAddSet = (exerciseId: string) => {
    setSelectedExercises(selectedExercises.map(ex => {
      if (ex.id === exerciseId) {
        const lastSet = ex.sets[ex.sets.length - 1];
        const newSet: ExerciseSet = {
          id: crypto.randomUUID(),
          weight: lastSet.weight,
          reps: lastSet.reps,
          completed: false
        };
        return { ...ex, sets: [...ex.sets, newSet] };
      }
      return ex;
    }));
  };

  const handleToggleSetComplete = (exerciseId: string, setId: string) => {
    setSelectedExercises(selectedExercises.map(ex => {
      if (ex.id === exerciseId) {
        return {
          ...ex,
          sets: ex.sets.map(s =>
            s.id === setId ? { ...s, completed: !s.completed } : s
          )
        };
      }
      return ex;
    }));
  };

  const handleWeightChange = (exerciseId: string, setId: string, delta: number) => {
    setSelectedExercises(selectedExercises.map(ex => {
      if (ex.id === exerciseId) {
        return {
          ...ex,
          sets: ex.sets.map(s =>
            s.id === setId ? { ...s, weight: Math.max(0, s.weight + delta) } : s
          )
        };
      }
      return ex;
    }));
  };

  const handleRepsChange = (exerciseId: string, setId: string, delta: number) => {
    setSelectedExercises(selectedExercises.map(ex => {
      if (ex.id === exerciseId) {
        return {
          ...ex,
          sets: ex.sets.map(s =>
            s.id === setId ? { ...s, reps: Math.max(1, s.reps + delta) } : s
          )
        };
      }
      return ex;
    }));
  };

  const calculateTotalVolume = (exercise: SelectedExercise): number => {
    return exercise.sets.reduce((total, set) => {
      return total + (set.weight * set.reps);
    }, 0);
  };

  const handleSaveExercise = async (exerciseId: string) => {
    if (!trainer || !memberId) return;

    const exercise = selectedExercises.find(ex => ex.id === exerciseId);
    if (!exercise) return;

    setSavingExerciseId(exerciseId);

    try {
      const exerciseData = {
        exercise_name: exercise.exercise_name,
        sets: exercise.sets.map(({ weight, reps, completed }) => ({
          weight,
          reps,
          completed
        }))
      };

      const { data: existingWorkout } = await supabase
        .from('workouts')
        .select('*')
        .eq('member_id', memberId)
        .eq('date', workoutDate)
        .maybeSingle();

      if (existingWorkout) {
        const updatedExercises = [...(existingWorkout.exercises || []), exerciseData];
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
            exercises: [exerciseData]
          }]);
      }

      setSelectedExercises(selectedExercises.map(ex =>
        ex.id === exerciseId ? { ...ex, saved: true } : ex
      ));

      setTimeout(() => {
        setSavingExerciseId(null);
        setToast({ message: '저장이 완료되었습니다', type: 'success' });
        setCollapsedExercises(prev => new Set(prev).add(exerciseId));
      }, 500);
    } catch (error) {
      console.error('Error saving exercise:', error);
      setToast({ message: '저장 실패', type: 'error' });
      setSavingExerciseId(null);
    }
  };

  const handleToggleCollapse = (exerciseId: string) => {
    setCollapsedExercises(prev => {
      const newSet = new Set(prev);
      if (newSet.has(exerciseId)) {
        newSet.delete(exerciseId);
      } else {
        newSet.add(exerciseId);
      }
      return newSet;
    });
  };

  const handleStartEditing = (exerciseId: string, setId: string, field: 'weight' | 'reps', currentValue: number) => {
    setEditingField({ exerciseId, setId, field });
    setEditingValue('');
  };

  const handleFinishEditing = () => {
    if (!editingField) return;

    const { exerciseId, setId, field } = editingField;
    let value = parseFloat(editingValue) || 0;

    if (field === 'weight') {
      value = Math.max(0, value);
    } else {
      value = Math.max(1, value);
    }

    setSelectedExercises(selectedExercises.map(ex => {
      if (ex.id === exerciseId) {
        return {
          ...ex,
          sets: ex.sets.map(s =>
            s.id === setId ? { ...s, [field]: value } : s
          )
        };
      }
      return ex;
    }));

    setEditingField(null);
    setEditingValue('');
  };

  const categoryExercises = selectedCategory
    ? exercises.filter(e => e.category === selectedCategory)
    : [];

  if (loading || !trainer || !member) {
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
    <div className="min-h-screen bg-[#111110] pb-32">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/member/${memberId}`)}
              className="p-2 bg-[#1c1c1c] border border-gray-800 text-gray-300 rounded-xl hover:bg-gray-800 transition"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-3xl font-bold text-white">{getDisplayName(member, allMembers)}</h1>
          </div>
          <button
            onClick={() => navigate('/settings')}
            className="px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium text-sm"
          >
            운동 부위 및 종류 설정
          </button>
        </div>

        {selectedExercises.length > 0 && !showExerciseSelector && (
          <>
            <button
              onClick={() => {
                // Remove any unsaved exercises when going back
                const savedExercisesOnly = selectedExercises.filter(ex => ex.saved);
                setSelectedExercises(savedExercisesOnly);
                setShowExerciseSelector(true);
              }}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition mb-4"
            >
              <ArrowLeft size={18} />
              <span className="font-medium">운동 선택</span>
            </button>
            <div className="space-y-4 mb-6">
              {selectedExercises.map((exercise) => {
                const isCollapsed = collapsedExercises.has(exercise.id);
                return (
                  <div
                    key={exercise.id}
                    className="bg-[#1c1c1c] border border-gray-800 rounded-xl transition-all duration-300"
                  >
                    <button
                      onClick={() => handleToggleCollapse(exercise.id)}
                      className="w-full flex items-center justify-between p-5 hover:bg-gray-800/50 transition rounded-xl"
                    >
                      <h3 className="text-white font-semibold text-lg">{exercise.exercise_name}</h3>
                      {isCollapsed ? (
                        <ChevronDown size={20} className="text-gray-400" />
                      ) : (
                        <ChevronUp size={20} className="text-gray-400" />
                      )}
                    </button>

                  <div
                    className="overflow-hidden transition-all duration-300"
                    style={{
                      maxHeight: isCollapsed ? '0px' : '2000px',
                      opacity: isCollapsed ? 0 : 1,
                    }}
                  >
                    <div className="px-5 pb-5">
                      <div className="space-y-3 mb-3">
                    {exercise.sets.map((set, index) => (
                      <div key={set.id} className="flex items-center gap-3">
                        <button
                          onClick={() => handleToggleSetComplete(exercise.id, set.id)}
                          className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition flex-shrink-0 ${
                            set.completed
                              ? 'bg-emerald-500 border-emerald-500'
                              : 'border-gray-600 hover:border-emerald-500'
                          }`}
                        >
                          {set.completed ? (
                            <Check size={18} className="text-white" />
                          ) : (
                            <span className="text-gray-400 text-sm font-medium">{index + 1}</span>
                          )}
                        </button>

                        <div className="flex-1 grid grid-cols-2 gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            {editingField?.exerciseId === exercise.id && editingField?.setId === set.id && editingField?.field === 'weight' ? (
                              <input
                                type="number"
                                inputMode="decimal"
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                onBlur={handleFinishEditing}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleFinishEditing();
                                  }
                                }}
                                autoFocus
                                className="w-full min-w-0 bg-emerald-600 border border-emerald-500 rounded-lg px-3 py-2.5 text-center text-white font-medium text-base focus:outline-none focus:ring-2 focus:ring-emerald-400"
                              />
                            ) : (
                              <button
                                onClick={() => handleStartEditing(exercise.id, set.id, 'weight', set.weight)}
                                className="w-full min-w-0 bg-[#111110] border border-gray-700 rounded-lg px-3 py-2.5 text-center hover:bg-gray-800 transition"
                              >
                                <span className="text-white font-medium text-base">{set.weight} kg</span>
                              </button>
                            )}
                            <div className="flex flex-col gap-1 flex-shrink-0">
                              <button
                                onClick={() => handleWeightChange(exercise.id, set.id, 2.5)}
                                className="w-7 h-7 flex items-center justify-center bg-[#111110] border border-gray-700 rounded text-gray-300 hover:bg-gray-800 transition"
                              >
                                <Plus size={14} />
                              </button>
                              <button
                                onClick={() => handleWeightChange(exercise.id, set.id, -2.5)}
                                className="w-7 h-7 flex items-center justify-center bg-[#111110] border border-gray-700 rounded text-gray-300 hover:bg-gray-800 transition"
                              >
                                <Minus size={14} />
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 min-w-0">
                            {editingField?.exerciseId === exercise.id && editingField?.setId === set.id && editingField?.field === 'reps' ? (
                              <input
                                type="number"
                                inputMode="numeric"
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                onBlur={handleFinishEditing}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleFinishEditing();
                                  }
                                }}
                                autoFocus
                                className="w-full min-w-0 bg-emerald-600 border border-emerald-500 rounded-lg px-3 py-2.5 text-center text-white font-medium text-base focus:outline-none focus:ring-2 focus:ring-emerald-400"
                              />
                            ) : (
                              <button
                                onClick={() => handleStartEditing(exercise.id, set.id, 'reps', set.reps)}
                                className="w-full min-w-0 bg-[#111110] border border-gray-700 rounded-lg px-3 py-2.5 text-center hover:bg-gray-800 transition"
                              >
                                <span className="text-white font-medium text-base">{set.reps}</span>
                              </button>
                            )}
                            <div className="flex flex-col gap-1 flex-shrink-0">
                              <button
                                onClick={() => handleRepsChange(exercise.id, set.id, 1)}
                                className="w-7 h-7 flex items-center justify-center bg-[#111110] border border-gray-700 rounded text-gray-300 hover:bg-gray-800 transition"
                              >
                                <Plus size={14} />
                              </button>
                              <button
                                onClick={() => handleRepsChange(exercise.id, set.id, -1)}
                                className="w-7 h-7 flex items-center justify-center bg-[#111110] border border-gray-700 rounded text-gray-300 hover:bg-gray-800 transition"
                              >
                                <Minus size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                      <button
                        onClick={() => handleAddSet(exercise.id)}
                        className="w-full py-3 border-2 border-dashed border-gray-700 rounded-lg text-gray-400 hover:border-emerald-500 hover:text-emerald-500 transition font-medium mb-2"
                      >
                        + 세트 추가
                      </button>

                      <button
                        onClick={() => handleSaveExercise(exercise.id)}
                        disabled={savingExerciseId === exercise.id}
                        className="w-full py-3 rounded-lg font-semibold transition bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        <div className="flex items-center justify-center gap-2">
                          {savingExerciseId === exercise.id ? (
                            <span>저장중...</span>
                          ) : (
                            <>
                              <Check size={18} />
                              <span>저장</span>
                            </>
                          )}
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              );
              })}
            </div>
          </>
        )}

        {!showExerciseSelector && (
          <button
            onClick={handleAddExercise}
            className="w-full py-4 bg-[#1c1c1c] border border-gray-700 text-white rounded-xl hover:bg-gray-800 transition font-semibold flex items-center justify-center gap-2 mb-6"
          >
            <Plus size={20} />
            <span>운동 추가</span>
          </button>
        )}

        {showExerciseSelector && (
          <div className="bg-[#1c1c1c] border border-gray-800 rounded-xl p-6 mb-6">
            <div className="mb-4">
              <h2 className="text-white font-semibold">운동 선택</h2>
            </div>

            {!selectedCategory ? (
              <div>
                <p className="text-gray-400 text-sm mb-3">카테고리 선택</p>
                {categories.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400">운동 라이브러리가 비어있습니다.</p>
                    <p className="text-gray-400">설정에서 운동을 추가해주세요.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <button
                        key={category}
                        onClick={() => handleCategoryClick(category)}
                        className="w-full flex items-center justify-between py-3 px-4 bg-[#111110] border border-gray-700 text-white rounded-lg hover:bg-gray-800 transition font-medium"
                      >
                        <span>{category}</span>
                        <ChevronRight size={20} className="text-gray-400" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-gray-400 text-sm">{selectedCategory}</p>
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="text-sm text-gray-400 hover:text-white transition"
                  >
                    ← 부위 선택
                  </button>
                </div>
                <div className="space-y-2">
                  {categoryExercises.map((exercise) => (
                    <button
                      key={exercise.id}
                      onClick={() => handleExerciseClick(exercise)}
                      className="w-full flex items-center justify-between py-3 px-4 bg-[#111110] border border-gray-700 text-white rounded-lg hover:bg-gray-800 transition font-medium"
                    >
                      <span>{exercise.name}</span>
                      <ChevronRight size={20} className="text-gray-400" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
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
