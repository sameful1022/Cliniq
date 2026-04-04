import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Entry() {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuthState = async () => {
      try {
        const trainerData = localStorage.getItem('trainer');
        const hasVisited = localStorage.getItem('hasVisited');
        const storedName = localStorage.getItem('trainerName');

        if (trainerData) {
          const trainer = JSON.parse(trainerData);
          const { data: exists } = await supabase
            .from('trainers')
            .select('id')
            .eq('id', trainer.id)
            .maybeSingle();

          if (exists) {
            navigate('/dashboard', { replace: true });
            return;
          } else {
            localStorage.removeItem('trainer');
          }
        }

        if (hasVisited !== 'true') {
          navigate('/landing', { replace: true });
          return;
        }

        if (storedName) {
          const { data: trainer } = await supabase
            .from('trainers')
            .select('id')
            .eq('name', storedName)
            .maybeSingle();

          if (trainer) {
            navigate('/signup', { replace: true });
            return;
          } else {
            localStorage.removeItem('trainerName');
            localStorage.removeItem('hasVisited');
            navigate('/landing', { replace: true });
            return;
          }
        }

        navigate('/landing', { replace: true });
      } catch (error) {
        console.error('Auth check error:', error);
        navigate('/landing', { replace: true });
      } finally {
        setIsChecking(false);
      }
    };

    checkAuthState();
  }, [navigate]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-[#111110] flex items-center justify-center">
        <div className="text-white">로딩 중...</div>
      </div>
    );
  }

  return null;
}
