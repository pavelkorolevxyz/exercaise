import { useRef, useState, useMemo, useCallback } from 'react';
import { validateWorkoutJson } from '../model/validation';
import { mapWorkoutDto, unmapWorkout } from '../model/mappers';
import { friendlyError, highlightJson } from '../model/jsonEditorUtils';
import { useWorkoutStore } from '../store/workoutStore';
import { Button, Modal, ModalHeader, ModalTitle, ModalBody, ModalActions } from '../../../shared/ui';
import type { Workout } from '../model/types';
import styles from './ImportModal.module.css';

export function EditWorkoutModal({
  workout,
  onClose,
}: {
  workout: Workout;
  onClose: () => void;
}) {
  const update = useWorkoutStore((s) => s.update);
  const initialJson = useMemo(
    () => JSON.stringify(unmapWorkout(workout), null, 2),
    [workout],
  );
  const [text, setText] = useState(initialJson);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);

  const validation = useMemo(() => {
    if (!text.trim()) return null;
    try {
      const data: unknown = JSON.parse(text);
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

  const handleSubmit = () => {
    if (!validation?.valid) return;
    const data: unknown = JSON.parse(text);
    const dto = validateWorkoutJson(data);
    const updated = mapWorkoutDto(dto, workout.id);
    update(workout.id, updated);
    onClose();
  };

  return (
    <Modal open onClose={onClose} tall size="wide">
      <ModalHeader>
        <ModalTitle>Редактирование тренировки</ModalTitle>
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
        <Button variant="primary" size="sm" onClick={handleSubmit} disabled={!validation?.valid}>
          Сохранить
        </Button>
      </ModalActions>
    </Modal>
  );
}
