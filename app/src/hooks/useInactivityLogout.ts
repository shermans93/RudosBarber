import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const INACTIVITY_LIMIT_MS = 15 * 60 * 1000;
const WARNING_COUNTDOWN_S = 60;
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'touchstart', 'scroll'] as const;

export function useInactivityLogout() {
  const { logout } = useAuth();
  const [warningVisible, setWarningVisible] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(WARNING_COUNTDOWN_S);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const startInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      setSecondsLeft(WARNING_COUNTDOWN_S);
      setWarningVisible(true);
    }, INACTIVITY_LIMIT_MS);
  }, []);

  const continueSession = useCallback(() => {
    setWarningVisible(false);
    startInactivityTimer();
  }, [startInactivityTimer]);

  // Cuenta regresiva mientras el aviso está visible: si llega a 0, cierra sesión.
  useEffect(() => {
    if (!warningVisible) return;
    countdownTimer.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          logout();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (countdownTimer.current) clearInterval(countdownTimer.current);
    };
  }, [warningVisible, logout]);

  // Reinicia el temporizador de inactividad con cualquier actividad, salvo mientras
  // se muestra el aviso: ahí se exige clic explícito en "Seguir conectado" (no basta
  // con mover el mouse), ya que el aviso existe justamente para confirmar presencia.
  useEffect(() => {
    startInactivityTimer();
    function handleActivity() {
      if (warningVisible) return;
      startInactivityTimer();
    }
    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, handleActivity));
    return () => {
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, handleActivity));
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [startInactivityTimer, warningVisible]);

  return { warningVisible, secondsLeft, continueSession };
}
