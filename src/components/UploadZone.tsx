'use client';
import { useRef, useState, useEffect } from 'react';
import JSZip from 'jszip';

interface Props {
  onFile: (text: string, filename: string) => void;
  disabled?: boolean;
  resetKey?: number;
}

type FileState = 'idle' | 'extracting' | 'ready' | 'error';

export default function UploadZone({ onFile, disabled, resetKey }: Props) {
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileState, setFileState] = useState<FileState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset internal state saat parent meminta reset
  useEffect(() => {
    if (resetKey !== undefined && resetKey > 0) {
      setFileName('');
      setFileState('idle');
      setErrorMsg('');
    }
  }, [resetKey]);

  const processFile = async (file: File) => {
    setErrorMsg('');
    const name = file.name.toLowerCase();

    if (!name.endsWith('.zip') && !name.endsWith('.txt')) {
      setErrorMsg('Format tidak didukung. Gunakan .zip atau .txt dari export WhatsApp.');
      setFileState('error');
      return;
    }

    if (name.endsWith('.zip')) {
      // Extract .txt from inside the ZIP
      setFileState('extracting');
      try {
        const zip = new JSZip();
        const loaded = await zip.loadAsync(file);
        // Find the first .txt file inside the zip
        const txtEntry = Object.values(loaded.files).find(
          (f) => !f.dir && f.name.toLowerCase().endsWith('.txt')
        );
        if (!txtEntry) {
          setErrorMsg('Tidak ada file .txt di dalam ZIP. Pastikan file export WA valid.');
          setFileState('error');
          return;
        }
        const text = await txtEntry.async('string');
        setFileName(`${file.name} → ${txtEntry.name}`);
        setFileState('ready');
        onFile(text, txtEntry.name);
      } catch {
        setErrorMsg('Gagal membaca file ZIP. Coba export ulang dari WhatsApp.');
        setFileState('error');
      }
    } else {
      // Plain .txt file
      setFileState('extracting');
      const reader = new FileReader();
      reader.onload = (e) => {
        setFileName(file.name);
        setFileState('ready');
        onFile(e.target?.result as string, file.name);
      };
      reader.onerror = () => {
        setErrorMsg('Gagal membaca file .txt.');
        setFileState('error');
      };
      reader.readAsText(file, 'utf-8');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) processFile(f);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) processFile(f);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleClick = () => {
    if (!disabled) inputRef.current?.click();
  };

  const isReady = fileState === 'ready';
  const isExtracting = fileState === 'extracting';
  const isError = fileState === 'error';

  return (
    <div
      className={`upload-zone${dragging ? ' drag-over' : ''}${isReady ? ' has-file' : ''}${isError ? ' error-state' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={handleClick}
      style={isError ? { borderColor: 'var(--hot)', background: 'rgba(239,68,68,0.05)' } : undefined}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".zip,.txt"
        onChange={handleChange}
        style={{ display: 'none' }}
        disabled={disabled || isExtracting}
      />

      {isExtracting && (
        <>
          <div className="upload-icon">⏳</div>
          <div className="upload-title">Membaca file...</div>
          <div className="upload-sub">Sedang mengekstrak chat dari ZIP</div>
          <div style={{ marginTop: 12 }}>
            <span style={{ width: 24, height: 24, border: '2px solid rgba(99,102,241,0.3)', borderTopColor: 'var(--accent)', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
          </div>
        </>
      )}

      {isReady && (
        <>
          <div className="upload-icon">✅</div>
          <div className="upload-title">File Siap Diproses!</div>
          <div className="file-selected-info">📄 {fileName}</div>
          <div className="upload-sub" style={{ marginTop: 8 }}>Klik untuk ganti file</div>
        </>
      )}

      {isError && (
        <>
          <div className="upload-icon">❌</div>
          <div className="upload-title" style={{ color: 'var(--hot)' }}>Gagal Membaca File</div>
          <div className="upload-sub" style={{ color: 'var(--hot)', opacity: 0.8 }}>{errorMsg}</div>
          <div className="upload-hint" style={{ borderColor: 'rgba(239,68,68,0.3)', color: 'var(--hot)', background: 'rgba(239,68,68,0.1)', marginTop: 12 }}>
            Klik untuk pilih file lain
          </div>
        </>
      )}

      {fileState === 'idle' && (
        <>
          <div className="upload-icon">💬</div>
          <div className="upload-title">Upload Export Chat WhatsApp</div>
          <div className="upload-sub">Drag & drop atau klik untuk pilih file</div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 12 }}>
            <div className="upload-hint">📦 .zip (Export WA langsung)</div>
            <div className="upload-hint">📄 .txt (ekstrak manual)</div>
          </div>
        </>
      )}
    </div>
  );
}
