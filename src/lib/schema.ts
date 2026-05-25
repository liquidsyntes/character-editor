import { SectionDef } from '@/types/character';

export const CHARACTER_SCHEMA: SectionDef[] = [
  {
    id: 'basic',
    icon: '👤',
    label: 'Базовые данные',
    fieldCount: 11,
    fields: [
      { id: 'firstName', label: 'Имя', placeholder: 'Анна', type: 'text', row: 1 },
      { id: 'lastName', label: 'Фамилия', placeholder: 'Ковалёва', type: 'text', row: 1 },
      { id: 'age', label: 'Возраст', placeholder: '34', type: 'text', row: 2 },
      { id: 'height', label: 'Рост', placeholder: '178 см', type: 'text', row: 2 },
      { id: 'gender', label: 'Пол', placeholder: '', type: 'select', options: ['мужчина', 'женщина'], row: 2 },
      { id: 'build', label: 'Телосложение', placeholder: 'Худощавое, жилистое', type: 'text', row: 3 },
      { id: 'posture', label: 'Осанка', placeholder: 'Сутулится', type: 'text', row: 3 },
      { id: 'hair', label: 'Цвет волос', placeholder: 'Тёмно-русые, до плеч, вечно в пучке', type: 'text', row: 4 },
      { id: 'eyes', label: 'Цвет глаз', placeholder: 'Серо-зелёные, внимательные', type: 'text', row: 4 },
      { id: 'alwaysWears', label: 'Что он никогда не снимает?', placeholder: 'Серебряный кулон с трещиной', type: 'text' },
      { id: 'marks', label: 'Особые приметы', placeholder: 'Шрам над левой бровью, прихрамывает на правую ногу', type: 'text' },
    ],
  },
  {
    id: 'psychology',
    icon: '🧠',
    label: 'Характер и психология',
    fieldCount: 19,
    fields: [
      { id: 'weakness', label: 'Главная слабость', placeholder: 'Неумение отказывать — говорит «да» даже в ущерб себе', type: 'text' },
      { id: 'strength', label: 'Главная сила', placeholder: 'Холодный ум в кризисе — чем хуже, тем собраннее', type: 'text' },
      { id: 'angers', label: 'Что выводит его из себя?', placeholder: 'Когда перебивают на полуслове', type: 'text' },
      { id: 'conflictBehavior', label: 'Как ведёт себя в конфликте?', placeholder: 'Замыкается, молчит, потом взрывается', type: 'text' },
      { id: 'optimistType', label: 'Оптимист, пессимист или реалист?', placeholder: 'Пессимист, но тщательно это скрывает', type: 'text' },
      { id: 'valuesInPeople', label: 'Что он ценит в людях больше всего?', placeholder: 'Прямоту — даже если она hurts', type: 'text' },
      { id: 'innerPain', label: 'Самая большая внутренняя боль', placeholder: 'Чувство, что она недостаточно хороша для своей матери', type: 'text' },
      { id: 'defaultEmotion', label: 'Базовая эмоция по умолчанию', placeholder: 'Тревога — фоновый шум, который он уже не замечает', type: 'text' },
      { id: 'decisionStyle', label: 'Как он принимает решения?', placeholder: 'Долго взвешивает, но в последний момент действует импульсивно', type: 'text' },
      { id: 'worstFear', label: 'Что для него хуже всего — быть слабым, виноватым или лишним?', placeholder: 'Быть лишним', type: 'text' },
      { id: 'selfAttitude', label: 'Как он относится к себе?', placeholder: 'Терпит, с редкими вспышками ненависти', type: 'text' },
      { id: 'whenAshamed', label: 'Что он делает, когда ему стыдно?', placeholder: 'Исчезает — физически или в молчание', type: 'text' },
      { id: 'handlesOffense', label: 'Как он переживает обиду?', placeholder: 'Копит — у него отличная память на чужие долги', type: 'text' },
      { id: 'argueStyle', label: 'Спорит до конца или сдаётся?', placeholder: 'Сдаётся быстро, но внутри остаётся при своём', type: 'text' },
      { id: 'selfDestruct', label: 'Насколько он склонен к самоуничтожению?', placeholder: 'Иногда рискует — особенно когда кажется, что терять нечего', type: 'text' },
      { id: 'beliefSystem', label: 'Во что он верит больше — в людей, систему или только в себя?', placeholder: 'Только в себя — и то не до конца', type: 'text' },
      { id: 'rightOrLoved', label: 'Что для него важнее — быть правым или быть любимым?', placeholder: 'Быть правым — даже если останется один', type: 'text' },
      { id: 'selfDenial', label: 'В чём он себе никогда не признается?', placeholder: 'Что он давно перестал верить в то, за что борется', type: 'text' },
      { id: 'explainsFailures', label: 'Как он объясняет свои провалы?', placeholder: 'Обстоятельства — у него всегда готова история про невезение', type: 'text' },
      { id: 'breakingPoint', label: 'Что его может сломать окончательно?', placeholder: 'Если дочь повторит его ошибку — этого он не переживёт', type: 'text' },
    ],
  },
  {
    id: 'goals',
    icon: '🎯',
    label: 'Цели и мотивы',
    fieldCount: 6,
    fields: [
      { id: 'wantsMost', label: 'Чего он хочет больше всего?', placeholder: 'Уехать из этого города и больше не оглядываться', type: 'text' },
      { id: 'fearsMost', label: 'Чего он боится больше всего?', placeholder: 'Повторить судьбу отца — спиться и умереть в сорок', type: 'text' },
      { id: 'dailyDrive', label: 'Что им движет в повседневной жизни?', placeholder: 'Желание доказать бывшему, что она справилась', type: 'text' },
      { id: 'successDefinition', label: 'Что для него значит «успех»?', placeholder: 'Когда можно зайти в магазин и не смотреть на ценники', type: 'text' },
      { id: 'howFar', label: 'На что он готов пойти ради своей цели?', placeholder: 'Солгать близкому другу — один раз, но метко', type: 'text' },
      { id: 'obstacle', label: 'Что (или кто) стоит у него на пути?', placeholder: 'Собственная нерешительность плюс старший брат', type: 'text' },
    ],
  },
  {
    id: 'relations',
    icon: '💬',
    label: 'Отношения с другими персонажами',
    fieldCount: 9,
    fields: [
      { id: 'rel1', label: 'Связь с [имя персонажа]', placeholder: 'Муж; брак из чувства долга, а не любви', type: 'text' },
      { id: 'rel2', label: 'Связь с [имя персонажа]', placeholder: 'Коллега по работе; тайная зависть', type: 'text' },
      { id: 'rel3', label: 'Связь с [имя персонажа]', placeholder: 'Сосед по лестничной клетке; неожиданный союзник', type: 'text' },
      { id: 'bestFriend', label: 'Лучший друг / подруга', placeholder: 'Марина; дружат с института, 15 лет', type: 'text' },
      { id: 'enemy', label: 'Враг или соперник', placeholder: 'Начальник отдела; пассивно-агрессивная война', type: 'text' },
      { id: 'family', label: 'Семья', placeholder: 'Мать на пенсии, брат в другом городе, связь слабая', type: 'text' },
      { id: 'loveInterest', label: 'Любовный интерес', placeholder: 'Бывший одноклассник, недавно вернулся в город', type: 'text' },
      { id: 'trustsUnconditionally', label: 'Кому он доверяет безоговорочно?', placeholder: 'Только сестре', type: 'text' },
      { id: 'avoids', label: 'Кого он избегает?', placeholder: 'Бывшего научного руководителя', type: 'text' },
    ],
  },
  {
    id: 'habits',
    icon: '🔄',
    label: 'Привычки и манеры',
    fieldCount: 7,
    fields: [
      { id: 'nervousHabit', label: 'Что он делает, когда нервничает?', placeholder: 'Крутит кольцо на пальце, пока не останется след', type: 'text' },
      { id: 'morningRitual', label: 'Утренний ритуал', placeholder: 'Стакан ледяной воды, потом пять минут у окна с сигаретой', type: 'text' },
      { id: 'badHabit', label: 'Вредная привычка', placeholder: 'Грызёт колпачок ручки на совещаниях', type: 'text' },
      { id: 'catchphrase', label: 'Любимое слово или фраза-паразит', placeholder: '«Фактически…» перед каждым аргументом', type: 'text' },
      { id: 'laughStyle', label: 'Как он смеётся?', placeholder: 'Коротко и сухо, будто кашляет', type: 'text' },
      { id: 'handGesture', label: 'Что он делает руками во время разговора?', placeholder: 'Складывает руки на груди — всегда, с любым собеседником', type: 'text' },
      { id: 'sleepStyle', label: 'Как он спит?', placeholder: 'На боку, лицом к двери, просыпается от любого шороха', type: 'text' },
    ],
  },
  {
    id: 'backstory',
    icon: '📜',
    label: 'История и прошлое',
    fieldCount: 7,
    fields: [
      { id: 'grewUp', label: 'Где он вырос?', placeholder: 'Спальный район Челябинска, пятиэтажка на окраине', type: 'text' },
      { id: 'childhoodMemory', label: 'Самое яркое детское воспоминание', placeholder: 'Как отец учил её кататься на велосипеде — единственный тёплый день с ним', type: 'text' },
      { id: 'education', label: 'Образование', placeholder: 'Неоконченный юридический, бросила на третьем курсе', type: 'text' },
      { id: 'keyEvent', label: 'Ключевое событие, изменившее его жизнь', placeholder: 'Авария в 22 года — месяц в больнице, переосмысление всего', type: 'text' },
      { id: 'biggestMistake', label: 'Самая большая ошибка в прошлом', placeholder: 'Не поехала за границу, когда был шанс — осталась «ради отношений»', type: 'text' },
      { id: 'childhoodDream', label: 'Кем он хотел стать в детстве?', placeholder: 'Ветеринаром; теперь работает бухгалтером в ЖЭКе', type: 'text' },
      { id: 'untoldPast', label: 'Что он никогда никому не рассказывал о своём прошлом?', placeholder: 'В 16 лет угнала отцовскую машину и разбила её — все подумали на брата', type: 'text' },
    ],
  },
  {
    id: 'secrets',
    icon: '🔮',
    label: 'Уникальные черты или секреты',
    fieldCount: 7,
    fields: [
      { id: 'currentSecret', label: 'Тайна, которую он хранит прямо сейчас', placeholder: 'Знает, куда на самом деле пропал начальник, но молчит', type: 'text' },
      { id: 'unknownFact', label: 'Что о нём никто не знает?', placeholder: 'Пишет стихи в заметки телефона и никому не показывает', type: 'text' },
      { id: 'hiddenTalent', label: 'Неожиданный талант или умение', placeholder: 'Определяет марку духов по запаху с трёх метров', type: 'text' },
      { id: 'phobia', label: 'Странный страх или фобия', placeholder: 'Боится воздушных шариков — ждёт, что лопнут', type: 'text' },
      { id: 'contradiction', label: 'Что в его внешности или поведении противоречит его сути?', placeholder: 'Выглядит как бухгалтер, а говорит как таксист с тридцатилетним стажем', type: 'text' },
      { id: 'collects', label: 'Что он коллекционирует (вещи или мысли)?', placeholder: 'Билеты из каждого города, где был — хранит в обувной коробке', type: 'text' },
      { id: 'chapterTitle', label: 'Если бы его жизнь была книгой — как называлась бы текущая глава?', placeholder: '«В которой она наконец перестаёт извиняться»', type: 'text' },
    ],
  },
  {
    id: 'role',
    icon: '🎭',
    label: 'Роль в истории',
    fieldCount: 6,
    fields: [
      { id: 'characterFunction', label: 'Функция персонажа', placeholder: '', type: 'select', options: ['Протагонист', 'Антагонист', 'Наставник', 'Трикстер', 'Союзник', 'Тень'], row: 5 },
      { id: 'plotSignificance', label: 'Значимость в сюжете', placeholder: '', type: 'select', options: ['Центральный персонаж', 'Персонаж второго плана', 'Эпизодический персонаж', 'Катализатор событий'], row: 5 },
      { id: 'roleInPlot', label: 'Кто он в сюжете?', placeholder: 'Невидимый свидетель', type: 'text' },
      { id: 'conflictType', label: 'Главный тип конфликта', placeholder: 'Внутренний — борьба с собственным прошлым', type: 'text' },
      { id: 'coreContradiction', label: 'Главное противоречие', placeholder: 'Хочет покоя, но сам создаёт хаос вокруг себя', type: 'text' },
      { id: 'idealEnding', label: 'Его идеальный финал', placeholder: 'Уехать на поезде в одну сторону и не оставить адреса', type: 'text' },
    ],
  },
  {
    id: 'arc',
    icon: '📈',
    label: 'Арка и изменения',
    fieldCount: 4,
    fields: [
      { id: 'arcStart', label: 'В начале истории он…', placeholder: 'Человек, который всё держит под контролем и никому не доверяет', type: 'text' },
      { id: 'arcEnd', label: 'В конце истории он…', placeholder: 'Научился отпускать контроль и впервые попросил о помощи', type: 'text' },
      { id: 'arcChange', label: 'Что в нём меняется?', placeholder: 'Иллюзия контроля ломается — рождается доверие', type: 'text' },
      { id: 'crossesLine', label: 'Где он переступает черту?', placeholder: 'Впервые сознательно лжёт тому, кто ему поверил', type: 'text' },
    ],
  },
  {
    id: 'screen',
    icon: '🎬',
    label: 'Экранное поведение',
    fieldCount: 5,
    fields: [
      { id: 'firstImpression', label: 'Первое впечатление от него', placeholder: 'Спокойная угроза', type: 'text' },
      { id: 'entersScene', label: 'Как он входит в сцену?', placeholder: 'Тихо, оказывается в комнате раньше всех', type: 'text' },
      { id: 'exitsScene', label: 'Как он уходит из сцены?', placeholder: 'Всегда на полуслове, не заканчивая фразу', type: 'text' },
      { id: 'signatureSound', label: 'Характерный звук рядом с ним', placeholder: 'Щёлканье костяшек пальцев — привычка с детства', type: 'text' },
      { id: 'alwaysInFrame', label: 'Что всегда с ним в кадре?', placeholder: 'Блокнот в кожаной обложке, потрёпанный по углам', type: 'text' },
    ],
  },
  {
    id: 'stress',
    icon: '⚡',
    label: 'Реакции и стресс',
    fieldCount: 5,
    fields: [
      { id: 'defenseReaction', label: 'Главная защитная реакция', placeholder: 'Всё контролирует — составляет списки, перепроверяет, не спит', type: 'text' },
      { id: 'lyingStyle', label: 'Как он врёт?', placeholder: 'Смотрит прямо в глаза и говорит слишком уверенно', type: 'text' },
      { id: 'onEdge', label: 'Признак, что он на грани', placeholder: 'Начинает говорить шёпотом — чем тише, тем ближе к срыву', type: 'text' },
      { id: 'becomesWorseWith', label: 'С кем он становится хуже?', placeholder: 'С младшим братом — превращается в завистливого подростка', type: 'text' },
      { id: 'becomesBetterWith', label: 'С кем он становится лучше?', placeholder: 'С племянницей — позволяет себе быть тёплым и смешным', type: 'text' },
    ],
  },
  {
    id: 'social',
    icon: '🏛️',
    label: 'Социальный слой',
    fieldCount: 4,
    fields: [
      { id: 'socialMask', label: 'Социальная маска', placeholder: 'Невозмутимый профессионал', type: 'text' },
      { id: 'wantsToBeLike', label: 'На кого хочет быть похож?', placeholder: 'На деда, которого никогда не видел', type: 'text' },
      { id: 'despises', label: 'Кого презирает больше всего?', placeholder: 'Тех, кто ноет, но ничего не меняет', type: 'text' },
      { id: 'envies', label: 'Кому завидует?', placeholder: 'Тем, кто может уйти не оборачиваясь', type: 'text' },
    ],
  },
  {
    id: 'storyConnection',
    icon: '🔗',
    label: 'Связь с историей',
    fieldCount: 4,
    fields: [
      { id: 'whyStays', label: 'Почему он не уходит из событий?', placeholder: 'Потому что если уйдёт — подтвердит, что отец был прав', type: 'text' },
      { id: 'notReadyToLose', label: 'Что он не готов потерять?', placeholder: 'Уважение дочери', type: 'text' },
      { id: 'breakPrinciples', label: 'Ради чего нарушит свои принципы?', placeholder: 'Чтобы вытащить сестру из беды — нарушит любой принцип', type: 'text' },
      { id: 'complicatesOthers', label: 'Как он осложняет жизнь другим?', placeholder: 'Его молчание заставляет всех вокруг заполнять паузы — и проговариваться', type: 'text' },
    ],
  },
  {
    id: 'cheatCode',
    icon: '🗝️',
    label: 'Авторский чит-код',
    fieldCount: 3,
    fields: [
      { id: 'oneLiner', label: 'Одна строка о персонаже', placeholder: 'Это человек, который всегда приходит на десять минут раньше — но всюду опаздывает на жизнь', type: 'text' },
      { id: 'imageMetaphor', label: 'Образ, который его описывает', placeholder: 'Неотправленное сообщение в черновиках', type: 'text' },
      { id: 'viewerEmotion', label: 'Главная эмоция для зрителя', placeholder: 'Тревожную нежность — хочется его защитить, но страшно подойти', type: 'text' },
    ],
  },
];

export function getTotalFieldCount(): number {
  return CHARACTER_SCHEMA.reduce((sum, section) => sum + section.fields.length, 0);
}

export function getFilledFieldCount(data: Record<string, string>): number {
  let count = 0;
  for (const section of CHARACTER_SCHEMA) {
    for (const field of section.fields) {
      if (data[field.id] && data[field.id].trim() !== '') {
        count++;
      }
    }
  }
  return count;
}

export function getSectionFilledCount(sectionId: string, data: Record<string, string>): number {
  const section = CHARACTER_SCHEMA.find(s => s.id === sectionId);
  if (!section) return 0;
  return section.fields.filter(f => data[f.id] && data[f.id].trim() !== '').length;
}
