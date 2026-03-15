import { useRef, useState, useMemo, useCallback } from 'react';
import { Upload } from 'lucide-react';
import { validateWorkoutJson } from '../model/validation';
import { friendlyError, highlightJson } from '../model/jsonEditorUtils';
import { Button, Modal, ModalHeader, ModalTitle, ModalBody, ModalActions } from '../../../shared/ui';
import styles from './ImportModal.module.css';

function extractJson(text: string): string {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  return jsonMatch ? jsonMatch[1].trim() : text.trim();
}

export function ImportModal({
  onClose,
  onImport,
}: {
  onClose: () => void;
  onImport: (json: string) => void;
}) {
  const [text, setText] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);

  const validation = useMemo(() => {
    if (!text.trim()) return null;
    try {
      const json = extractJson(text);
      const data: unknown = JSON.parse(json);
      const dto = validateWorkoutJson(data);
      return { valid: true as const, summary: `${dto.title} — ${dto.exercises.length} упр.` };
    } catch (err) {
      return { valid: false as const, message: friendlyError(err) };
    }
  }, [text]);

  const highlighted = useMemo(() => highlightJson(text) + '\n', [text]);

  const syncScroll = useCallback(() => {
    if (textareaRef.current && preRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setText(await file.text());
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSubmit = () => {
    if (!validation?.valid) return;
    onImport(extractJson(text));
  };

  return (
    <Modal open onClose={onClose} tall size="wide">
      <ModalHeader>
        <ModalTitle>Импорт тренировки</ModalTitle>
      </ModalHeader>
      <ModalBody>
        <div className={styles.editorWrap}>
          <pre
            ref={preRef}
            className={styles.editorHighlight}
            aria-hidden
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
          <textarea
            ref={textareaRef}
            className={styles.editorInput}
            placeholder="Вставьте JSON тренировки"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onScroll={syncScroll}
            autoFocus
            spellCheck={false}
          />
        </div>
        {validation && !validation.valid && <div className={styles.error}>{validation.message}</div>}
        {validation?.valid && <div className={styles.success}>{validation.summary}</div>}
      </ModalBody>
      <ModalActions>
        <Button variant="secondary" size="sm" onClick={onClose}>
          Отмена
        </Button>
        <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
          <Upload size={14} /> Из файла
        </Button>
        <Button variant="primary" size="sm" onClick={handleSubmit} disabled={!validation?.valid}>
          Импортировать
        </Button>
      </ModalActions>
      <input
        ref={fileRef}
        type="file"
        accept=".json"
        onChange={handleFile}
        hidden
      />
    </Modal>
  );
}
