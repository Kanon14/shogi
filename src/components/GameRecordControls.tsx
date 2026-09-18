import { Download, Upload } from 'lucide-react';
import { useRef, useState } from 'react';

type GameRecordControlsProps = {
  onExport: () => void;
  onImport: (file: File) => Promise<void>;
};

export function GameRecordControls({ onExport, onImport }: GameRecordControlsProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  const importFile = async (file: File | undefined) => {
    if (!file) return;

    try {
      await onImport(file);
      setMessage('Game imported');
      setHasError(false);
    } catch {
      setMessage('Could not import this game record');
      setHasError(true);
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <section className="game-record" aria-label="Game record">
      <h2>Game record</h2>
      <div className="record-controls">
        <button type="button" onClick={onExport}>
          <Download size={18} aria-hidden="true" />
          Export game
        </button>
        <label className="import-button">
          <Upload size={18} aria-hidden="true" />
          Import game
          <input
            ref={inputRef}
            className="sr-only"
            type="file"
            accept="application/json,.json"
            aria-label="Import game record"
            onChange={(event) => void importFile(event.target.files?.[0])}
          />
        </label>
      </div>
      {message ? <p className={hasError ? 'record-message error' : 'record-message'} role={hasError ? 'alert' : 'status'}>{message}</p> : null}
    </section>
  );
}
