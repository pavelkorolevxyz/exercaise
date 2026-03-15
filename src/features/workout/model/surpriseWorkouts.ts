import type { Exercise, Workout } from './types';
import { generateId } from './importWorkout';

export interface SurpriseWorkout {
  title: string;
  exercises: Exercise[];
}

const t = (to: number, hold: number, from: number) => ({ to, hold, from });

export function pickRandomWorkout(existingTitles: string[]): Workout {
  const existing = new Set(existingTitles);
  const available = surpriseWorkouts.filter(w => !existing.has(w.title));
  const pool = available.length > 0 ? available : surpriseWorkouts;
  const pick = pool[Math.floor(Math.random() * pool.length)];
  return { id: generateId(), title: pick.title, exercises: pick.exercises };
}

export const surpriseWorkouts: SurpriseWorkout[] = [
  {
    title: 'Зомби-апокалипсис',
    exercises: [
      { title: 'Спринт от зомби', description: 'Бег на месте с максимальной скоростью — они уже близко!', repeatCount: 1, setCount: 3, restSeconds: 15, tempo: t(0, 20, 0) },
      { title: 'Перелезание через забор', description: 'Прыжки с подтягиванием коленей к груди — перебирайтесь!', repeatCount: 10, setCount: 3, restSeconds: 15, tempo: t(1, 0, 1) },
      { title: 'Ползком под колючей проволокой', description: 'Планка с переходом в отжимание, прижимайтесь к полу', repeatCount: 8, setCount: 3, restSeconds: 20, tempo: t(2, 1, 2) },
      { title: 'Удар по зомби', description: 'Мощные удары руками перед собой, чередуя левую и правую', repeatCount: 20, setCount: 2, restSeconds: 15, tempo: t(1, 0, 1) },
      { title: 'Притворись мёртвым', description: 'Шавасана — лежите неподвижно, зомби пройдут мимо', repeatCount: 1, setCount: 1, restSeconds: 0, tempo: t(0, 30, 0) },
    ],
  },
  {
    title: 'Тренировка ниндзя',
    exercises: [
      { title: 'Бесшумные приседания', description: 'Медленные приседания — ни звука, ни скрипа', repeatCount: 10, setCount: 3, restSeconds: 15, tempo: t(3, 1, 3) },
      { title: 'Удар ногой в прыжке', description: 'Выпрыгните и имитируйте удар ногой вперёд, чередуйте ноги', repeatCount: 8, setCount: 3, restSeconds: 20, tempo: t(1, 0, 2) },
      { title: 'Перекаты', description: 'Из положения стоя — перекат через плечо на пол и обратно', repeatCount: 6, setCount: 2, restSeconds: 15, tempo: t(2, 0, 2) },
      { title: 'Стойка на одной ноге «цапля»', description: 'Закройте глаза и удерживайте равновесие — как настоящий ниндзя', repeatCount: 2, setCount: 2, restSeconds: 15, tempo: t(2, 15, 2) },
      { title: 'Медитация ниндзя', description: 'Сядьте в позу лотоса, дышите через нос, станьте невидимкой', repeatCount: 1, setCount: 1, restSeconds: 0, tempo: t(0, 40, 0) },
    ],
  },
  {
    title: 'Тренировка на совещании',
    exercises: [
      { title: 'Невидимый пресс', description: 'Сидя на стуле, напрягите пресс и удерживайте — никто не заметит', repeatCount: 1, setCount: 5, restSeconds: 10, tempo: t(0, 15, 0) },
      { title: 'Сжатие кулаков под столом', description: 'Сожмите кулаки со всей силой и медленно разожмите', repeatCount: 10, setCount: 3, restSeconds: 10, tempo: t(1, 3, 2) },
      { title: 'Подъём пяток', description: 'Сидя, поднимайте пятки от пола, напрягая икры', repeatCount: 20, setCount: 3, restSeconds: 10, tempo: t(1, 1, 1) },
      { title: 'Сведение лопаток', description: 'Незаметно сводите и разводите лопатки с прямой спиной', repeatCount: 10, setCount: 3, restSeconds: 10, tempo: t(2, 2, 2) },
      { title: 'Стратегическое потягивание', description: 'Потянитесь «после долгого внимательного слушания» — руки вверх', repeatCount: 3, setCount: 1, restSeconds: 0, tempo: t(3, 3, 3) },
    ],
  },
  {
    title: 'Тренировка супергероя',
    exercises: [
      { title: 'Поза Супермена', description: 'Лёжа на животе, поднимите руки и ноги — вы летите!', repeatCount: 1, setCount: 3, restSeconds: 20, tempo: t(0, 20, 0) },
      { title: 'Паучьи отжимания', description: 'При каждом отжимании подтягивайте колено к локтю', repeatCount: 8, setCount: 3, restSeconds: 25, tempo: t(2, 0, 2) },
      { title: 'Прыжок Халка', description: 'Глубокий присед — мощный прыжок вверх с криком (по желанию)', repeatCount: 8, setCount: 3, restSeconds: 25, tempo: t(2, 0, 1) },
      { title: 'Бросок щита Капитана', description: 'Имитация мощного броска диска — поворот корпуса с махом руки', repeatCount: 10, setCount: 2, restSeconds: 15, tempo: t(1, 0, 2) },
      { title: 'Медитация Доктора Стрэнджа', description: 'Сидя со скрещёнными ногами, пальцы в мудре, дышите глубоко', repeatCount: 1, setCount: 1, restSeconds: 0, tempo: t(0, 40, 0) },
    ],
  },
  {
    title: 'Тренировка котика',
    exercises: [
      { title: 'Потягивание после сна', description: 'Встаньте на четвереньки, вытяните руки вперёд, прогнитесь', repeatCount: 5, setCount: 2, restSeconds: 10, tempo: t(3, 3, 3) },
      { title: 'Точим когти', description: 'Стоя у стены, «царапайте» её руками, растягивая пальцы и предплечья', repeatCount: 10, setCount: 2, restSeconds: 10, tempo: t(1, 1, 1) },
      { title: 'Прыжок за бабочкой', description: 'Выпрыгивайте вверх с вытянутой рукой — почти поймали!', repeatCount: 8, setCount: 2, restSeconds: 15, tempo: t(1, 0, 2) },
      { title: 'Кошачья походка', description: 'Ходьба на четвереньках по комнате — бесшумно и грациозно', repeatCount: 1, setCount: 2, restSeconds: 10, tempo: t(0, 20, 0) },
      { title: 'Свернуться клубком', description: 'Лёжа на боку, подтяните колени к груди и замрите. Мурр...', repeatCount: 1, setCount: 1, restSeconds: 0, tempo: t(0, 30, 0) },
    ],
  },
  {
    title: 'Пиратская тренировка',
    exercises: [
      { title: 'Драим палубу', description: 'Глубокие выпады вперёд с имитацией мытья полов шваброй', repeatCount: 10, setCount: 2, restSeconds: 15, tempo: t(2, 0, 2) },
      { title: 'Лезем на мачту', description: 'Имитация лазания по канату — тянем руки вверх поочерёдно', repeatCount: 12, setCount: 3, restSeconds: 15, tempo: t(1, 0, 1) },
      { title: 'Бой на саблях', description: 'Выпады вперёд с махом руки — фехтуем с воображаемым врагом', repeatCount: 10, setCount: 2, restSeconds: 15, tempo: t(1, 0, 1) },
      { title: 'Качка на палубе', description: 'Стоя на одной ноге, раскачивайтесь — шторм крепчает!', repeatCount: 4, setCount: 2, restSeconds: 15, tempo: t(2, 5, 2) },
      { title: 'Отдых в гамаке', description: 'Лёжа на спине, покачивайте согнутые колени из стороны в сторону', repeatCount: 1, setCount: 1, restSeconds: 0, tempo: t(0, 30, 0) },
    ],
  },
  {
    title: 'Тренировка космонавта',
    exercises: [
      { title: 'Обратный отсчёт', description: 'Присядьте глубоко и выпрыгните вверх — 3, 2, 1, пуск!', repeatCount: 10, setCount: 3, restSeconds: 20, tempo: t(2, 1, 1) },
      { title: 'Невесомость', description: 'Медленные приседания с замедленным подъёмом — вы на МКС', repeatCount: 8, setCount: 2, restSeconds: 15, tempo: t(4, 1, 4) },
      { title: 'Выход в открытый космос', description: 'Планка с поочерёдным вытягиванием рук вперёд — хватаемся за поручни', repeatCount: 8, setCount: 3, restSeconds: 20, tempo: t(2, 2, 2) },
      { title: 'Ремонт обшивки', description: 'Отжимания с поворотом корпуса — работаем в скафандре', repeatCount: 8, setCount: 2, restSeconds: 20, tempo: t(2, 1, 2) },
      { title: 'Парение в невесомости', description: 'Лёжа на спине, поднимите руки и ноги и медленно покачивайтесь', repeatCount: 1, setCount: 1, restSeconds: 0, tempo: t(0, 30, 0) },
    ],
  },
  {
    title: 'Средневековый рыцарь',
    exercises: [
      { title: 'Надеваем доспехи', description: 'Приседания с подъёмом рук — броня тяжёлая!', repeatCount: 10, setCount: 3, restSeconds: 20, tempo: t(3, 0, 3) },
      { title: 'Удар мечом', description: 'Махи руками сверху вниз с поворотом корпуса, чередуйте стороны', repeatCount: 12, setCount: 2, restSeconds: 15, tempo: t(1, 0, 1) },
      { title: 'Щит вверх!', description: 'Подъём воображаемого щита от пояса над головой — быстро!', repeatCount: 10, setCount: 3, restSeconds: 15, tempo: t(1, 1, 2) },
      { title: 'Осада замка', description: 'Берпи — перелезаем через стены, прорываемся!', repeatCount: 6, setCount: 3, restSeconds: 25, tempo: t(2, 0, 2) },
      { title: 'Привал у костра', description: 'Сядьте по-турецки, закройте глаза, отдыхайте перед битвой', repeatCount: 1, setCount: 1, restSeconds: 0, tempo: t(0, 40, 0) },
    ],
  },
  {
    title: 'Тренировка шпиона',
    exercises: [
      { title: 'Лазерная ловушка', description: 'Перешагивайте и подныривайте под воображаемые лучи — выпады и наклоны', repeatCount: 10, setCount: 2, restSeconds: 15, tempo: t(2, 1, 2) },
      { title: 'Побег по крышам', description: 'Прыжки с ноги на ногу — перескакиваем между зданиями', repeatCount: 15, setCount: 3, restSeconds: 15, tempo: t(1, 0, 1) },
      { title: 'Прячемся за углом', description: 'Присядьте к стене и замрите — патруль проходит мимо', repeatCount: 1, setCount: 3, restSeconds: 10, tempo: t(0, 15, 0) },
      { title: 'Взлом сейфа', description: 'Вращения кистей и пальцев — тонкая моторика решает', repeatCount: 15, setCount: 2, restSeconds: 10, tempo: t(1, 0, 1) },
      { title: 'Отчёт в штаб', description: 'Сидя, глубоко дышите — миссия выполнена, агент отдыхает', repeatCount: 1, setCount: 1, restSeconds: 0, tempo: t(0, 30, 0) },
    ],
  },
  {
    title: 'Дискотека 80-х',
    exercises: [
      { title: 'Разогрев диджея', description: 'Вращения рук как будто крутите пластинку, чередуйте стороны', repeatCount: 10, setCount: 2, restSeconds: 10, tempo: t(1, 0, 1) },
      { title: 'Танец робота', description: 'Резкие изолированные движения руками и головой', repeatCount: 12, setCount: 2, restSeconds: 10, tempo: t(1, 1, 1) },
      { title: 'Диско-выпады', description: 'Выпады в стороны с указательным пальцем в потолок — Saturday Night Fever!', repeatCount: 10, setCount: 2, restSeconds: 15, tempo: t(1, 1, 1) },
      { title: 'Moonwalk', description: 'Скольжение назад мелкими шагами — будьте как Майкл!', repeatCount: 1, setCount: 2, restSeconds: 15, tempo: t(0, 20, 0) },
      { title: 'Медляк', description: 'Плавные покачивания и растяжка — дискотека заканчивается', repeatCount: 1, setCount: 1, restSeconds: 0, tempo: t(0, 30, 0) },
    ],
  },
  {
    title: 'Побег из офиса',
    exercises: [
      { title: 'Пригнулись под камерами', description: 'Ходьба гуськом — низкие приседания с движением вперёд', repeatCount: 10, setCount: 2, restSeconds: 15, tempo: t(2, 0, 2) },
      { title: 'Прыжок через турникет', description: 'Выпрыгивания вверх с группировкой коленей к груди', repeatCount: 8, setCount: 3, restSeconds: 15, tempo: t(1, 0, 1) },
      { title: 'Бег по лестнице', description: 'Бег на месте с высоким подъёмом колен — 40 этажей до свободы!', repeatCount: 1, setCount: 3, restSeconds: 15, tempo: t(0, 20, 0) },
      { title: 'Расталкиваем толпу в метро', description: 'Отжимания — пробиваемся к выходу', repeatCount: 10, setCount: 2, restSeconds: 20, tempo: t(2, 0, 2) },
      { title: 'Свобода!', description: 'Лягте на пол и раскиньте руки — вы на природе, рабочий день позади', repeatCount: 1, setCount: 1, restSeconds: 0, tempo: t(0, 30, 0) },
    ],
  },
  {
    title: 'Тренировка динозавра',
    exercises: [
      { title: 'Шаги T-Rex', description: 'Ходьба с прижатыми к корпусу короткими руками и высокими коленями', repeatCount: 1, setCount: 2, restSeconds: 10, tempo: t(0, 20, 0) },
      { title: 'Хвост велоцираптора', description: 'Стоя на одной ноге, делайте махи другой назад — это ваш хвост!', repeatCount: 8, setCount: 2, restSeconds: 15, tempo: t(1, 1, 1) },
      { title: 'Рёв птеродактиля', description: 'Руки в стороны, делайте «махи крыльями» — приседание + подъём рук', repeatCount: 10, setCount: 3, restSeconds: 15, tempo: t(2, 0, 2) },
      { title: 'Топот бронтозавра', description: 'Тяжёлые медленные приседания с ударом ногой в пол', repeatCount: 8, setCount: 3, restSeconds: 20, tempo: t(3, 1, 3) },
      { title: 'Вымирание', description: 'Медленно опуститесь на пол и замрите — метеорит прилетел', repeatCount: 1, setCount: 1, restSeconds: 0, tempo: t(0, 30, 0) },
    ],
  },
  {
    title: 'Робот учится двигаться',
    exercises: [
      { title: 'Калибровка суставов', description: 'Вращения во всех суставах — запястья, локти, плечи, по очереди', repeatCount: 8, setCount: 2, restSeconds: 10, tempo: t(2, 0, 2) },
      { title: 'Тест сервоприводов', description: 'Резкие чёткие приседания с фиксацией в нижней точке — бип-бип', repeatCount: 8, setCount: 3, restSeconds: 15, tempo: t(1, 2, 1) },
      { title: 'Обновление прошивки', description: 'Планка — не двигайтесь, идёт установка обновлений...', repeatCount: 1, setCount: 2, restSeconds: 15, tempo: t(0, 25, 0) },
      { title: 'Боевой режим', description: 'Быстрые выпады вперёд с ударами руками — робот в действии', repeatCount: 10, setCount: 2, restSeconds: 15, tempo: t(1, 0, 1) },
      { title: 'Режим сна', description: 'Медленно «выключитесь»: опустите голову, руки, сядьте, лягте', repeatCount: 1, setCount: 1, restSeconds: 0, tempo: t(0, 20, 0) },
    ],
  },
  {
    title: 'Тренировка медведя',
    exercises: [
      { title: 'Медвежья походка', description: 'Ходьба на четвереньках с прямыми ногами — тяжело, но вы медведь', repeatCount: 1, setCount: 3, restSeconds: 15, tempo: t(0, 20, 0) },
      { title: 'Ловим лосося', description: 'Стоя, резкий наклон вниз и хватательное движение руками', repeatCount: 10, setCount: 2, restSeconds: 15, tempo: t(1, 0, 2) },
      { title: 'Чешем спину о дерево', description: 'Прижмитесь спиной к стене и приседайте вверх-вниз', repeatCount: 8, setCount: 3, restSeconds: 20, tempo: t(2, 0, 2) },
      { title: 'Встаём на задние лапы', description: 'Из приседа медленно поднимайтесь, вытягивая руки вверх — рычите!', repeatCount: 8, setCount: 2, restSeconds: 15, tempo: t(3, 1, 1) },
      { title: 'Зимняя спячка', description: 'Лёжа на боку в позе эмбриона — до весны не будить', repeatCount: 1, setCount: 1, restSeconds: 0, tempo: t(0, 40, 0) },
    ],
  },
  {
    title: 'Тренировка панды',
    exercises: [
      { title: 'Перекаты', description: 'Лёжа на спине, перекатывайтесь с боку на бок — вы круглая панда', repeatCount: 8, setCount: 2, restSeconds: 10, tempo: t(2, 0, 2) },
      { title: 'Жуём бамбук', description: 'Сидя, повороты корпуса — тянемся за воображаемым бамбуком', repeatCount: 10, setCount: 2, restSeconds: 10, tempo: t(2, 1, 2) },
      { title: 'Лезем на дерево', description: 'Подъёмы коленей к груди стоя — ствол скользкий!', repeatCount: 12, setCount: 2, restSeconds: 15, tempo: t(1, 0, 1) },
      { title: 'Кувырок панды', description: 'Из положения стоя — глубокий присед и перекат назад на спину', repeatCount: 6, setCount: 2, restSeconds: 15, tempo: t(2, 0, 2) },
      { title: 'Сон на ветке', description: 'Лягте и свесьте руку и ногу — вы панда на дереве, всё хорошо', repeatCount: 1, setCount: 1, restSeconds: 0, tempo: t(0, 30, 0) },
    ],
  },
  {
    title: 'Тренировка джедая',
    exercises: [
      { title: 'Взмахи световым мечом', description: 'Широкие диагональные махи руками — вжух-вжух!', repeatCount: 12, setCount: 2, restSeconds: 15, tempo: t(1, 0, 1) },
      { title: 'Сила прыжка', description: 'Выпрыгивания с глубокого приседа — используйте Силу!', repeatCount: 8, setCount: 3, restSeconds: 20, tempo: t(2, 0, 1) },
      { title: 'Уклонение от бластеров', description: 'Быстрые наклоны корпуса влево-вправо из положения стоя', repeatCount: 12, setCount: 2, restSeconds: 15, tempo: t(1, 0, 1) },
      { title: 'Подъём X-Wing Силой', description: 'Стоя, медленно поднимайте руки снизу вверх с напряжением — тяжёлый корабль', repeatCount: 6, setCount: 3, restSeconds: 15, tempo: t(3, 2, 3) },
      { title: 'Медитация Йоды', description: 'Сядьте со скрещёнными ногами, закройте глаза. Делай или не делай. Не пытайся', repeatCount: 1, setCount: 1, restSeconds: 0, tempo: t(0, 40, 0) },
    ],
  },
  {
    title: 'Утро понедельника',
    exercises: [
      { title: 'Подъём из кровати', description: 'Лёжа на спине, медленно поднимитесь в сидячее положение. Очень медленно', repeatCount: 3, setCount: 2, restSeconds: 10, tempo: t(5, 2, 3) },
      { title: 'Зомби-ходьба до кухни', description: 'Шаркающая ходьба на месте с вытянутыми руками', repeatCount: 1, setCount: 1, restSeconds: 10, tempo: t(0, 15, 0) },
      { title: 'Поиск кофе', description: 'Повороты корпуса с вытянутой рукой — где чашка?!', repeatCount: 8, setCount: 2, restSeconds: 10, tempo: t(2, 1, 2) },
      { title: 'Ожидание чайника', description: 'Подъёмы на носки — нетерпеливое топтание у плиты', repeatCount: 15, setCount: 2, restSeconds: 10, tempo: t(1, 0, 1) },
      { title: 'Кофе подействовал!', description: 'Jumping Jacks — проснулись! Жизнь прекрасна! Наверное', repeatCount: 15, setCount: 2, restSeconds: 0, tempo: t(1, 0, 1) },
    ],
  },
  {
    title: 'Фитнес для лентяев',
    exercises: [
      { title: 'Подъём пульта', description: 'Лёжа, поднимите руку и медленно опустите. Повторите другой', repeatCount: 6, setCount: 2, restSeconds: 10, tempo: t(2, 1, 2) },
      { title: 'Переключение каналов ногой', description: 'Лёжа, поднимайте ногу и имитируйте нажатие кнопки в воздухе', repeatCount: 8, setCount: 2, restSeconds: 10, tempo: t(2, 1, 2) },
      { title: 'Потягивание за чипсами', description: 'Лёжа на спине, тянитесь руками максимально далеко в сторону', repeatCount: 6, setCount: 2, restSeconds: 10, tempo: t(2, 2, 2) },
      { title: 'Переворот на другой бок', description: 'Перекатитесь с боку на бок — это считается за кардио', repeatCount: 6, setCount: 2, restSeconds: 10, tempo: t(3, 1, 3) },
      { title: 'Усиленный отдых', description: 'Закройте глаза и не двигайтесь — вы это заслужили', repeatCount: 1, setCount: 1, restSeconds: 0, tempo: t(0, 40, 0) },
    ],
  },
  {
    title: 'Тренировка обезьяны',
    exercises: [
      { title: 'Прыжки с ветки на ветку', description: 'Прыжки из стороны в сторону с приземлением в присед', repeatCount: 10, setCount: 3, restSeconds: 15, tempo: t(1, 0, 1) },
      { title: 'Лезем на пальму', description: 'Подъём колен к груди поочерёдно в быстром темпе', repeatCount: 15, setCount: 2, restSeconds: 15, tempo: t(1, 0, 1) },
      { title: 'Чешем подмышки', description: 'Вращения рук в плечевых суставах — разминаем «крылья»', repeatCount: 10, setCount: 2, restSeconds: 10, tempo: t(1, 0, 1) },
      { title: 'Обезьянья походка', description: 'Глубокий присед и передвижение вприсядку — вы примат!', repeatCount: 1, setCount: 2, restSeconds: 15, tempo: t(0, 20, 0) },
      { title: 'Сон на ветке', description: 'Лягте, подложите руки под голову — сиеста в джунглях', repeatCount: 1, setCount: 1, restSeconds: 0, tempo: t(0, 30, 0) },
    ],
  },
  {
    title: 'Тренировка рок-звезды',
    exercises: [
      { title: 'Хэдбенгинг', description: 'Энергичные наклоны головы вперёд-назад — волосы развеваются!', repeatCount: 10, setCount: 2, restSeconds: 10, tempo: t(1, 0, 1) },
      { title: 'Прыжки со сцены', description: 'Выпрыгивания вверх с расставленными руками — crowd surfing!', repeatCount: 8, setCount: 3, restSeconds: 15, tempo: t(1, 0, 2) },
      { title: 'Гитарное соло', description: 'Широкие выпады с имитацией игры на гитаре — зажигаем!', repeatCount: 10, setCount: 2, restSeconds: 10, tempo: t(1, 0, 1) },
      { title: 'Разбиваем гитару', description: 'Мощные махи руками сверху вниз из глубокого приседа', repeatCount: 8, setCount: 2, restSeconds: 15, tempo: t(1, 0, 2) },
      { title: 'Поклон публике', description: 'Глубокий наклон вперёд с расслаблением — спасибо, Вупперталь!', repeatCount: 4, setCount: 1, restSeconds: 0, tempo: t(3, 3, 3) },
    ],
  },
  {
    title: 'Чёрная пятница',
    exercises: [
      { title: 'Спринт к двери магазина', description: 'Бег на месте с ускорением — скидки ждут!', repeatCount: 1, setCount: 3, restSeconds: 10, tempo: t(0, 15, 0) },
      { title: 'Вырываем товар из рук', description: 'Тяговые движения руками к себе — это МОЙ телевизор!', repeatCount: 12, setCount: 2, restSeconds: 10, tempo: t(1, 0, 1) },
      { title: 'Ныряем в кучу', description: 'Берпи — падаем в гору товаров и поднимаемся с добычей', repeatCount: 6, setCount: 3, restSeconds: 20, tempo: t(2, 0, 2) },
      { title: 'Несём пакеты', description: 'Ходьба на месте с поднятыми руками — 20 пакетов за один раз!', repeatCount: 1, setCount: 2, restSeconds: 15, tempo: t(0, 20, 0) },
      { title: 'Лежим с покупками', description: 'Лягте в обнимку с воображаемыми пакетами — кошелёк пуст, но сердце полно', repeatCount: 1, setCount: 1, restSeconds: 0, tempo: t(0, 30, 0) },
    ],
  },
  {
    title: 'Тренировка пингвина',
    exercises: [
      { title: 'Пингвинья ходьба', description: 'Ходьба мелкими шажками с прижатыми к бокам руками — ласты!', repeatCount: 1, setCount: 2, restSeconds: 10, tempo: t(0, 20, 0) },
      { title: 'Нырок за рыбой', description: 'Наклоны вперёд с вытянутыми назад руками — ныряем!', repeatCount: 8, setCount: 2, restSeconds: 15, tempo: t(2, 1, 2) },
      { title: 'Скольжение на пузе', description: 'Планка с лёгким покачиванием — скользим по льду', repeatCount: 1, setCount: 2, restSeconds: 15, tempo: t(0, 20, 0) },
      { title: 'Согреваемся в кругу', description: 'Приседания с обхватом корпуса руками — прижимаемся к соседям', repeatCount: 10, setCount: 2, restSeconds: 15, tempo: t(2, 1, 2) },
      { title: 'Высиживаем яйцо', description: 'Стульчик у стены — нельзя двигаться, яйцо на лапах!', repeatCount: 1, setCount: 1, restSeconds: 0, tempo: t(0, 30, 0) },
    ],
  },
  {
    title: 'Средневековый крестьянин',
    exercises: [
      { title: 'Пашем поле', description: 'Глубокие выпады вперёд с толкающим движением рук — тянем плуг', repeatCount: 10, setCount: 3, restSeconds: 15, tempo: t(2, 0, 2) },
      { title: 'Колем дрова', description: 'Махи сцепленными руками сверху вниз — чурка упрямая!', repeatCount: 12, setCount: 2, restSeconds: 15, tempo: t(1, 0, 2) },
      { title: 'Носим воду', description: 'Приседания с вытянутыми в стороны руками — вёдра не расплескать!', repeatCount: 10, setCount: 3, restSeconds: 20, tempo: t(2, 0, 2) },
      { title: 'Строим забор', description: 'Имитация ударов молотком сверху — приседание и мах рукой', repeatCount: 10, setCount: 2, restSeconds: 15, tempo: t(1, 0, 1) },
      { title: 'Привал под деревом', description: 'Сядьте, вытяните ноги, расслабьте руки — барщина окончена', repeatCount: 1, setCount: 1, restSeconds: 0, tempo: t(0, 30, 0) },
    ],
  },
  {
    title: 'Тренировка геймера',
    exercises: [
      { title: 'Разминка рук перед рейдом', description: 'Быстрые сжимания-разжимания кулаков и вращения кистей', repeatCount: 15, setCount: 2, restSeconds: 10, tempo: t(1, 0, 1) },
      { title: 'Встали из-за компа', description: 'Медленные приседания — ноги отвыкли от нагрузки', repeatCount: 8, setCount: 3, restSeconds: 15, tempo: t(3, 0, 3) },
      { title: 'Раж после проигрыша', description: 'Быстрые отжимания — злость надо куда-то деть!', repeatCount: 10, setCount: 3, restSeconds: 20, tempo: t(1, 0, 1) },
      { title: 'Victory dance', description: 'Jumping Jacks — победный танец, мы выиграли!', repeatCount: 15, setCount: 2, restSeconds: 15, tempo: t(1, 0, 1) },
      { title: 'Загрузка нового уровня', description: 'Стоя, потянитесь вверх и в стороны — перерыв на обновление', repeatCount: 4, setCount: 1, restSeconds: 0, tempo: t(3, 2, 3) },
    ],
  },
  {
    title: 'Тренировка садовника',
    exercises: [
      { title: 'Копаем грядку', description: 'Наклоны с имитацией копания лопатой — земля тяжёлая!', repeatCount: 10, setCount: 3, restSeconds: 15, tempo: t(2, 0, 2) },
      { title: 'Сажаем рассаду', description: 'Глубокие приседания с наклоном — аккуратно, корни нежные', repeatCount: 8, setCount: 2, restSeconds: 15, tempo: t(2, 1, 2) },
      { title: 'Тянем сорняки', description: 'Тяговые движения от пола — крепко схватили и вырвали!', repeatCount: 12, setCount: 2, restSeconds: 15, tempo: t(1, 0, 2) },
      { title: 'Поливаем огород', description: 'Повороты корпуса с вытянутыми руками — шланг длинный', repeatCount: 10, setCount: 2, restSeconds: 10, tempo: t(1, 0, 1) },
      { title: 'Отдых в гамаке', description: 'Лёжа, покачивайтесь и любуйтесь результатом — урожай будет!', repeatCount: 1, setCount: 1, restSeconds: 0, tempo: t(0, 30, 0) },
    ],
  },
  {
    title: 'Подготовка к свиданию',
    exercises: [
      { title: 'Перебираем гардероб', description: 'Приседания с подъёмом рук — достаём вещи с верхней полки', repeatCount: 10, setCount: 2, restSeconds: 10, tempo: t(1, 0, 1) },
      { title: 'Гладим рубашку', description: 'Выпады вперёд с толкающим движением руки — складки не пройдут!', repeatCount: 8, setCount: 2, restSeconds: 10, tempo: t(2, 0, 2) },
      { title: 'Бежим на автобус', description: 'Бег на месте с ускорением — опаздываем!', repeatCount: 1, setCount: 2, restSeconds: 10, tempo: t(0, 20, 0) },
      { title: 'Нервно ждём у ресторана', description: 'Подъёмы на носки и обратно — топчемся от волнения', repeatCount: 15, setCount: 2, restSeconds: 10, tempo: t(1, 0, 1) },
      { title: 'Выдыхаем', description: 'Глубокое дыхание — всё будет отлично, вы прекрасны', repeatCount: 4, setCount: 1, restSeconds: 0, tempo: t(4, 2, 6) },
    ],
  },
  {
    title: 'Тренировка строителя',
    exercises: [
      { title: 'Кладём кирпичи', description: 'Приседания с подъёмом воображаемого кирпича от пола наверх', repeatCount: 12, setCount: 3, restSeconds: 20, tempo: t(2, 0, 2) },
      { title: 'Забиваем гвозди', description: 'Махи рукой сверху вниз — ровно и с первого раза!', repeatCount: 12, setCount: 2, restSeconds: 15, tempo: t(1, 0, 1) },
      { title: 'Несём бревно', description: 'Планка на вытянутых руках — держим крепко!', repeatCount: 1, setCount: 3, restSeconds: 20, tempo: t(0, 20, 0) },
      { title: 'Красим стену', description: 'Махи руками вверх-вниз стоя у стены — ровные мазки!', repeatCount: 12, setCount: 2, restSeconds: 15, tempo: t(1, 0, 1) },
      { title: 'Обеденный перерыв', description: 'Сядьте, вытяните ноги, откиньтесь назад — термос и бутерброды', repeatCount: 1, setCount: 1, restSeconds: 0, tempo: t(0, 30, 0) },
    ],
  },
  {
    title: 'Миссия на Марс',
    exercises: [
      { title: 'Тест скафандра', description: 'Медленные приседания с широко расставленными ногами — скафандр жёсткий', repeatCount: 8, setCount: 2, restSeconds: 15, tempo: t(3, 1, 3) },
      { title: 'Сбор образцов грунта', description: 'Наклоны к полу с поворотом — кладём камни в контейнер', repeatCount: 10, setCount: 2, restSeconds: 15, tempo: t(2, 1, 2) },
      { title: 'Прыжки в низкой гравитации', description: 'Мягкие замедленные прыжки на месте — вы весите 38 кг!', repeatCount: 10, setCount: 2, restSeconds: 15, tempo: t(2, 2, 2) },
      { title: 'Установка антенны', description: 'Стоя на носках, тянитесь руками вверх — антенна должна быть ровной', repeatCount: 8, setCount: 2, restSeconds: 15, tempo: t(2, 3, 2) },
      { title: 'Закат на Марсе', description: 'Сядьте и смотрите вдаль — синий закат, вы первый человек здесь', repeatCount: 1, setCount: 1, restSeconds: 0, tempo: t(0, 40, 0) },
    ],
  },
  {
    title: 'Тренировка кота-воришки',
    exercises: [
      { title: 'Крадёмся к столу', description: 'Бесшумная ходьба гуськом на носочках — хозяин спит', repeatCount: 1, setCount: 2, restSeconds: 10, tempo: t(0, 15, 0) },
      { title: 'Прыжок на стол', description: 'Выпрыгивание вверх из приседа — одним махом!', repeatCount: 6, setCount: 3, restSeconds: 15, tempo: t(2, 0, 1) },
      { title: 'Скидываем вещи со стола', description: 'Махи рук в стороны — бокал, ручка, ваза... одно удовольствие', repeatCount: 10, setCount: 2, restSeconds: 10, tempo: t(1, 0, 1) },
      { title: 'Убегаем с колбасой', description: 'Быстрый бег на месте — хозяин проснулся!', repeatCount: 1, setCount: 2, restSeconds: 15, tempo: t(0, 15, 0) },
      { title: 'Притворяемся спящим', description: 'Свернитесь клубком — мы тут ни при чём, мы тут спим', repeatCount: 1, setCount: 1, restSeconds: 0, tempo: t(0, 30, 0) },
    ],
  },
];
