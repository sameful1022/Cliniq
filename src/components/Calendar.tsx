import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getKSTDateString } from '../lib/dateUtils';

interface CalendarProps {
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  workoutDates: Set<string>;
  selectedDate: string | null;
  onDateSelect: (date: string) => void;
}

export default function Calendar({
  currentMonth,
  onMonthChange,
  workoutDates,
  selectedDate,
  onDateSelect
}: CalendarProps) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const prevMonth = () => {
    const newDate = new Date(year, month - 1, 1);
    onMonthChange(newDate);
  };

  const nextMonth = () => {
    const newDate = new Date(year, month + 1, 1);
    onMonthChange(newDate);
  };

  const formatDateKey = (day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} className="aspect-square" />);
  }

  const todayKST = getKSTDateString();

  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = formatDateKey(day);
    const hasWorkout = workoutDates.has(dateKey);
    const isSelected = selectedDate === dateKey;
    const isToday = todayKST === dateKey;
    const isFuture = dateKey > todayKST;

    days.push(
      <button
        key={day}
        onClick={() => !isFuture && onDateSelect(dateKey)}
        disabled={isFuture}
        className={`aspect-square relative flex flex-col items-center justify-center rounded-lg transition ${
          isFuture ? 'cursor-not-allowed opacity-40' : 'cursor-pointer hover:bg-gray-800'
        } ${isSelected ? 'bg-emerald-600' : ''}`}
      >
        <span className={`text-sm ${isSelected ? 'text-white font-semibold' : isToday ? 'text-emerald-400 font-semibold' : 'text-gray-300'}`}>
          {day}
        </span>
        {hasWorkout && !isFuture && (
          <div className={`w-1 h-1 rounded-full mt-1 ${isSelected ? 'bg-white' : 'bg-white'}`} />
        )}
      </button>
    );
  }

  const monthName = currentMonth.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });

  return (
    <div className="bg-[#1c1c1c] border border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={prevMonth}
          className="p-2 hover:bg-gray-800 rounded-lg transition"
        >
          <ChevronLeft size={20} className="text-gray-300" />
        </button>
        <h3 className="text-lg font-semibold text-white">{monthName}</h3>
        <button
          onClick={nextMonth}
          className="p-2 hover:bg-gray-800 rounded-lg transition"
        >
          <ChevronRight size={20} className="text-gray-300" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2">
        {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days}
      </div>
    </div>
  );
}
