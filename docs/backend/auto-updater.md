---
tags: [backend]
related_files:
  - apps/desktop/src/backend/auto-updater.ts
  - apps/desktop/electron-builder-nosign.json
  - apps/desktop/package.json
last_updated: 2026-03-04
---

# Auto-Updater (Backend Module)

**Раздел:** [[backend/_index|Backend]] · **Главная:** [[_index]]

---

## Файл

`apps/desktop/src/backend/auto-updater.ts`

## Описание

Модуль управления жизненным циклом автоматических обновлений EVM Wallet. Использует `electron-updater` для проверки, скачивания и установки обновлений из GitHub Releases, а `electron-log` — для логирования всех событий.

## API

### `initAutoUpdater(mainWindow: BrowserWindow): void`

Инициализирует auto-updater. Вызывается в `main.ts` после `createWindow()`, только в production-режиме.

```typescript
import { initAutoUpdater } from './auto-updater'

// app.whenReady():
if (!isDevelopment && mainWindow) {
  initAutoUpdater(mainWindow)
}
```

## Конфигурация

Feed URL задаётся явно:

```typescript
autoUpdater.setFeedURL({
  provider: 'github',
  owner: 'alexander-shmidt14',
  repo: 'EVM-wallet',
  private: false
})
```

### artifactName

Для консистентности имени installer-а и записи в `latest.yml` используется:

```json
"artifactName": "EVM-Wallet-Setup-${version}.exe"
```

Задаётся в блоке `"win"` в:
- `apps/desktop/electron-builder-nosign.json` (CI builds)
- `apps/desktop/package.json` → `"build"."win"` (local builds)

Без `artifactName` electron-builder генерирует имя из `productName` (с пробелами), что вызывает mismatch при скачивании updater-ом.

## События

| Событие | Действие |
|---------|----------|
| `update-available` | Диалог: «Скачать обновление?» |
| `update-not-available` | Логирование, повторная проверка через 30 мин |
| `download-progress` | Прогресс в taskbar + IPC `update-progress` в renderer |
| `update-downloaded` | Диалог: «Перезагрузить сейчас?» |
| `error` | Логирование + non-blocking диалог ошибки |

## IPC Event

Renderer может подписаться на прогресс загрузки:

```typescript
window.electronAPI.onUpdateProgress(({ percent }) => {
  console.log(`Download: ${percent}%`)
})
```

## Периодическая проверка

- Первая проверка: сразу при запуске
- Повтор: каждые 30 минут (`setInterval`)

## См. также

- [[devops/auto-update|Auto-Update System]] — полная документация DevOps
- [[devops/release|Релиз]] — процесс тегирования и публикации
- [[backend/electron-main|Electron Main]] — инициализация модуля
