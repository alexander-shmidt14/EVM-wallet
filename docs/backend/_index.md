---
tags: [moc, backend]
last_updated: 2026-03-02
---

# Backend

> Electron main process — ядро десктопного приложения.

**Родитель:** [[_index|Главная]]

---

## Страницы раздела

| Страница | Описание |
|----------|----------|
| [[backend/electron-main\|Electron Main]] | Жизненный цикл, BrowserWindow, инициализация |
| [[backend/ipc-reference\|Справочник IPC]] | Все 20+ IPC-каналов: auth, wallets, wallet |
| [[backend/transaction-history\|История транзакций]] | Входящие + исходящие транзакции, Etherscan API |
| [[backend/secure-store\|Secure Store]] | Зашифрованное JSON-хранилище (safeStorage) |
| [[backend/preload\|Preload]] | contextBridge, маппинг electronAPI → IPC |
| [[backend/auto-updater\|Auto-Updater]] | Модуль автообновлений (electron-updater) |

---

## Связанные разделы

- [[architecture/data-flow|Поток данных]] — как Backend связан с Frontend и wallet-core
- [[architecture/security|Безопасность]] — модель защиты данных
- [[frontend/store|Zustand Store]] — что вызывает IPC из renderer
- [[packages/wallet-core|wallet-core]] — бизнес-логика, которую вызывает main.ts
