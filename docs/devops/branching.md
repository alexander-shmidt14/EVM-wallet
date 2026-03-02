---
tags: [devops]
last_updated: 2026-03-02
---

# Git-стратегия

**Раздел:** [[devops/_index|DevOps]] · **Главная:** [[_index]]

---

## Модель ветвления

```mermaid
gitgraph
    commit id: "initial"
    branch dev
    checkout dev
    commit id: "setup"
    branch "fix/my-feature"
    checkout "fix/my-feature"
    commit id: "feat: add feature"
    commit id: "fix: corrections"
    checkout dev
    merge "fix/my-feature" id: "PR #N merged"
    branch staging
    checkout staging
    commit id: "release candidate"
    branch main
    checkout main
    commit id: "v1.0.0"
```

## Правила

### Ветки

| Ветка | Назначение | Защита |
|-------|-----------|--------|
| `main` | Production. Стабильные релизы | PR only, CI Gate |
| `staging` | Pre-release тестирование | PR only, CI Gate |
| `dev` | Основная ветка разработки (default) | PR only, CI Gate |
| `fix/*` | Feature/fix ветки | Свободный push |
| `feature/*` | Feature ветки | Свободный push |

### Workflow

1. Создать ветку: `git checkout -b fix/my-change` (от `dev`)
2. Коммиты: `feat:`, `fix:`, `docs:`, `chore:` (conventional commits)
3. Push: `git push -u origin fix/my-change`
4. PR в `dev` → [[devops/ci-pipeline|CI]] запускается автоматически
5. CI Gate ✅ → merge разрешён
6. Merge → [[devops/windows-build|Windows Build]] запускается автоматически
7. `dev` → PR в `staging` → merge → `staging` → PR в `main` → merge

### Conventional Commits

| Префикс | Описание | Пример |
|---------|----------|--------|
| `feat:` | Новая функциональность | `feat: add send ERC-20 screen` |
| `fix:` | Исправление бага | `fix: correct gas estimation` |
| `docs:` | Документация | `docs: update IPC reference` |
| `chore:` | Инфраструктура | `chore: update CI pipeline` |
| `refactor:` | Рефакторинг без изменения API | `refactor: split main.ts` |
| `style:` | Форматирование | `style: fix indentation` |
| `test:` | Тесты | `test: add wallet store tests` |

---

## См. также

- [[devops/ci-pipeline|CI Pipeline]] — какие проверки проходят при PR
- [[devops/release|Релиз]] — как из main создать релиз
- [[guides/contributing|Contributing]] — правила для разработчиков
