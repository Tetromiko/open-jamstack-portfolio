# Site Functionality Model

Оновлено: 2026-06-12

## 1. Головна ідея

Сайт будується не як набір жорстко зашитих секцій, а як документ. `public/portfolio-data.json` є документом розмітки сайту: він описує сторінки, порядок блоків, тип кожного блоку та стан, потрібний для рендеру.

Окремий builder service читає JSON, знаходить відповідні feature descriptors у registry, будує публічний інтерфейс і передає кожному view-компоненту його state.

Адмінка використовує той самий registry і спершу рендерить ті самі view-компоненти, що й публічна сторінка. Єдина різниця - admin overlay з кнопкою редагування. Editor відкривається поверх поточного блоку як modal і збирає всі дані, потрібні view-компоненту після збереження.

## 2. Feature як одиниця функціоналу

Feature - це самодостатня одиниця сайту. Вона належить до однієї з двох категорій:

- `layout` - структурний контейнер, який організовує інші layouts або blocks;
- `block` - контентний модуль, який несе кінцеву інформацію.

Приклади blocks:

- фото з підписом;
- hero-блок;
- текстовий блок;
- галерея;
- список проєктів;
- контактна форма без backend;
- timeline досвіду;
- embedded video;
- call-to-action.

Кожна feature має дві runtime-версії:

1. `ViewComponent` - компонент перегляду.
2. `EditorComponent` - компонент редагування.

View-компонент не знає, як дані редагуються або зберігаються. Editor-компонент не публікує самостійно і не пише напряму в GitHub або filesystem. Він тільки формує валідний state для майбутнього view.

Layout-компонент також має `ViewComponent` і `EditorComponent`, але його state описує тільки структуру й оформлення контейнера: кількість колонок, gap, padding, background, alignment. Контентні дані лишаються у дочірніх blocks.

## 3. Контракт feature

Кожна feature описується descriptor-ом:

```ts
type FeatureDescriptor<TState> = {
  type: string;
  category: "layout" | "block";
  acceptsChildren?: boolean;
  version: number;
  title: string;
  defaultState: TState;
  ViewComponent: React.ComponentType<{ state: TState }>;
  EditorComponent: React.ComponentType<FeatureEditorProps<TState>>;
  validate(state: TState): ValidationResult;
  migrate?(state: unknown, fromVersion: number): TState;
  collectAssets?(state: TState): AssetReference[];
};
```

Editor props:

```ts
type FeatureEditorProps<TState> = {
  state: TState;
  onChange(nextState: TState): void;
  stageAsset(file: File, options: StageAssetOptions): Promise<StagedAsset>;
};
```

Обов'язкові правила:

- `type` є стабільним ідентифікатором feature, наприклад `media.photoCaption`.
- `category` розділяє структурні `layout` feature і контентні `block` feature.
- `acceptsChildren` дозволений тільки для layout-like feature, які мають вкладені `children[]`.
- `version` потрібен для міграцій state між версіями.
- `defaultState` створює новий блок без ручного складання JSON.
- `validate` перевіряє повний state перед save.
- `ViewComponent` має бути pure щодо props: отримав state, відрендерив UI.
- `EditorComponent` має генерувати state, який view може використати без додаткової ручної обробки.

## 4. JSON як документ розмітки сайту

Цільова форма JSON має перейти від "набору полів профілю" до site document:

```json
{
  "schemaVersion": 2,
  "site": {
    "title": "Personal Portfolio",
    "language": "uk"
  },
  "pages": [
    {
      "id": "home",
      "path": "/",
      "title": "Home",
      "blocks": [
        {
          "id": "intro-photo",
          "type": "media.photoCaption",
          "version": 1,
          "state": {
            "image": {
              "src": "/uploads/intro.jpg",
              "alt": "Portrait",
              "fit": "cover",
              "position": "center"
            },
            "caption": {
              "text": "Working with interactive systems.",
              "placement": "bottom-left",
              "fontSize": "md",
              "fontStyle": "normal",
              "color": "#ffffff"
            }
          }
        }
      ]
    }
  ]
}
```

Поле `children[]` використовується тільки для layout feature. Контентні blocks не мають вкладених children. Цей документ є source of truth для публічного сайту. Якщо блоку немає в JSON, builder його не рендерить. Якщо блок є, але його `type` невідомий registry, сайт має показати контрольований fallback або пропустити блок з діагностикою в dev mode.

## 5. Layouts і Blocks

### Layouts

Layouts є контейнерами. Вони не містять кінцевого тексту, фото або посилань, а визначають простір для дочірніх елементів.

Приклад:

```json
{
  "id": "portfolio-grid",
  "type": "layout.grid",
  "version": 1,
  "state": {
    "columns": 2,
    "gap": "md",
    "padding": "md",
    "background": "#ffffff",
    "align": "stretch"
  },
  "children": [
    {
      "id": "author-card",
      "type": "author.info",
      "version": 1,
      "state": {}
    }
  ]
}
```

Editor для layout-а налаштовує display-параметри контейнера. У режимі preview він також показує controls для додавання дочірніх layouts або blocks.

### Blocks

Blocks є контентними модулями. Вони містять конкретний serialized state: текст, media paths, links, формат відображення, опції стилю. Blocks не приймають `children[]`; вкладені сутності на кшталт `author.info.socials[]` є частиною state самого block-а, а не окремими layout children.

## 6. Builder services

Система потребує кілька окремих builder-сервісів.

### View builder

Відповідає за публічний сайт:

1. Приймає site document.
2. Знаходить поточну page за route.
3. Для кожного block шукає feature descriptor за `type`.
4. Мігрує state, якщо потрібно.
5. Валідований state передає у `ViewComponent`.

### Editor builder

Відповідає за адмінку:

1. Приймає той самий site document.
2. Рендерить сторінку тими самими `ViewComponent`, що й public route.
3. Додає верхню action bar для save/session/status дій.
4. Додає бічну library panel із categorized skeletons доступних layouts і blocks.
5. Дозволяє drag/drop із library panel на canvas для створення нових елементів.
6. Дозволяє drag/drop існуючих blocks/layouts для зміни порядку або перенесення в layout children.
7. Додає admin-only overlay з кнопкою `Edit`.
8. Після `Edit` відкриває `EditorComponent` у modal поверх live preview.
9. Приймає `onChange` від editor-а й одразу оновлює `block.state`.
10. Перед save запускає валідацію всіх blocks.

### Asset staging

Відповідає за файли:

1. Editor передає файл через `stageAsset`.
2. Staging генерує безпечний repo path і public path.
3. Editor записує public path у block state.
4. Файл лишається pending до save.
5. Save pipeline публікує JSON і pending assets одним commit.

## 7. Приклад: фото з підписом

Feature type:

```text
media.photoCaption
```

View-компонент отримує готовий state:

```ts
type PhotoCaptionState = {
  image: {
    src: string;
    alt: string;
    fit: "cover" | "contain" | "fill" | "none";
    position: "center" | "top" | "bottom" | "left" | "right";
  };
  caption: {
    text: string;
    placement: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "below";
    fontSize: "sm" | "md" | "lg" | "xl";
    fontStyle: "normal" | "italic" | "bold";
    color: string;
  };
};
```

Editor-компонент має дати користувачу:

- поле вибору зображення;
- поле `alt`;
- режим заповнення зображенням: `cover`, `contain`, `fill`, `none`;
- позицію зображення всередині блоку;
- поле тексту підпису;
- placement підпису;
- розмір шрифту;
- стиль шрифту;
- колір тексту.

Після редагування editor має повернути повний `PhotoCaptionState`. View не має здогадуватись, що означає відсутній `fit`, `placement` або `color`; такі значення повинні бути або в state, або в `defaultState` feature descriptor-а.

## 8. Життєвий цикл додавання feature

1. Розробник створює папку feature, наприклад `src/features/media/photoCaption`.
2. Додає `ViewComponent`.
3. Додає `EditorComponent`.
4. Описує `defaultState`.
5. Описує `validate`.
6. Додає `migrate`, якщо state може змінюватися між версіями.
7. Реєструє descriptor у feature registry.
8. Додає приклад block-а у starter document або seed template.
9. Перевіряє local editor, public render і template export.

Рекомендована структура:

```text
src/features/
  media/
    photoCaption/
      descriptor.js
      PhotoCaptionView.jsx
      PhotoCaptionEditor.jsx
      defaults.js
      validation.js
```

## 9. Розмежування відповідальності

Feature відповідає за:

- UI перегляду;
- UI редагування;
- власний state contract;
- дефолти;
- validation;
- optional migration.

Builder відповідає за:

- порядок сторінок і блоків;
- вибір потрібного descriptor-а;
- передачу state у view/editor;
- fallback для невідомих block type;
- збір validation errors.

Storage відповідає за:

- перетворення оновленого site document на change set;
- staged media;
- draft backup у `localStorage` перед publish;
- локальну або GitHub-публікацію;
- атомарність видимого save.

## 10. Acceptance criteria

Feature вважається готовою, якщо:

- має view і editor;
- editor може створити повний state без ручного JSON-редагування;
- view рендерить лише з переданого state;
- state серіалізується в JSON без функцій, класів або runtime-only об'єктів;
- pending media не публікуються до save;
- validation ловить відсутні required поля;
- block можна додати, прибрати або перемістити у site document без переписування App;
- `/admin` показує той самий view, що й public route, з admin-only кнопкою редагування;
- template export зберігає feature у чистому runtime, якщо вона входить до starter template.

## 11. Поточний стан

Поточна реалізація використовує site document builder із `pages[].blocks[]` і feature registry у `src/features`.

Вже доступні feature blocks:

Layouts:

1. `layout.grid` - контейнер із колонками, gap, padding, background і alignment.

Blocks:

1. `author.info` - інформація про автора з nested socials у власному state.
2. `media.photoCaption` - фото з підписом.

Наступний архітектурний крок:

1. Додати reorder blocks.
2. Додати duplicate block.
3. Додати reorder blocks у дереві.
4. Додати duplicate block/layout.
5. Додати migrations для майбутніх версій feature state.
6. Додати video embed block для YouTube/Vimeo.
7. Додати 3D model block для Draco-compressed `.glb`.
