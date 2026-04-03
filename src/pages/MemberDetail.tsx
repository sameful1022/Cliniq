import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react';
import { supabase, Trainer, Member, Workout } from '../lib/supabase';
import { getDisplayName } from '../lib/memberUtils';
import { getKSTDateString, formatDateToKorean } from '../lib/dateUtils';
import Toast from '../components/Toast';
import Calendar from '../components/Calendar';

export default function MemberDetail() {
  const navigate = useNavigate();
  const { memberId } = useParams();
  const [trainer, setTrainer] = useState<Trainer | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [workoutCount, setWorkoutCount] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [previousWorkout, setPreviousWorkout] = useState<Workout | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [editingExerciseIndex, setEditingExerciseIndex] = useState<number | null>(null);
  const [editWeight, setEditWeight] = useState<number>(0);

  useEffect(() => {
    const storedTrainer = localStorage.getItem('trainer');
    if (!storedTrainer) {
      navigate('/');
      return;
    }
    const trainerData = JSON.parse(storedTrainer);
    setTrainer(trainerData);
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

    const { data: workoutsData } = await supabase
      .from('workouts')
      .select('*')
      .eq('member_id', memberId)
      .order('date', { ascending: false });

    if (workoutsData) {
      setWorkouts(workoutsData);
      setWorkoutCount(workoutsData.length);

      // Set today's date as selected by default (using KST)
      const todayString = getKSTDateString();
      setSelectedDate(todayString);

      // Check if there's a workout for today
      const todayWorkout = workoutsData.find(w => {
        const workoutDate = typeof w.date === 'string' ? w.date : w.date.toString();
        return workoutDate === todayString;
      });
      setSelectedWorkout(todayWorkout || null);

      // Find the most recent workout before today
      const pastWorkout = workoutsData.find(w => {
        const workoutDate = typeof w.date === 'string' ? w.date : w.date.toString();
        return workoutDate < todayString;
      });
      setPreviousWorkout(pastWorkout || null);
    }

    setIsInitialLoading(false);
  };

  const workoutDates = new Set(workouts.map(w => {
    const workoutDate = typeof w.date === 'string' ? w.date : w.date.toString();
    return workoutDate;
  }));

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    const workout = workouts.find(w => {
      const workoutDate = typeof w.date === 'string' ? w.date : w.date.toString();
      return workoutDate === date;
    });
    setSelectedWorkout(workout || null);
    setEditingExerciseIndex(null);
  };

  const handleEditExercise = (index: number, currentWeight: number) => {
    setEditingExerciseIndex(index);
    setEditWeight(currentWeight);
  };

  const handleSaveEdit = async (index: number) => {
    if (!selectedWorkout) return;

    const updatedExercises = [...selectedWorkout.exercises];
    updatedExercises[index] = { ...updatedExercises[index], weight: editWeight };

    const { error } = await supabase
      .from('workouts')
      .update({ exercises: updatedExercises })
      .eq('id', selectedWorkout.id);

    if (error) {
      setToast({ message: '수정에 실패했습니다', type: 'error' });
      return;
    }

    setToast({ message: '운동이 수정되었습니다', type: 'success' });
    setEditingExerciseIndex(null);

    if (trainer) {
      await loadData(trainer.id);
    }
  };

  const handleDeleteExercise = async (index: number) => {
    if (!selectedWorkout) return;

    const updatedExercises = selectedWorkout.exercises.filter((_, i) => i !== index);

    if (updatedExercises.length === 0) {
      const { error } = await supabase
        .from('workouts')
        .delete()
        .eq('id', selectedWorkout.id);

      if (error) {
        setToast({ message: '삭제에 실패했습니다', type: 'error' });
        return;
      }

      setToast({ message: '운동 기록이 삭제되었습니다', type: 'success' });
    } else {
      const { error } = await supabase
        .from('workouts')
        .update({ exercises: updatedExercises })
        .eq('id', selectedWorkout.id);

      if (error) {
        setToast({ message: '삭제에 실패했습니다', type: 'error' });
        return;
      }

      setToast({ message: '운동이 삭제되었습니다', type: 'success' });
    }

    if (trainer) {
      await loadData(trainer.id);
    }
  };

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
    <div className="min-h-screen bg-[#111110] pb-24 page-transition">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-1">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 bg-[#1c1c1c] border border-gray-800 text-gray-300 rounded-xl hover:bg-gray-800 transition"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-3xl font-bold text-white">{getDisplayName(member, allMembers)}</h1>
          </div>
          <div className="ml-14">
            <p className="text-sm text-gray-400">총 {workoutCount}회 수업</p>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-3">직전 수업</h2>
          {previousWorkout ? (
            <div className="bg-[#1c1c1c] border border-gray-800 rounded-xl p-6 mb-6">
              <p className="text-gray-400 text-sm mb-4">
                {(() => {
                  const workoutDate = typeof previousWorkout.date === 'string' ? previousWorkout.date : previousWorkout.date.toString();
                  const [year, month, day] = workoutDate.split('-').map(Number);
                  const date = new Date(year, month - 1, day);
                  return date.toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'long'
                  });
                })()}
              </p>
              <div className="space-y-3">
                {previousWorkout.exercises.map((exercise, index) => (
                  <div key={index} className="bg-[#111110] rounded-lg p-4">
                    <p className="text-white font-medium">
                      {exercise.exercise_name} · {exercise.weight}kg
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-[#1c1c1c] border border-gray-800 rounded-xl p-6 mb-6">
              <p className="text-gray-400 text-center">이전 운동 기록이 없습니다</p>
            </div>
          )}
        </div>

        <div className="mb-6">
          <Calendar
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
            workoutDates={workoutDates}
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
          />
        </div>

        {selectedWorkout && selectedDate && (
          <div className="bg-[#1c1c1c] border border-gray-800 rounded-xl p-6">
            <p className="text-gray-400 text-sm mb-4">
              {(() => {
                const [year, month, day] = selectedDate.split('-').map(Number);
                const date = new Date(year, month - 1, day);
                return date.toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long'
                });
              })()}
            </p>
            <div className="space-y-3">
              {selectedWorkout.exercises.map((exercise, index) => (
                <div key={index} className="bg-[#111110] rounded-lg p-4">
                  {editingExerciseIndex === index ? (
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <p className="text-white font-medium mb-2">{exercise.exercise_name}</p>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            inputMode="numeric"
                            value={editWeight}
                            onChange={(e) => setEditWeight(Number(e.target.value))}
                            className="w-24 px-3 py-2 bg-[#1c1c1c] border border-gray-700 rounded-lg text-white text-center focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                            autoFocus
                          />
                          <span className="text-gray-400">kg</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveEdit(index)}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm font-medium"
                        >
                          저장
                        </button>
                        <button
                          onClick={() => setEditingExerciseIndex(null)}
                          className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition text-sm font-medium"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="text-white font-medium">
                        {exercise.exercise_name} · {exercise.weight}kg
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditExercise(index, exercise.weight)}
                          className="p-2 text-gray-400 hover:text-emerald-400 transition"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteExercise(index)}
                          className="p-2 text-gray-400 hover:text-red-400 transition"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#111110] via-[#111110] to-transparent">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate(`/member/${memberId}/workout?date=${selectedDate}`)}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-white text-black rounded-xl hover:bg-gray-200 transition font-semibold shadow-lg"
          >
            <Plus size={20} />
            {selectedDate ? formatDateToKorean(selectedDate) : ''} 운동 등록
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
