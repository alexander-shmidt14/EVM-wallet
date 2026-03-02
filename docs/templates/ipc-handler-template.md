---
tags: [backend]
related_files:
  - apps/desktop/src/backend/main.ts
last_updated: {{date}}
---

# IPC: `{{domain}}:{{action}}`

**Раздел:** [[backend/ipc-reference|IPC Reference]] · **Главная:** [[_index]]

---

## Описание

_Краткое описание хендлера._

## Сигнатура

```
Channel: {{domain}}:{{action}}
Type:    invoke / on
```

## Параметры

| # | Параметр | Тип | Описание |
|---|---------|-----|----------|
| 1 | `param` | `string` | Описание |

## Возвращает

```ts
// тип возвращаемого значения
string | { field: type }
```

## Реализация

```ts
ipcMain.handle('{{domain}}:{{action}}', async (_event, param) => {
  // ...
});
```

## Использование (renderer)

```ts
const result = await window.electronAPI.{{camelCaseMethod}}(param);
```

## Экраны

- [[frontend/screens/...|Экран, который использует]]

---

## См. также

- [[backend/ipc-reference|Полный справочник IPC]]
- [[backend/electron-main|Electron Main]]
