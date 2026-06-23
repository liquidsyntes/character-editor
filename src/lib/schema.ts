import { SectionDef } from '@/types/character';
import { z } from 'zod';

export const CHARACTER_SCHEMA: SectionDef[] = [
  {
    id: 'basic',
    icon: '👤',
    label: 'Базовые данные',
    fieldCount: 15,
    fields: [
      { id: 'firstName', label: 'Имя', placeholder: 'Анна', type: 'text', span: 2 },
      { id: 'lastName', label: 'Фамилия', placeholder: 'Ковалёва', type: 'text', span: 2 },
      { id: 'nickname', label: 'Прозвище / Никнейм', placeholder: 'Кобра', type: 'text', span: 2 },
      { id: 'age', label: 'Возраст', placeholder: '34', type: 'text', span: 2 },
      { id: 'height', label: 'Рост', placeholder: '178 см', type: 'text', span: 2 },
      { id: 'race', label: 'Раса', placeholder: 'Человек, эльф, киборг...', type: 'text', span: 2 },
      { id: 'gender', label: 'Пол', placeholder: '', type: 'select', options: ['мужчина', 'женщина'], span: 3 },
      { id: 'coreValue', label: 'Главное для персонажа (Суть)', placeholder: 'Например: превыше всего ценит дружбу; ради близких пойдет на все.', type: 'textarea' },
      { id: 'vibeOrMood', label: 'Общее настроение / Вайб', placeholder: 'Например: веселый и легкий, часто шутит; или мрачный и вечно недовольный.', type: 'textarea' },
      { id: 'build', label: 'Телосложение', placeholder: 'Худощавое, жилистое', type: 'textarea' },
      { id: 'posture', label: 'Осанка', placeholder: 'Сутулится', type: 'textarea' },
      { id: 'hair', label: 'Цвет волос', placeholder: 'Тёмно-русые, до плеч, вечно в пучке', type: 'textarea' },
      { id: 'eyes', label: 'Цвет глаз', placeholder: 'Серо-зелёные, внимательные', type: 'textarea' },
      { id: 'alwaysWears', label: 'Что он никогда не снимает?', placeholder: 'Серебряный кулон с трещиной', type: 'textarea' },
      { id: 'marks', label: 'Особые приметы', placeholder: 'Шрам над левой бровью, прихрамывает на правую ногу', type: 'textarea' },
    ],
  },
  {
    id: 'lifestyle',
    icon: '💼',
    label: 'Быт и профессия',
    fieldCount: 4,
    fields: [
      { id: 'profession', label: 'Профессия и роль в мире', placeholder: 'Работа, социальный статус, легальная и реальная деятельность', type: 'textarea' },
      { id: 'livingConditions', label: 'Текущее место и условия жизни', placeholder: 'Город, тип жилья, с кем живет, уровень достатка', type: 'textarea' },
      { id: 'healthAndRoutine', label: 'Режим и здоровье', placeholder: 'Сон, хронические болячки, ограничения по телу', type: 'textarea' },
      { id: 'toolsAndTech', label: 'Инструменты и технологии', placeholder: 'Чем он пользуется постоянно: телефон, оружие, софт, гаджет', type: 'textarea' },
    ],
  },
  {
    id: 'visualStyle',
    icon: '🧥',
    label: 'Визуальный слой и стиль',
    fieldCount: 4,
    fields: [
      { id: 'clothingStyle', label: 'Стиль одежды и состояние вещей', placeholder: 'Новое или затертое, бренд или рандом, аккуратность', type: 'textarea' },
      { id: 'scent', label: 'Запах персонажа', placeholder: 'Парфюм, табак, кофе, металл, бензин и тд.', type: 'textarea' },
      { id: 'movementPlastics', label: 'Пластика движения', placeholder: 'Ходит тихо или топает, суетливый или плавный', type: 'textarea' },
      { id: 'signatureDetail', label: 'Выразительная деталь', placeholder: 'Одна штука, по которой его всегда узнают в сцене', type: 'textarea' },
    ],
  },
  {
    id: 'psychology',
    icon: '🧠',
    label: 'Характер и психология',
    fieldCount: 19,
    fields: [
      { id: 'weakness', label: 'Главная слабость', placeholder: 'Неумение отказывать — говорит «да» даже в ущерб себе', type: 'textarea' },
      { id: 'strength', label: 'Главная сила', placeholder: 'Холодный ум в кризисе — чем хуже, тем собраннее', type: 'textarea' },
      { id: 'angers', label: 'Что выводит его из себя?', placeholder: 'Когда перебивают на полуслове', type: 'textarea' },
      { id: 'conflictBehavior', label: 'Как ведёт себя в конфликте?', placeholder: 'Замыкается, молчит, потом взрывается', type: 'textarea' },
      { id: 'optimistType', label: 'Оптимист, пессимист или реалист?', placeholder: 'Пессимист, но тщательно это скрывает', type: 'textarea' },
      { id: 'valuesInPeople', label: 'Что он ценит в людях больше всего?', placeholder: 'Прямоту — даже если она hurts', type: 'textarea' },
      { id: 'innerPain', label: 'Самая большая внутренняя боль', placeholder: 'Чувство, что она недостаточно хороша для своей матери', type: 'textarea' },
      { id: 'defaultEmotion', label: 'Базовая эмоция по умолчанию', placeholder: 'Тревога — фоновый шум, который он уже не замечает', type: 'textarea' },
      { id: 'decisionStyle', label: 'Как он принимает решения?', placeholder: 'Долго взвешивает, но в последний момент действует импульсивно', type: 'textarea' },
      { id: 'worstFear', label: 'Что для него хуже всего — быть слабым, виноватым или лишним?', placeholder: 'Быть лишним', type: 'textarea' },
      { id: 'selfAttitude', label: 'Как он относится к себе?', placeholder: 'Терпит, с редкими вспышками ненависти', type: 'textarea' },
      { id: 'whenAshamed', label: 'Что он делает, когда ему стыдно?', placeholder: 'Исчезает — физически или в молчание', type: 'textarea' },
      { id: 'handlesOffense', label: 'Как он переживает обиду?', placeholder: 'Копит — у него отличная память на чужие долги', type: 'textarea' },
      { id: 'argueStyle', label: 'Спорит до конца или сдаётся?', placeholder: 'Сдаётся быстро, но внутри остаётся при своём', type: 'textarea' },
      { id: 'selfDestruct', label: 'Насколько он склонен к самоуничтожению?', placeholder: 'Иногда рискует — особенно когда кажется, что терять нечего', type: 'textarea' },
      { id: 'beliefSystem', label: 'Во что он верит больше — в людей, систему или только в себя?', placeholder: 'Только в себя — и то не до конца', type: 'textarea' },
      { id: 'rightOrLoved', label: 'Что для него важнее — быть правым или быть любимым?', placeholder: 'Быть правым — даже если останется один', type: 'textarea' },
      { id: 'selfDenial', label: 'В чём он себе никогда не признается?', placeholder: 'Что он давно перестал верить в то, за что борется', type: 'textarea' },
      { id: 'explainsFailures', label: 'Как он объясняет свои провалы?', placeholder: 'Обстоятельства — у него всегда готова история про невезение', type: 'textarea' },
      { id: 'breakingPoint', label: 'Что его может сломать окончательно?', placeholder: 'Если дочь повторит его ошибку — этого он не переживёт', type: 'textarea' },
    ],
  },
  {
    id: 'goals',
    icon: '🎯',
    label: 'Цели и мотивы',
    fieldCount: 6,
    fields: [
      { id: 'wantsMost', label: 'Чего он хочет больше всего?', placeholder: 'Уехать из этого города и больше не оглядываться', type: 'textarea' },
      { id: 'fearsMost', label: 'Чего он боится больше всего?', placeholder: 'Повторить судьбу отца — спиться и умереть в сорок', type: 'textarea' },
      { id: 'dailyDrive', label: 'Что им движет в повседневной жизни?', placeholder: 'Желание доказать бывшему, что она справилась', type: 'textarea' },
      { id: 'successDefinition', label: 'Что для него значит «успех»?', placeholder: 'Когда можно зайти в магазин и не смотреть на ценники', type: 'textarea' },
      { id: 'howFar', label: 'На что он готов пойти ради своей цели?', placeholder: 'Солгать близкому другу — один раз, но метко', type: 'textarea' },
      { id: 'obstacle', label: 'Что (или кто) стоит у него на пути?', placeholder: 'Собственная нерешительность плюс старший брат', type: 'textarea' },
    ],
  },
  {
    id: 'relations',
    icon: '💬',
    label: 'Отношения с другими персонажами',
    fieldCount: 9,
    fields: [
      { id: 'rel1', label: 'Связь с [имя персонажа]', placeholder: 'Муж; брак из чувства долга, а не любви', type: 'textarea' },
      { id: 'rel2', label: 'Связь с [имя персонажа]', placeholder: 'Коллега по работе; тайная зависть', type: 'textarea' },
      { id: 'rel3', label: 'Связь с [имя персонажа]', placeholder: 'Сосед по лестничной клетке; неожиданный союзник', type: 'textarea' },
      { id: 'bestFriend', label: 'Лучший друг / подруга', placeholder: 'Марина; дружат с института, 15 лет', type: 'textarea' },
      { id: 'enemy', label: 'Враг или соперник', placeholder: 'Начальник отдела; пассивно-агрессивная война', type: 'textarea' },
      { id: 'family', label: 'Семья', placeholder: 'Мать на пенсии, брат в другом городе, связь слабая', type: 'textarea' },
      { id: 'loveInterest', label: 'Любовный интерес', placeholder: 'Бывший одноклассник, недавно вернулся в город', type: 'textarea' },
      { id: 'trustsUnconditionally', label: 'Кому он доверяет безоговорочно?', placeholder: 'Только сестре', type: 'textarea' },
      { id: 'avoids', label: 'Кого он избегает?', placeholder: 'Бывшего научного руководителя', type: 'textarea' },
    ],
  },
  {
    id: 'habits',
    icon: '🔄',
    label: 'Привычки и манеры',
    fieldCount: 7,
    fields: [
      { id: 'nervousHabit', label: 'Что он делает, когда нервничает?', placeholder: 'Крутит кольцо на пальце, пока не останется след', type: 'textarea' },
      { id: 'morningRitual', label: 'Утренний ритуал', placeholder: 'Стакан ледяной воды, потом пять минут у окна с сигаретой', type: 'textarea' },
      { id: 'badHabit', label: 'Вредная привычка', placeholder: 'Грызёт колпачок ручки на совещаниях', type: 'textarea' },
      { id: 'catchphrase', label: 'Любимое слово или фраза-паразит', placeholder: '«Фактически…» перед каждым аргументом', type: 'textarea' },
      { id: 'laughStyle', label: 'Как он смеётся?', placeholder: 'Коротко и сухо, будто кашляет', type: 'textarea' },
      { id: 'handGesture', label: 'Что он делает руками во время разговора?', placeholder: 'Складывает руки на груди — всегда, с любым собеседником', type: 'textarea' },
      { id: 'sleepStyle', label: 'Как он спит?', placeholder: 'На боку, лицом к двери, просыпается от любого шороха', type: 'textarea' },
    ],
  },
  {
    id: 'backstory',
    icon: '📜',
    label: 'История и прошлое',
    fieldCount: 7,
    fields: [
      { id: 'grewUp', label: 'Где он вырос?', placeholder: 'Спальный район Челябинска, пятиэтажка на окраине', type: 'textarea' },
      { id: 'childhoodMemory', label: 'Самое яркое детское воспоминание', placeholder: 'Как отец учил её кататься на велосипеде — единственный тёплый день с ним', type: 'textarea' },
      { id: 'education', label: 'Образование', placeholder: 'Неоконченный юридический, бросила на третьем курсе', type: 'textarea' },
      { id: 'keyEvent', label: 'Ключевое событие, изменившее его жизнь', placeholder: 'Авария в 22 года — месяц в больнице, переосмысление всего', type: 'textarea' },
      { id: 'biggestMistake', label: 'Самая большая ошибка в прошлом', placeholder: 'Не поехала за границу, когда был шанс — осталась «ради отношений»', type: 'textarea' },
      { id: 'childhoodDream', label: 'Кем он хотел стать в детстве?', placeholder: 'Ветеринаром; теперь работает бухгалтером в ЖЭКе', type: 'textarea' },
      { id: 'untoldPast', label: 'Что он никогда никому не рассказывал о своём прошлом?', placeholder: 'В 16 лет угнала отцовскую машину и разбила её — все подумали на брата', type: 'textarea' },
    ],
  },
  {
    id: 'secrets',
    icon: '🔮',
    label: 'Уникальные черты или секреты',
    fieldCount: 7,
    fields: [
      { id: 'currentSecret', label: 'Тайна, которую он хранит прямо сейчас', placeholder: 'Знает, куда на самом деле пропал начальник, но молчит', type: 'textarea' },
      { id: 'unknownFact', label: 'Что о нём никто не знает?', placeholder: 'Пишет стихи в заметки телефона и никому не показывает', type: 'textarea' },
      { id: 'hiddenTalent', label: 'Неожиданный талант или умение', placeholder: 'Определяет марку духов по запаху с трёх метров', type: 'textarea' },
      { id: 'phobia', label: 'Странный страх или фобия', placeholder: 'Боится воздушных шариков — ждёт, что лопнут', type: 'textarea' },
      { id: 'contradiction', label: 'Что в его внешности или поведении противоречит его сути?', placeholder: 'Выглядит как бухгалтер, а говорит как таксист с тридцатилетним стажем', type: 'textarea' },
      { id: 'collects', label: 'Что он коллекционирует (вещи или мысли)?', placeholder: 'Билеты из каждого города, где был — хранит в обувной коробке', type: 'textarea' },
      { id: 'chapterTitle', label: 'Если бы его жизнь была книгой — как называлась бы текущая глава?', placeholder: '«В которой она наконец перестаёт извиняться»', type: 'textarea' },
    ],
  },
  {
    id: 'plotPractical',
    icon: '🎬',
    label: 'Сценарий и сюжетная практика',
    fieldCount: 4,
    fields: [
      { id: 'sceneTriggers', label: 'Триггеры и кнопки', placeholder: '3 конкретные вещи, которые моментально меняют его состояние', type: 'textarea' },
      { id: 'genreLimits', label: 'Лимиты по жанру', placeholder: 'Что он никогда не сделает в рамках истории, даже если логично', type: 'textarea' },
      { id: 'typicalSceneMoves', label: 'Типичные ходы в сцене', placeholder: 'Что он делает первым: говорит, молчит, шутит, давит, исчезает', type: 'textarea' },
      { id: 'dramaPrice', label: 'Ось «чем платить за драму»', placeholder: 'Что у него можно отнять для усиления конфликта: репутация, тело, близкий', type: 'textarea' },
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
      { id: 'roleInPlot', label: 'Кто он в сюжете?', placeholder: 'Невидимый свидетель', type: 'textarea' },
      { id: 'conflictType', label: 'Главный тип конфликта', placeholder: 'Внутренний — борьба с собственным прошлым', type: 'textarea' },
      { id: 'coreContradiction', label: 'Главное противоречие', placeholder: 'Хочет покоя, но сам создаёт хаос вокруг себя', type: 'textarea' },
      { id: 'idealEnding', label: 'Его идеальный финал', placeholder: 'Уехать на поезде в одну сторону и не оставить адреса', type: 'textarea' },
    ],
  },
  {
    id: 'arc',
    icon: '📈',
    label: 'Арка и изменения',
    fieldCount: 4,
    fields: [
      { id: 'arcStart', label: 'В начале истории он…', placeholder: 'Человек, который всё держит под контролем и никому не доверяет', type: 'textarea' },
      { id: 'arcEnd', label: 'В конце истории он…', placeholder: 'Научился отпускать контроль и впервые попросил о помощи', type: 'textarea' },
      { id: 'arcChange', label: 'Что в нём меняется?', placeholder: 'Иллюзия контроля ломается — рождается доверие', type: 'textarea' },
      { id: 'crossesLine', label: 'Где он переступает черту?', placeholder: 'Впервые сознательно лжёт тому, кто ему поверил', type: 'textarea' },
    ],
  },
  {
    id: 'screen',
    icon: '🎬',
    label: 'Экранное поведение',
    fieldCount: 5,
    fields: [
      { id: 'firstImpression', label: 'Первое впечатление от него', placeholder: 'Спокойная угроза', type: 'textarea' },
      { id: 'entersScene', label: 'Как он входит в сцену?', placeholder: 'Тихо, оказывается в комнате раньше всех', type: 'textarea' },
      { id: 'exitsScene', label: 'Как он уходит из сцены?', placeholder: 'Всегда на полуслове, не заканчивая фразу', type: 'textarea' },
      { id: 'signatureSound', label: 'Характерный звук рядом с ним', placeholder: 'Щёлканье костяшек пальцев — привычка с детства', type: 'textarea' },
      { id: 'alwaysInFrame', label: 'Что всегда с ним в кадре?', placeholder: 'Блокнот в кожаной обложке, потрёпанный по углам', type: 'textarea' },
    ],
  },
  {
    id: 'stress',
    icon: '⚡',
    label: 'Реакции и стресс',
    fieldCount: 5,
    fields: [
      { id: 'defenseReaction', label: 'Главная защитная реакция', placeholder: 'Всё контролирует — составляет списки, перепроверяет, не спит', type: 'textarea' },
      { id: 'lyingStyle', label: 'Как он врёт?', placeholder: 'Смотрит прямо в глаза и говорит слишком уверенно', type: 'textarea' },
      { id: 'onEdge', label: 'Признак, что он на грани', placeholder: 'Начинает говорить шёпотом — чем тише, тем ближе к срыву', type: 'textarea' },
      { id: 'becomesWorseWith', label: 'С кем он становится хуже?', placeholder: 'С младшим братом — превращается в завистливого подростка', type: 'textarea' },
      { id: 'becomesBetterWith', label: 'С кем он становится лучше?', placeholder: 'С племянницей — позволяет себе быть тёплым и смешным', type: 'textarea' },
    ],
  },
  {
    id: 'social',
    icon: '🏛️',
    label: 'Социальный слой',
    fieldCount: 7,
    fields: [
      { id: 'socialMask', label: 'Социальная маска', placeholder: 'Невозмутимый профессионал', type: 'textarea' },
      { id: 'wantsToBeLike', label: 'На кого хочет быть похож?', placeholder: 'На деда, которого никогда не видел', type: 'textarea' },
      { id: 'despises', label: 'Кого презирает больше всего?', placeholder: 'Тех, кто ноет, но ничего не меняет', type: 'textarea' },
      { id: 'envies', label: 'Кому завидует?', placeholder: 'Тем, кто может уйти не оборачиваясь', type: 'textarea' },
      { id: 'publicProfile', label: 'Профиль публичности', placeholder: 'Известен, анонимен, локально узнаваем, медийный', type: 'textarea' },
      { id: 'powerAttitude', label: 'Отношение к власти и институтам', placeholder: 'Враг системы, лоялист, циничный пользователь', type: 'textarea' },
      { id: 'cultureConsumption', label: 'Культура и медиа', placeholder: 'Какую музыку, кино, игры, книги он реально потребляет', type: 'textarea' },
    ],
  },
  {
    id: 'storyConnection',
    icon: '🔗',
    label: 'Связь с историей',
    fieldCount: 4,
    fields: [
      { id: 'whyStays', label: 'Почему он не уходит из событий?', placeholder: 'Потому что если уйдёт — подтвердит, что отец был прав', type: 'textarea' },
      { id: 'notReadyToLose', label: 'Что он не готов потерять?', placeholder: 'Уважение дочери', type: 'textarea' },
      { id: 'breakPrinciples', label: 'Ради чего нарушит свои принципы?', placeholder: 'Чтобы вытащить сестру из беды — нарушит любой принцип', type: 'textarea' },
      { id: 'complicatesOthers', label: 'Как он осложняет жизнь другим?', placeholder: 'Его молчание заставляет всех вокруг заполнять паузы — и проговариваться', type: 'textarea' },
    ],
  },
  {
    id: 'cheatCode',
    icon: '🗝️',
    label: 'Авторский чит-код',
    fieldCount: 3,
    fields: [
      { id: 'oneLiner', label: 'Одна строка о персонаже', placeholder: 'Это человек, который всегда приходит на десять минут раньше — но всюду опаздывает на жизнь', type: 'textarea' },
      { id: 'imageMetaphor', label: 'Образ, который его описывает', placeholder: 'Неотправленное сообщение в черновиках', type: 'textarea' },
      { id: 'viewerEmotion', label: 'Главная эмоция для зрителя', placeholder: 'Тревожную нежность — хочется его защитить, но страшно подойти', type: 'textarea' },
    ],
  },
  {
    id: 'innerWorld',
    icon: '🌀',
    label: 'Внутренний мир',
    fieldCount: 4,
    fields: [
      { id: 'silenceThoughts', label: 'О чём персонаж думает, когда остаётся в тишине — без отвлечений, без людей, без задач?', placeholder: 'Вспоминает разговор трёхлетней давности и придумывает, что нужно было сказать', type: 'textarea' },
      { id: 'bannedThought', label: 'Какую мысль о себе он гонит прочь быстрее всего, стоит ей появиться?', placeholder: '«Может быть, я просто посредственность, которой повезло»', type: 'textarea' },
      { id: 'selfContempt', label: 'За что он себя презирает — и как оправдывает это презрение перед самим собой?', placeholder: 'За трусость в решающий момент — оправдывает это «разумной осторожностью»', type: 'textarea' },
      { id: 'lastSelfLie', label: 'Опиши момент, когда персонаж в последний раз врал себе. Что именно он сказал и зачем?', placeholder: '«Мне всё равно» — сказал себе, когда увидел бывшего с другой. Чтобы не развалиться прямо в кафе', type: 'textarea' },
    ],
  },
  {
    id: 'shadow',
    icon: '🪞',
    label: 'Тень и противоречия',
    fieldCount: 5,
    fields: [
      { id: 'hypocrisy', label: 'В чём персонаж — лицемер? Где его слова и поступки расходятся системно, а не случайно?', placeholder: 'Проповедует честность, но систематически умалчивает о неудобном', type: 'textarea' },
      { id: 'unspeakableTruth', label: 'Какую правду о нём нельзя произносить вслух, чтобы не разрушить его самооценку?', placeholder: 'Что его успех — результат не таланта, а связей отца', type: 'textarea' },
      { id: 'falseBelief', label: 'Какое убеждение о себе он считает фундаментом своей личности — но оно ложно?', placeholder: '«Я человек, который всегда выбирает правду» — но на деле выбирает комфорт', type: 'textarea' },
      { id: 'secretEnvy', label: 'Кому он завидует, но никогда в этом не признается?', placeholder: 'Младшему брату — который просто живёт, не пытаясь ничего доказать', type: 'textarea' },
      { id: 'doubleStandard', label: 'Что персонаж осуждает в других — но разрешает себе (и как объясняет исключение)?', placeholder: 'Осуждает ложь, но свои недомолвки считает «тактичностью». Исключение: «я же не со зла»', type: 'textarea' },
    ],
  },
  {
    id: 'fearDesire',
    icon: '🔥',
    label: 'Страх и желание',
    fieldCount: 5,
    fields: [
      { id: 'statedVsHiddenGoal', label: 'Чего персонаж хочет (заявленная цель) и чего он на самом деле хочет (скрытая потребность)?', placeholder: 'Говорит: «хочу карьеру». На самом деле: хочет, чтобы отец сказал «я горжусь тобой»', type: 'textarea' },
      { id: 'maskedFear', label: 'Какой страх маскируется под другое чувство: гнев, презрение, скуку, заботу?', placeholder: 'Страх быть отвергнутым маскируется под высокомерие — «мне никто не нужен»', type: 'textarea' },
      { id: 'noConsequences', label: 'Если бы персонаж гарантированно не понёс последствий — что бы он сделал завтра?', placeholder: 'Позвонил бы матери и сказал всё, что копил двадцать лет', type: 'textarea' },
      { id: 'worstPossibleDay', label: 'Опиши худший день в жизни персонажа — не тот что был, а тот что мог бы случиться', placeholder: 'Дочь смотрит на него так, как он когда-то смотрел на отца — с презрением и жалостью одновременно', type: 'textarea' },
      { id: 'maniacalControl', label: 'Что он контролирует с маниакальной силой, потому что боится — если отпустит, случится ___?', placeholder: 'Расписание дня — если отпустит, хаос поглотит его, как в детстве', type: 'textarea' },
    ],
  },
  {
    id: 'trauma',
    icon: '💔',
    label: 'Прошлое и травма',
    fieldCount: 6,
    fields: [
      { id: 'firstBetrayal', label: 'Кого персонаж предал первым? Или кто предал его — и как это определило его дальнейшие отношения?', placeholder: 'Мать пообещала забрать из лагеря и не приехала. С тех пор не верит обещаниям', type: 'textarea' },
      { id: 'worldUnsafe', label: 'В какой момент мир перестал быть для него безопасным? Сколько ему было лет?', placeholder: 'В 7 лет, когда увидел, как отец ударил мать. Мир стал местом, где сильные бьют слабых', type: 'textarea' },
      { id: 'cruelestWords', label: 'Что самое жестокое он услышал о себе в детстве — и от кого?', placeholder: '«Ты такой же бесполезный, как твой отец» — от бабушки, за ужином, при всех', type: 'textarea' },
      { id: 'familyRole', label: 'Какую роль он играл в своей семье (спасатель, невидимка, козёл отпущения, принцесса, солдат)?', placeholder: 'Невидимка — научился не занимать места, не просить, не шуметь', type: 'textarea' },
      { id: 'innerChildRitual', label: 'Какой ритуал или привычка успокаивает его внутреннего ребёнка — даже если сам персонаж этого не осознаёт?', placeholder: 'Пьёт горячее молоко с мёдом перед сном — как делала бабушка, единственный безопасный человек', type: 'textarea' },
      { id: 'unaskedQuestion', label: 'О чём он никогда не спросил своих родителей, но до сих пор хочет знать?', placeholder: '«Вы вообще хотели, чтобы я родился?»', type: 'textarea' },
    ],
  },
  {
    id: 'intimacy',
    icon: '❤️‍🔥',
    label: 'Отношения и близость',
    fieldCount: 5,
    fields: [
      { id: 'afterIntimacy', label: 'Что персонаж делает сразу после секса? О чём думает, что говорит, куда смотрит?', placeholder: 'Молча встаёт и идёт в душ. Думает: «теперь он/она видел меня настоящего». Это пугает', type: 'textarea' },
      { id: 'punishingLove', label: 'Кого он наказывает своей любовью — и как именно?', placeholder: 'Жену — задаривает вниманием после ссоры, чтобы она чувствовала себя виноватой за злость', type: 'textarea' },
      { id: 'firstMinuteCheck', label: 'Что он проверяет в новом человеке в первые минуты знакомства (и в чём ошибается)?', placeholder: 'Проверяет, смеётся ли человек искренне. Ошибается — принимает обаяние за доброту', type: 'textarea' },
      { id: 'unbearableCompanion', label: 'С кем он невыносим — и почему продолжает быть рядом с этим человеком?', placeholder: 'С матерью — но продолжает приезжать каждое воскресенье из чувства долга и вины', type: 'textarea' },
      { id: 'hiddenNeedFromOthers', label: 'Какую свою потребность он пытается закрыть через других людей — но никогда не признается в этом?', placeholder: 'Потребность в одобрении — ищет её в каждом взгляде, комплименте, лайке', type: 'textarea' },
    ],
  },
  {
    id: 'morality',
    icon: '⚖️',
    label: 'Ценности и мораль',
    fieldCount: 5,
    fields: [
      { id: 'eternalSuffering', label: 'Ради чего (или кого) персонаж согласился бы на вечные муки — не героическую смерть, а именно бесконечное страдание?', placeholder: 'Ради дочери. Без колебаний. Это единственное, в чём он абсолютно уверен', type: 'textarea' },
      { id: 'romanticizedSin', label: 'Какой грех он считает добродетелью — и как он его романтизирует?', placeholder: 'Гордыню — называет её «достоинством» и «знанием себе цены»', type: 'textarea' },
      { id: 'historicalSide', label: 'На чью сторону он встал бы в конкретной исторической катастрофе — и честно: как бы поступил на самом деле?', placeholder: 'В оккупации — скорее всего, молчал бы и выживал. Не герой, не предатель — серая зона', type: 'textarea' },
      { id: 'notForSale', label: 'Что для него не продаётся? Что не покупается ни за какие деньги, угрозы или соблазны?', placeholder: 'Предать того, кто ему доверился первым', type: 'textarea' },
      { id: 'moralDebt', label: 'Кому он должен — не денег, а морального долга, который его гнетёт?', placeholder: 'Бывшему другу, которого бросил в трудный момент ради собственного комфорта', type: 'textarea' },
    ],
  },
  {
    id: 'bodyHabits',
    icon: '🫀',
    label: 'Бытовые привычки и телесность',
    fieldCount: 4,
    fields: [
      { id: 'whenAlone', label: 'Что персонаж делает только когда уверен, что никто не видит и не узнает?', placeholder: 'Разговаривает сам с собой вслух — проигрывает диалоги, которые никогда не состоятся', type: 'textarea' },
      { id: 'first15Minutes', label: 'На что он тратит первые 15 минут после пробуждения? Порядок действий, ритуал, мысли', placeholder: 'Лежит с закрытыми глазами, проверяет телефон не открывая, встаёт только после третьего будильника', type: 'textarea' },
      { id: 'shameBodyReaction', label: 'Как его тело реагирует на стыд? Жар в ушах, потные ладони, желание сжаться, агрессивный взгляд?', placeholder: 'Краснеет шея, голос становится ровнее — чем больше стыд, тем холоднее тон', type: 'textarea' },
      { id: 'foodAlone', label: 'Что он ест когда никто не готовит, не смотрит, не ждёт — еда без свидетелей?', placeholder: 'Хлеб с маслом и чай. Иногда — холодные макароны из кастрюли, стоя у плиты', type: 'textarea' },
    ],
  },
  {
    id: 'speechVoice',
    icon: '🗣️',
    label: 'Речь и голос',
    fieldCount: 4,
    fields: [
      { id: 'insecurityWord', label: 'Какое слово-паразит выдаёт его неуверенность? Или наоборот — какое слово он использует как щит?', placeholder: '«Ну, в принципе…» — появляется каждый раз, когда не уверен, но притворяется', type: 'textarea' },
      { id: 'silenceAndNoise', label: 'О чём персонаж молчит, когда должен говорить? И о чём говорит, когда должен молчать?', placeholder: 'Молчит о своих чувствах. Зато в тишине начинает критиковать других — чтобы заполнить пустоту', type: 'textarea' },
      { id: 'voiceChanges', label: 'Как меняется его голос при разговоре с тремя разными людьми: с тем кого он боится, с тем кого он хочет, с тем кому он врёт?', placeholder: 'С начальником — выше, быстрее. С ней — мягче, тише. Когда врёт — идеально ровный, без пауз', type: 'textarea' },
      { id: 'personalMantra', label: 'Какая фраза — его личное заклинание, которое он повторяет в трудные моменты?', placeholder: '«Ничего, прорвёмся» — говорит себе, сжимая кулаки в карманах', type: 'textarea' },
    ],
  },
  {
    id: 'selfDeception',
    icon: '🎭',
    label: 'Самообман и иллюзии',
    fieldCount: 4,
    fields: [
      { id: 'lifeNarrative', label: 'Какую историю персонаж рассказывает себе о своей жизни — и что эта история скрывает?', placeholder: '«Я сам себя сделал» — скрывает, что без помощи тёщи не было бы ни квартиры, ни бизнеса', type: 'textarea' },
      { id: 'forgivesSelNotOthers', label: 'Что он не может простить другим, но с лёгкостью прощает себе?', placeholder: 'Забвение — не прощает, когда его забывают, но сам исчезает из чужих жизней без объяснений', type: 'textarea' },
      { id: 'liberatingTruth', label: 'Какая правда о нём сделала бы его свободным — но он не готов её услышать?', placeholder: 'Что он давно не любит жену, а держится за брак из страха одиночества', type: 'textarea' },
      { id: 'meetTrueSelf', label: 'Если бы персонаж встретил себя настоящего (без масок) — он бы обнял, ударил или прошёл мимо?', placeholder: 'Замер бы. Потом отвернулся. Потому что узнал бы — и не смог бы это вынести', type: 'textarea' },
    ],
  },
  {
    id: 'extreme',
    icon: '🌋',
    label: 'Персонаж в экстремальной ситуации',
    fieldCount: 6,
    fields: [
      { id: 'lostEverything', label: 'Что персонаж делает, когда у него отняли всё — дом, людей, статус, будущее. Какой поступок станет дном, а какой — первой ступенью вверх?', placeholder: 'Дно: неделя в запое. Ступень вверх: звонок единственному человеку, которому ещё не соврал', type: 'textarea' },
      { id: 'physicalThreat', label: 'Опиши его реакцию на прямую физическую угрозу: замирание, бегство, агрессия — или что-то неожиданное?', placeholder: 'Замирает. Потом — неестественно спокойный голос. Потом дрожат руки — но уже после', type: 'textarea' },
      { id: 'impossibleChoice', label: 'Кого он спасёт, если выбор: незнакомый ребёнок или близкий человек, который его предал? Инстинкт, не философия', placeholder: 'Ребёнка. Не потому что благороден — потому что предавший уже не «свой». Потом будет ненавидеть себя', type: 'textarea' },
      { id: 'lastMinute', label: 'Что он скажет или сделает за минуту до гарантированной смерти — и кому это будет адресовано?', placeholder: 'Достанет телефон и напишет дочери: «В шкатулке письмо. Прочитай, когда будешь готова»', type: 'textarea' },
      { id: 'powerOverHelpless', label: 'Какую власть над беспомощным он употребит, если никто никогда не узнает? Милосердие, жестокость, равнодушие?', placeholder: 'Милосердие — но холодное, без тепла. Поможет и уйдёт. Не из доброты, а чтобы не стать тем, кого презирает', type: 'textarea' },
      { id: 'absoluteLimit', label: 'Где его предел — точка, в которой он скажет «нет, дальше не пойду» даже под страхом смерти? И что случается, когда его продавливают за эту точку?', placeholder: 'Не тронет ребёнка — никогда, ни при каких условиях. Если продавят — сломается тихо и необратимо', type: 'textarea' },
    ],
  },
  {
    id: 'authorMeta',
    icon: '🛠️',
    label: 'Метаданные автора',
    fieldCount: 4,
    fields: [
      { id: 'archetype', label: 'Архетип или комбинация', placeholder: 'Например: «циник спасатель манипулятор»', type: 'textarea' },
      { id: 'references', label: 'Референсы', placeholder: '2–3 персонажа из кино, игр, сериалов, которые близки по вайбу', type: 'textarea' },
      { id: 'ensembleFunction', label: 'Функция в ансамбле', placeholder: 'Генератор конфликтов, зеркало героя, проводник в мир', type: 'textarea' },
      { id: 'exploredThemes', label: 'Темы, исследуемые через персонажа', placeholder: 'Например: вина, зависимость, ответственность, выученная беспомощность', type: 'textarea' },
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

const schemaShape: Record<string, z.ZodDefault<z.ZodOptional<z.ZodString>>> = {};
for (const section of CHARACTER_SCHEMA) {
  for (const field of section.fields) {
    schemaShape[field.id] = z.string().optional().default('');
  }
}

export const CharacterDataSchema = z.object(schemaShape);

export function parseCharacterData(dataStr: string): Record<string, string> {
  try {
    const raw = JSON.parse(dataStr);
    return CharacterDataSchema.parse(raw);
  } catch {
    return CharacterDataSchema.parse({});
  }
}
