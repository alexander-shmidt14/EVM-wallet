---
tags: [devops]
related_files:
  - .github/workflows/windows-build.yml
last_updated: 2026-03-02
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

### 3. Автоматическая публикация

При push тега `v*` [[devops/windows-build|Windows Build]] автоматически:

1. Собирает .exe installer
2. Генерирует SHA256 checksums
3. Создаёт GitHub Release с:
   - `.exe` файлом
   - `SHA256SUMS.txt`
   - Авто-генерированными release notes

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

> Текущая версия: `1.0.0` (в `package.json`)

---

## См. также

- [[devops/windows-build|Windows Build]] — автосборка при теге
- [[devops/branching|Git-стратегия]] — модель ветвления
- [[changelog/_index|Changelog]] — история изменений
