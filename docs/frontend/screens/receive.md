---
tags: [frontend, screens]
related_files:
  - apps/desktop/src/frontend/screens/ReceiveScreen.tsx
last_updated: 2026-03-02
---

# ReceiveScreen

**Раздел:** [[frontend/screens/_index|Экраны]] · **Маршрут:** `/receive`

---

## Назначение

Показ адреса кошелька и QR-кода для получения ETH/токенов.

## UI

- QR-код адреса (компонент [[frontend/components|QRCode]])
- Полный адрес кошелька (текст)
- Кнопка "Скопировать адрес" → буфер обмена + feedback
- Кнопка "Назад" → [[frontend/screens/wallet|Wallet]]

## Поведение

1. При монтировании: берёт `currentAddress` из [[frontend/store|store]]
2. Генерирует QR-код через библиотеку `qrcode`
3. Copy → `navigator.clipboard.writeText(address)`

## Используемые IPC

Нет прямых IPC вызовов — адрес уже загружен в store.

## Навигация

- **Откуда:** [[frontend/screens/wallet|Wallet]]
- **Куда:** [[frontend/screens/wallet|Wallet]]

---

## См. также

- [[frontend/components|Компоненты]] — QRCode компонент
- [[frontend/store|Zustand Store]] — `currentAddress`
