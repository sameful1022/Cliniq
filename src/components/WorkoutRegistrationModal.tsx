import { useState } from 'react';
import { Plus, X, Trash2 } from 'lucide-react';
import { ExerciseLibrary, WorkoutExercise } from '../lib/supabase';

interface WorkoutRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  exercises: ExerciseLibrary[];
  onSave: (exercises: WorkoutExercise[]) => Promise<void>;
}

export default function WorkoutRegistrationModal({
  isOpen,
  onClose,
  categories,
  exercises,
  onSave
}: WorkoutRegistrationModalProps) {
  const [currentExercises, setCurrentExercises] = useState<WorkoutExercise[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedExercise, setSelectedExercise] = useState<ExerciseLibrary | null>(null);
  const [weight, setWeight] = useState('');
  const [loading, setLoading] = useState(false);

  const filteredExercises = selectedCategory
    ? exercises.filter(e => e.category === selectedCategory)
    : [];

  const handleAddExercise = () => {
    if (!selectedExercise || !weight) return;

    const newExercise: WorkoutExercise = {
      exercise_id: selectedExercise.id,
      exercise_name: selectedExercise.name,
      category: selectedExercise.category,
      sets: 0,
      reps: 0,
      weight: parseFloat(weight)
    };

    setCurrentExercises([...currentExercises, newExercise]);
    setSelectedCategory('');
    setSelectedExercise(null);
    setWeight('');
  };

  const handleRemoveExercise = (index: number) => {
    setCurrentExercises(currentExercises.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (currentExercises.length === 0) return;

    setLoading(true);
    try {
      await onSave(currentExercises);
      setCurrentExercises([]);
      setSelectedCategory('');
      setSelectedExercise(null);
      setWeight('');
      onClose();
    } catch (err) {
      console.error('Error saving workout:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-[#111110] w-full sm:max-w-2xl sm:rounded-xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#111110] border-b border-gray-800 p-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">오늘 운동 등록</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition"
          >
            <X size={20} className="text-gray-300" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {currentExercises.length > 0 && (
            <div className="bg-[#1c1c1c] border border-gray-800 rounded-xl p-4">
              <div className="space-y-3">
                {currentExercises.map((exercise, index) => (
                  <div key={index} className="bg-[#111110] rounded-lg p-4 flex justify-between items-start">
                    <div>
                      <p className="text-white font-medium">{exercise.exercise_name}</p>
                      <p className="text-gray-400 text-sm mt-1">
                        {exercise.weight}kg
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveExercise(index)}
                      className="text-red-400 hover:text-red-300 transition"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-[#1c1c1c] border border-gray-800 rounded-xl p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">카테고리</label>
              <div className="flex gap-2 flex-wrap">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => {
                      setSelectedCategory(category);
                      setSelectedExercise(null);
                    }}
                    className={`px-4 py-2 rounded-xl transition ${
                      selectedCategory === category
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[#111110] border border-gray-700 text-gray-300 hover:bg-gray-800'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {selectedCategory && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">운동</label>
                <div className="flex gap-2 flex-wrap">
                  {filteredExercises.map((exercise) => (
                    <button
                      key={exercise.id}
                      onClick={() => setSelectedExercise(exercise)}
                      className={`px-4 py-2 rounded-xl transition ${
                        selectedExercise?.id === exercise.id
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#111110] border border-gray-700 text-gray-300 hover:bg-gray-800'
                      }`}
                    >
                      {exercise.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedExercise && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">중량(kg)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full px-4 py-3 bg-[#111110] border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                    placeholder="0"
                    min="0"
                  />
                </div>

                <button
                  onClick={handleAddExercise}
                  disabled={!weight}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus size={18} />
                  운동 추가
                </button>
              </>
            )}
          </div>

          {currentExercises.length > 0 && (
            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full px-4 py-4 bg-white text-black rounded-xl hover:bg-gray-200 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '저장 중...' : '저장'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
