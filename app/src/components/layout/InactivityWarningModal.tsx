import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface InactivityWarningModalProps {
  secondsLeft: number;
  onContinue: () => void;
}

export function InactivityWarningModal({ secondsLeft, onContinue }: InactivityWarningModalProps) {
  return (
    <Modal title="Tu sesión está por cerrar" onClose={onContinue}>
      <p className="text-sm text-muted mb-5">
        Por seguridad, tu sesión se cerrará por inactividad en <strong>{secondsLeft}</strong>{' '}
        segundo{secondsLeft === 1 ? '' : 's'}.
      </p>
      <div className="flex justify-end">
        <Button onClick={onContinue}>Seguir conectado</Button>
      </div>
    </Modal>
  );
}
