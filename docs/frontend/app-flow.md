---
tags: [frontend]
related_files:
  - apps/desktop/src/frontend/App.tsx
last_updated: 2026-03-02
---

# Маршрутизация и Auth Flow

**Раздел:** [[frontend/_index|Frontend]] · **Главная:** [[_index]]

---

## Router

Используется `HashRouter` из react-router-dom v6. Hash-роутинг необходим для Electron — `file://` протокол не поддерживает browser history.

## Маршруты

| Путь | Компонент | Описание |
|------|-----------|----------|
| `/` | `Navigate` | Редирект на основе auth state |
| `/set-password` | [[frontend/screens/set-password\|SetPasswordScreen]] | Создание пароля (первый запуск) |
| `/login` | [[frontend/screens/login\|LoginScreen]] | Вход по паролю |
| `/wallet-select` | [[frontend/screens/wallet-select\|WalletSelectScreen]] | Выбор / управление кошельками |
| `/create-wallet` | [[frontend/screens/create-wallet\|CreateWalletScreen]] | Создание нового кошелька |
| `/import-wallet` | [[frontend/screens/import-wallet\|ImportWalletScreen]] | Импорт по seed phrase |
| `/wallet` | [[frontend/screens/wallet\|WalletScreen]] | Главный экран кошелька |
| `/receive` | [[frontend/screens/receive\|ReceiveScreen]] | QR-код + адрес для получения |
| `/send` | [[frontend/screens/send\|SendScreen]] | Отправка ETH / ERC-20 |

## Auth Guard

```mermaid
flowchart TD
    A["/ (корень)"] --> B{hasPassword?}
    B -- false --> C["/set-password"]
    B -- true --> D{isAuthenticated?}
    D -- false --> E["/login"]
    D -- true --> F["/wallet-select"]
```

Логика в `AppContent` компоненте:

```typescript
const getDefaultRoute = () => {
  if (!hasPassword) return '/set-password'
  if (!isAuthenticated) return '/login'
  return '/wallet-select'
}
```

## Инициализация

При запуске приложения `AppContent` вызывает `initialize()` из [[frontend/store|store]]:

1. `auth:hasPassword` → проверка наличия пароля
2. `wallet:hasWallet` → проверка наличия seed
3. Если есть wallet → `wallet:getAddress(0)` + загрузка списка кошельков
4. `set({ isInitialized: true })`

Пока `isInitialized === false` — показывается [[frontend/components|Loading]] спиннер.

## Навигация между экранами

```mermaid
flowchart LR
    SP[SetPassword] --> WS[WalletSelect]
    L[Login] --> WS
    WS --> CW[CreateWallet]
    WS --> IW[ImportWallet]
    CW --> W[Wallet]
    IW --> W
    WS -->|select| W
    W --> S[Send]
    W --> R[Receive]
    S --> W
    R --> W
    W -->|manage| WS
```

---

## См. также

- [[frontend/store|Zustand Store]] — state-зависимости для роутинга
- [[frontend/screens/_index|Все экраны]] — подробное описание каждого
- [[backend/ipc-reference|Справочник IPC]] — `auth:*` каналы
