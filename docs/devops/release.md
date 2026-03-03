---
tags: [devops]
related_files:
  - .github/workflows/windows-build.yml
  - apps/desktop/electron-builder-nosign.json
  - apps/desktop/src/backend/auto-updater.ts
last_updated: 2026-03-03
---

# Процесс релиза

**Раздел:** [[devops/_index|DevOps]] · **Главная:** [[_index]]

---

## Шаги

### 1. Подготовка

1. Убедиться что `dev` стабилен (CI зелёный)
2. Создать PR: `dev` → `staging`
3. Merge → CI + Windows Build на staging
4. Тестирование артефакта из staging

### 2. Релиз

1. PR: `staging` → `main`
2. Merge в `main`
3. Создать тег:

```bash
git checkout main
git pull
git tag v1.0.0
git push origin v1.0.0
```

### 3. Автоматическая публикация и развёртывание

При push тага `v*` [[devops/windows-build|Windows Build]] автоматически:

1. Собирает .exe installer (NSIS)
2. Генерирует `latest.yml` metafile (для [[devops/auto-update|auto-updater]])
3. Создаёт GitHub Release с:
   - `.exe` installer
   - `latest.yml` (версия, хэш, URL для скачивания)
   - `blockmap` (для дифференциальных обновлений)
   - Авто-генерированными release notes

**Клиентское развёртывание:**
- Установленные приложения версии < новой версии
- Проверяют GitHub Releases каждые 30 минут
- Видят диалог: "Доступна версия X.Y.Z"
- [[devops/auto-update|Скачивают и устанавливают]] автоматически (с согласия пользователя)

### 4. Pre-release

Для beta/rc версий:

```bash
git tag v1.1.0-beta.1
git push origin v1.1.0-beta.1
```

Release будет создан с флагом `prerelease: true`.

## Версионирование

Семантическое версионирование: `MAJOR.MINOR.PATCH`

| Изменение | Пример |
|-----------|--------|
| Breaking change | `1.0.0` → `2.0.0` |
| Новая функциональность | `1.0.0` → `1.1.0` |
| Bug fix | `1.0.0` → `1.0.1` |

**Текущая версия:** `1.1.0` (в `apps/desktop/package.json`)

---

## См. также

- [[devops/windows-build|Windows Build]] — автосборка при теге
- [[devops/auto-update|Авто-обновления]] — скачивание обновлений клиентами
- [[devops/branching|Git-стратегия]] — модель ветвления
- [[changelog/_index|Changelog]] — история изменений
