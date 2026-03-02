---
tags: [packages]
related_files:
  - packages/ui-tokens/src/index.ts
  - packages/ui-tokens/package.json
last_updated: 2026-03-02
---

# ui-tokens

**Раздел:** [[packages/_index|Пакеты]] · **Главная:** [[_index]]

---

## Обзор

`@wallet/ui-tokens` — дизайн-токены для единообразного UI. Zero runtime dependencies. Build: `tsup`.

---

## Экспорты

### `colors`

Светлая и тёмная темы. По 20 токенов в каждой:

| Токен | Light | Dark |
|-------|-------|------|
| `primary` | `#0B0F1F` | `#3B82F6` |
| `primaryLight` | `#1A1F35` | `#60A5FA` |
| `background` | `#FFFFFF` | `#0F172A` |
| `surface` | `#F9FAFB` | `#1E293B` |
| `text` | `#111827` | `#F8FAFC` |
| `textSecondary` | `#6B7280` | `#CBD5E1` |
| `success` | `#10B981` | `#10B981` |
| `error` | `#EF4444` | `#EF4444` |
| `warning` | `#F59E0B` | `#F59E0B` |
| `info` | `#3B82F6` | `#3B82F6` |
| ... и другие | | |

### `typography`

| Свойство | Значения |
|----------|---------|
| `fontFamily.sans` | system-ui, Segoe UI, Roboto... |
| `fontFamily.mono` | SF Mono, Consolas, monospace |
| `fontSize` | xs(12), sm(14), base(16), lg(18), xl(20), 2xl(24), 3xl(30), 4xl(36) |
| `fontWeight` | normal(400), medium(500), semibold(600), bold(700) |
| `lineHeight` | tight(1.25), normal(1.5), relaxed(1.75) |

### `spacing`

Шкала 0–32: `{ 0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48, 16: 64, 20: 80, 24: 96, 32: 128 }`

### `borderRadius`

`{ none: 0, sm: 4, md: 8, lg: 12, xl: 16, full: 9999 }`

### `shadows`

| Уровень | Значение |
|---------|---------|
| `sm` | `0 1px 2px rgba(0,0,0,0.05)` |
| `md` | `0 4px 6px rgba(0,0,0,0.1)` |
| `lg` | `0 10px 15px rgba(0,0,0,0.1)` |
| `xl` | `0 20px 25px rgba(0,0,0,0.1)` |

### `breakpoints`

`{ sm: 640, md: 768, lg: 1024, xl: 1280 }`

---

## Использование

```typescript
import { colors, typography, spacing } from '@wallet/ui-tokens'

// В React Native:
const style = {
  backgroundColor: colors.dark.background,
  fontSize: typography.fontSize.base,
  padding: spacing[4],
}

// В Tailwind — токены используются для конфигурации tailwind.config.js
```

> В Desktop приложении Tailwind CSS используется напрямую, tokens служат справочником и могут использоваться для кастомизации Tailwind config.

---

## См. также

- [[architecture/monorepo|Монорепо]] — workspace protocol
- [[frontend/_index|Frontend]] — где токены применяются
