# CLAUDE.md — pktracker-mobile

App mobile do PKTracker em React Native com Expo.

---

## Stack

| Categoria | Biblioteca |
|---|---|
| Framework | Expo ~52 + Expo Router v4 |
| UI | React Native + NativeWind v4 (Tailwind) |
| Navegação | Expo Router (file-based, igual ao Next.js App Router) |
| Dados | TanStack Query v5 |
| Forms | react-hook-form + zod |
| HTTP | axios (com interceptor de token) |
| Auth | expo-secure-store (JWT no SecureStore) |
| Notificações | react-native-toast-message |
| Ícones | @expo/vector-icons (Ionicons) |

---

## Estrutura

```
pktracker-mobile/
├── app/
│   ├── _layout.tsx           ← Root layout: QueryClient, check de auth, Toast
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── signin.tsx        ← Login
│   │   └── signup.tsx        ← Cadastro
│   └── (protected)/
│       ├── _layout.tsx       ← Tab navigator (6 abas)
│       ├── index.tsx         ← Home (dashboard)
│       ├── tournaments.tsx   ← Torneios (lista + criar + deletar)
│       ├── bank.tsx          ← Banca (depósito/saque/rake)
│       ├── stats.tsx         ← Stats (analytics)
│       ├── schedule.tsx      ← Agenda (grades)
│       └── profile.tsx       ← Perfil (editar + logout)
├── src/
│   ├── lib/auth/storage.ts   ← SecureStore wrapper
│   ├── services/
│   │   ├── api/
│   │   │   ├── client.ts     ← axios com interceptor de auth
│   │   │   ├── endpoints.ts  ← mesmos endpoints do web
│   │   │   └── types.ts      ← mesmos types do web
│   │   └── hooks/            ← TanStack Query hooks (espelham o web)
│   └── utils/                ← currencyConvert, tournamentLucro
```

---

## Diferenças chave em relação ao web

| Web (Next.js) | Mobile (Expo) |
|---|---|
| Cookie httpOnly | `expo-secure-store` |
| `/api/proxy` injeta token | Interceptor axios injeta token |
| Tailwind CSS | NativeWind (Tailwind p/ RN) |
| `sonner` toast | `react-native-toast-message` |
| `next/navigation` | `expo-router` |
| Server Components | Tudo client (sem SSR) |

---

## Setup

```bash
cd pktracker-mobile
npm install
cp .env.example .env   # ajustar EXPO_PUBLIC_API_BASE_URL
npx expo start
```

No `.env`:
```
EXPO_PUBLIC_API_BASE_URL=http://SEU_IP_LOCAL:3001
```

> ⚠️ No iOS/Android físico, use o IP local da máquina (não localhost).

---

## Padrões de código

- Cada tela em `app/(protected)/nome-da-tela.tsx` 
- Lógica pesada extraída em viewmodels quando a tela crescer
- NativeWind para estilos (classes Tailwind via `className`)
- Cores do tema: `#0a0a0a` bg, `#22c55e` primary, `#f5f5f5` text
