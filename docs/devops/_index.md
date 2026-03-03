---
tags: [moc, devops]
last_updated: 2026-03-02
---

# DevOps

> CI/CD пайплайны, Docker, Git-стратегия, процесс релиза.

**Родитель:** [[_index|Главная]]

---

## Страницы раздела

| Страница | Описание |
|----------|----------|
| [[devops/ci-pipeline\|CI Pipeline]] | GitHub Actions: 6 шагов, CI Gate, PR-гейт |
| [[devops/windows-build\|Windows Build]] | Автосборка .exe: Electron cache, retry, NSIS, publish |
| [[devops/android-build\|Android Build]] | ОТКЛЮЧЁН. Manual dispatch с подтверждением |
| [[devops/docker\|Docker]] | Multi-stage Dockerfile, 4 сервиса compose |
| [[devops/branching\|Git-стратегия]] | fix/* → dev → staging → main |
| [[devops/release\|Релиз]] | Тег → build → installer → GitHub Release → auto-update |
| [[devops/auto-update\|Авто-обновления]] | electron-updater: проверка, скачивание, установка |

---

## Связанные разделы

- [[architecture/monorepo|Монорепо]] — build order пакетов
- [[guides/getting-started|Быстрый старт]] — как запустить локально
