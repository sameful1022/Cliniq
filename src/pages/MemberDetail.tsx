import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase, Trainer, Member, Workout } from '../lib/supabase';
import { getDisplayName } from '../lib/memberUtils';
import { getKSTDateString, formatDateToKorean } from '../lib/dateUtils';
import Toast from '../components/Toast';
import Calendar from '../components/Calendar';
import ConfirmDialog from '../components/ConfirmDialog';

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
  const [expandedExerciseIndex, setExpandedExerciseIndex] = useState<string | null>(null);
  const [isPreviousWorkoutExpanded, setIsPreviousWorkoutExpanded] = useState(true);
  const [isSelectedWorkoutExpanded, setIsSelectedWorkoutExpanded] = useState(true);
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null);

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
        setToast({ message: '삭제 실패', type: 'error' });
        setDeleteConfirmIndex(null);
        return;
      }

      setToast({ message: '기록 삭제 완료', type: 'success' });
    } else {
      const { error } = await supabase
        .from('workouts')
        .update({ exercises: updatedExercises })
        .eq('id', selectedWorkout.id);

      if (error) {
        setToast({ message: '삭제 실패', type: 'error' });
        setDeleteConfirmIndex(null);
        return;
      }

      setToast({ message: '삭제 완료', type: 'success' });
    }

    setDeleteConfirmIndex(null);
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
            <div className="bg-[#1c1c1c] border border-gray-800 rounded-xl overflow-hidden">
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-800 transition"
                onClick={() => setIsPreviousWorkoutExpanded(!isPreviousWorkoutExpanded)}
              >
                <p className="text-gray-400 text-sm">
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
                {isPreviousWorkoutExpanded ? (
                  <ChevronUp size={20} className="text-gray-400" />
                ) : (
                  <ChevronDown size={20} className="text-gray-400" />
                )}
              </div>

              {isPreviousWorkoutExpanded && (
                <div className="px-4 pb-4 space-y-3">
                  {previousWorkout.exercises.map((exercise, index) => {
                    const sets = exercise.sets || [];
                    const isExpanded = expandedExerciseIndex === `prev-${index}`;

                    return (
                      <div key={index} className="bg-[#111110] rounded-lg overflow-hidden">
                        <div
                          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-900 transition"
                          onClick={() => setExpandedExerciseIndex(isExpanded ? null : `prev-${index}`)}
                        >
                          <p className="text-white font-medium">{exercise.exercise_name}</p>
                          {isExpanded ? (
                            <ChevronUp size={20} className="text-gray-400" />
                          ) : (
                            <ChevronDown size={20} className="text-gray-400" />
                          )}
                        </div>

                        {isExpanded && (
                          <div className="px-4 pb-4 space-y-2">
                            {sets.map((set, setIndex) => (
                              <div key={setIndex} className="text-gray-400 text-sm">
                                {setIndex + 1}세트 · {set.weight}kg · {set.reps}회
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
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
          <div className="bg-[#1c1c1c] border border-gray-800 rounded-xl overflow-hidden">
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-800 transition"
              onClick={() => setIsSelectedWorkoutExpanded(!isSelectedWorkoutExpanded)}
            >
              <p className="text-gray-400 text-sm">
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
              {isSelectedWorkoutExpanded ? (
                <ChevronUp size={20} className="text-gray-400" />
              ) : (
                <ChevronDown size={20} className="text-gray-400" />
              )}
            </div>

            {isSelectedWorkoutExpanded && (
              <div className="px-4 pb-4 space-y-3">
                {selectedWorkout.exercises.map((exercise, index) => {
                  const sets = exercise.sets || [];
                  const isExpanded = expandedExerciseIndex === `selected-${index}`;

                  return (
                    <div key={index} className="bg-[#111110] rounded-lg overflow-hidden">
                      <div
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-900 transition"
                        onClick={() => setExpandedExerciseIndex(isExpanded ? null : `selected-${index}`)}
                      >
                        <p className="text-white font-medium">{exercise.exercise_name}</p>
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronUp size={20} className="text-gray-400" />
                          ) : (
                            <ChevronDown size={20} className="text-gray-400" />
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmIndex(index);
                            }}
                            className="p-2 text-gray-400 hover:text-red-400 transition"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="px-4 pb-4 space-y-2">
                          {sets.map((set, setIndex) => (
                            <div key={setIndex} className="text-gray-400 text-sm">
                              {setIndex + 1}세트 · {set.weight}kg · {set.reps}회
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
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

      {deleteConfirmIndex !== null && (
        <ConfirmDialog
          message="이 운동 기록을 삭제하시겠습니까?"
          onConfirm={() => handleDeleteExercise(deleteConfirmIndex)}
          onCancel={() => setDeleteConfirmIndex(null)}
        />
      )}
    </div>
  );
}
