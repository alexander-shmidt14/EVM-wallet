---
tags: [devops]
related_files:
  - .github/workflows/android-build.yml
last_updated: 2026-03-02
---

# Android Build (ОТКЛЮЧЁН)

**Раздел:** [[devops/_index|DevOps]] · **Главная:** [[_index]]

---

## Статус: DISABLED

Android build pipeline **отключён**. Автоматические триггеры (push, PR) закомментированы.

## Причина

Mobile приложение (`apps/mobile/`) находится в ранней стадии и не является приоритетом. Pipeline был отключён чтобы не расходовать GitHub Actions минуты.

## Как запустить вручную

1. GitHub → Actions → "Android Build (DISABLED)"
2. "Run workflow"
3. В поле `confirm` введите **`yes`** (обязательно)
4. Дождитесь результата

Без ввода `yes` pipeline завершится на первом шаге с ошибкой.

## Что делает pipeline (когда активен)

1. Install dependencies (pnpm)
2. Build shared packages (wallet-core, ui-tokens)
3. Setup Java 17 + Android SDK
4. `cd apps/mobile/android && ./gradlew assembleRelease`
5. Upload APK артефакт
6. GitHub Release при теге `v*`

## Как включить обратно

Раскомментировать триггеры в `.github/workflows/android-build.yml`:

```yaml
on:
  push:
    branches: [dev, staging, main]
  pull_request:
    branches: [dev, staging, main]
```

---

## См. также

- [[devops/ci-pipeline|CI Pipeline]] — активный CI для desktop
- [[devops/windows-build|Windows Build]] — активный build
