import styles from '../components/ImportModal.module.css';

export function friendlyError(err: unknown): string {
  if (err instanceof SyntaxError) return 'Некорректный JSON';
  if (!(err instanceof Error)) return 'Неизвестная ошибка';
  const msg = err.message;

  if (msg.includes('"title" обязательно и должно быть строкой')) return 'Не указано название тренировки (title)';
  if (msg.includes('"exercises" должно быть непустым')) return 'Нет упражнений (exercises)';
  if (msg.includes('должен быть объектом') && !msg.includes('exercises[')) return 'JSON должен быть объектом';

  const exMatch = msg.match(/exercises\[(\d+)\]/);
  if (exMatch) {
    const n = Number(exMatch[1]) + 1;
    if (msg.includes('.title')) return `Упражнение ${n}: не указано название`;
    if (msg.includes('repeat_count')) return `Упражнение ${n}: не указано кол-во повторений`;
    if (msg.includes('set_count')) return `Упражнение ${n}: не указано кол-во подходов`;
    if (msg.includes('rest_seconds')) return `Упражнение ${n}: некорректный отдых`;
    if (msg.includes('tempo')) return `Упражнение ${n}: некорректный темп`;
    if (msg.includes('description')) return `Упражнение ${n}: некорректное описание`;
    return `Упражнение ${n}: ошибка в данных`;
  }

  return msg;
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function highlightJson(text: string): string {
  const regex = /("(?:\\.|[^"\\])*")\s*(:)|("(?:\\.|[^"\\])*")|((?:-?\d+(?:\.\d+)?))|(true|false|null)/g;
  let result = '';
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    result += escapeHtml(text.slice(lastIndex, match.index));

    const [, key, colon, str, num, lit] = match;
    if (key) {
      result += `<span class="${styles.jsonKey}">${escapeHtml(key)}</span>${colon}`;
    } else if (str) {
      result += `<span class="${styles.jsonStr}">${escapeHtml(str)}</span>`;
    } else if (num) {
      result += `<span class="${styles.jsonNum}">${num}</span>`;
    } else if (lit) {
      result += `<span class="${styles.jsonLit}">${lit}</span>`;
    }

    lastIndex = regex.lastIndex;
  }

  result += escapeHtml(text.slice(lastIndex));
  return result;
}
