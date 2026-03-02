---
tags: [frontend]
related_files:
  - apps/desktop/src/frontend/components/ErrorBoundary.tsx
  - apps/desktop/src/frontend/components/Loading.tsx
  - apps/desktop/src/frontend/components/QRCode.tsx
  - apps/desktop/src/frontend/components/Toast.tsx
  - apps/desktop/src/frontend/components/icons/EthIcon.tsx
  - apps/desktop/src/frontend/components/icons/MmaIcon.tsx
  - apps/desktop/src/frontend/components/BlockConfirmationBar.tsx
  - apps/desktop/src/frontend/components/TransactionItem.tsx
  - apps/desktop/src/frontend/components/TransactionDetailPopup.tsx
last_updated: 2026-03-02
---

# Компоненты

**Раздел:** [[frontend/_index|Frontend]] · **Главная:** [[_index]]

---

## Shared компоненты

| Компонент | Файл | Описание |
|-----------|------|----------|
| `AppErrorBoundary` | `components/ErrorBoundary.tsx` | React Error Boundary — ловит ошибки render, показывает fallback UI |
| `Loading` | `components/Loading.tsx` | Спиннер с сообщением. Props: `fullScreen`, `message`, `size` (`sm`/`md`/`lg`) |
| `QRCode` | `components/QRCode.tsx` | Генерация QR-кода для адреса кошелька (библиотека `qrcode`) |
| `Toast` | `components/Toast.tsx` | Обёртка над `react-toastify` (в данный момент закомментирована в `App.tsx`) |

## Иконки

| Компонент | Файл | Описание |
|-----------|------|----------|
| `EthIcon` | `components/icons/EthIcon.tsx` | SVG-иконка Ethereum: алмаз на тёмном круге (#343A54). Props: `size?: number` (default 40) |
| `MmaIcon` | `components/icons/MmaIcon.tsx` | SVG-иконка MMA Coin: красный градиент (#BE0E20→#8B0A18), шестиугольная рамка, стилизованная буква "M". Props: `size?: number` (default 40) |

## Использование иконок

```tsx
import { EthIcon } from '../components/icons/EthIcon'
import { MmaIcon } from '../components/icons/MmaIcon'

// В JSX:
<EthIcon size={40} />   // Ethereum diamond, 40×40px
<MmaIcon size={40} />   // MMA Coin, 40×40px
```

Используются в [[frontend/screens/wallet|WalletScreen]] для отображения иконок в списке активов.

## История транзакций

| Компонент | Файл | Описание |
|-----------|------|----------|
| `BlockConfirmationBar` | `components/BlockConfirmationBar.tsx` | Анимированная полоса подтверждения блоков. Показывает 12 блоков (Ethereum finality standard): зелёные=подтверждено, жёлтые+пульс=текущий, серые=ожидается, красные=ошибка. Props: `confirmations`, `status`, `maxBlocks` |
| `TransactionItem` | `components/TransactionItem.tsx` | Строка транзакции в списке. Показывает: иконку направления (↑ красная / ↓ зелёная), тип (ETH/ERC-20), адрес контрагента, сумму, относительное время, статус. Props: `tx`, `currentAddress`, `onClick` |
| `TransactionDetailPopup` | `components/TransactionDetailPopup.tsx` | Full-screen попап с деталями tx: hash, from, to, value, статус, BlockConfirmationBar с real-time поллингом (каждые 5с), кнопка "View on Etherscan". Props: `tx`, `onClose` |

### Использование компонентов истории

```tsx
import { TransactionItem } from '../components/TransactionItem'
import { TransactionDetailPopup } from '../components/TransactionDetailPopup'
import { BlockConfirmationBar } from '../components/BlockConfirmationBar'

// Список транзакций:
<TransactionItem tx={tx} currentAddress={addr} onClick={() => setSelected(tx)} />

// Попап с деталями:
<TransactionDetailPopup tx={selectedTx} onClose={() => setSelected(null)} />

// Анимация блоков (используется внутри TransactionDetailPopup):
<BlockConfirmationBar confirmations={6} status="confirmed" maxBlocks={12} />
```

---

## См. также

- [[frontend/screens/wallet|WalletScreen]] — где используются EthIcon и MmaIcon
- [[frontend/screens/receive|ReceiveScreen]] — где используется QRCode
- [[frontend/app-flow|Маршрутизация]] — где используется Loading и ErrorBoundary
