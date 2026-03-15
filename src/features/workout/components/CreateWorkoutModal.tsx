import { useState, useMemo } from 'react';
import { Dices, Sparkles } from 'lucide-react';
import { Button, Modal, ModalHeader, ModalTitle, ModalBody, ModalActions } from '../../../shared/ui';
import { pickRandomWorkout } from '../model/surpriseWorkouts';
import { useWorkoutStore } from '../store/workoutStore';
import type { Workout } from '../model/types';
import styles from './CreateWorkoutModal.module.css';

const CHATGPT_PROMPT_BASE = `Создай JSON-файл тренировки для приложения Exercaise.

Формат JSON:
{
  "title": "Название тренировки",
  "exercises": [
    {
      "title": "Название упражнения",
      "description": "Краткая инструкция — 1-2 предложения",
      "repeat_count": 10,
      "set_count": 3,
      "rest_seconds": 60,
      "tempo": { "to": 1, "hold": 0, "from": 1 }
    }
  ]
}

Правила:
- Все тексты на русском языке
- description — коротко и понятно, 1-2 предложения максимум
- tempo.to — секунды на движение, tempo.hold — удержание, tempo.from — возврат
- Упражнения на время: repeat_count=1, tempo.to=0, tempo.hold=длительность, tempo.from=0
- Одностороннее упражнение (только левая/правая) — два отдельных упражнения. Но если стороны чередуются в рамках повторения (наклоны вперёд-назад-влево-вправо, выпады со сменой ног) — одно упражнение
- Начинай с разминки, заканчивай растяжкой
- rest_seconds последнего упражнения = 0`;

function buildChatGptUrl(userRequest: string) {
  const prompt = `${CHATGPT_PROMPT_BASE}\n\nЗапрос пользователя: ${userRequest}`;
  return `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`;
}

export function CreateWorkoutModal({
  onClose,
  onSurprise,
}: {
  onClose: () => void;
  onSurprise?: (workout: Workout) => void;
}) {
  const [request, setRequest] = useState('');
  const workouts = useWorkoutStore(s => s.workouts);
  const existingTitles = useMemo(() => workouts.map(w => w.title), [workouts]);

  const handleSubmit = () => {
    if (!request.trim()) return;
    window.open(buildChatGptUrl(request.trim()), '_blank', 'noopener,noreferrer');
    onClose();
  };

  const handleSurprise = () => {
    const workout = pickRandomWorkout(existingTitles);
    onSurprise?.(workout);
  };

  return (
    <Modal open onClose={onClose}>
      <ModalHeader>
        <ModalTitle>Создать тренировку</ModalTitle>
      </ModalHeader>
      <ModalBody>
        <textarea
          className={styles.modalInput}
          placeholder="Опишите тренировку, например: разминка для шеи и плеч на 10 минут"
          value={request}
          onChange={(e) => setRequest(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          autoFocus
          rows={3}
        />
      </ModalBody>
      <ModalActions>
        <Button variant="secondary" size="sm" onClick={onClose}>
          Отмена
        </Button>
        <Button variant="secondary" size="sm" onClick={handleSurprise}>
          <Dices size={14} /> Удиви меня
        </Button>
        <Button variant="primary" size="sm" onClick={handleSubmit} disabled={!request.trim()}>
          <Sparkles size={14} /> Создать в ChatGPT
        </Button>
      </ModalActions>
    </Modal>
  );
}
