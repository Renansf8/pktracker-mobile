# PkTracker — Mobile

Aplicação mobile para acompanhamento de bankroll e torneios de poker, construída com **Expo** e **React Native**.

Registre seus resultados, gerencie seu bankroll, planeje sua agenda e analise sua performance — direto do celular, com os mesmos dados do [pktracker web](https://github.com/Renansf8/pktracker-frontend).

---

## Funcionalidades

- **Home** — visão geral da atividade recente e métricas principais
- **Torneios** — cadastro, listagem e exclusão de resultados de torneios
- **Resumo mensal** — consolidado de lucro/prejuízo por mês
- **Banca** — controle de depósitos, saques e rake
- **Estatísticas** — análise da sua performance
- **Agenda** — grades e torneios planejados
- **Perfil** — edição de dados da conta e logout

---

## Stack

| Categoria | Biblioteca |
|---|---|
| Framework | Expo ~57 + Expo Router v6 |
| UI | React Native + NativeWind v4 (Tailwind) |
| Navegação | Expo Router (file-based, igual ao Next.js App Router) |
| Dados | TanStack Query v5 |
| Formulários | React Hook Form + Zod |
| HTTP | axios (com interceptor de token) |
| Auth | expo-secure-store (JWT no SecureStore) |
| Notificações | react-native-toast-message |
| Ícones | @expo/vector-icons (Ionicons) |

---

## Arquitetura

Navegação **file-based** via Expo Router: cada arquivo em `app/` é uma rota, igual ao App Router do Next.js — só que sem Server Components, já que tudo roda client-side no dispositivo.

```
app/
├── _layout.tsx           # Root layout — QueryClient, checagem de auth, Toast
├── (auth)/                # Rotas públicas
│   ├── signin.tsx
│   └── signup.tsx
└── (protected)/            # Rotas autenticadas (tab navigator)
    ├── index.tsx           # Home
    ├── tournaments.tsx
    ├── monthly.tsx
    ├── bank.tsx
    ├── stats.tsx
    ├── schedule.tsx
    └── profile.tsx
```

A lógica de dados (queries, mutations) fica em `src/services/hooks/`, espelhando os hooks do projeto web. Telas que crescem demais extraem a lógica pesada para um viewmodel próprio.

A **autenticação** usa `expo-secure-store` para guardar o JWT no dispositivo. Um interceptor do axios injeta o header `Authorization` em toda requisição — equivalente ao proxy `/api/proxy` do web, mas sem precisar de servidor intermediário.

| Web (Next.js) | Mobile (Expo) |
|---|---|
| Cookie `httpOnly` | `expo-secure-store` |
| `/api/proxy` injeta token | Interceptor axios injeta token |
| Tailwind CSS | NativeWind (Tailwind p/ RN) |
| `sonner` toast | `react-native-toast-message` |
| `next/navigation` | `expo-router` |
| Server Components | Tudo client (sem SSR) |

---

## Como rodar

### Pré-requisitos

- Node.js 20+
- Uma instância do [pktracker backend](https://github.com/Renansf8/pktracker-api) rodando *(ou aponte `EXPO_PUBLIC_API_BASE_URL` para uma instância remota)*
- App **Expo Go** instalado no celular (ou um simulador iOS/Android) — a versão do Expo Go deve corresponder ao SDK do projeto (atualmente SDK 57)

### Instalação

```bash
# Instalar dependências
yarn install

# Copiar o arquivo de ambiente e preencher os valores
cp .env.example .env

# Iniciar o servidor de desenvolvimento
npx expo start
```

Escaneie o QR code com o app Expo Go (Android) ou com a câmera (iOS).

### Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `EXPO_PUBLIC_API_BASE_URL` | URL base da API do backend |

> ⚠️ Em dispositivo físico, use o IP local da máquina (ex.: `http://192.168.0.10:3001`) — `localhost` não funciona fora do simulador.

---

## Scripts

```bash
npm run start   # Inicia o Metro bundler / Expo CLI
npm run android # Abre no emulador/dispositivo Android
npm run ios     # Abre no simulador iOS
npm run web     # Abre a versão web do Expo
npm run lint    # Rodar ESLint
npm run test    # Rodar testes (Jest + jest-expo)
```

---

## Estrutura de pastas

```
pktracker-mobile/
├── app/
│   ├── _layout.tsx
│   ├── (auth)/
│   │   ├── signin.tsx
│   │   └── signup.tsx
│   └── (protected)/
│       ├── index.tsx
│       ├── tournaments.tsx
│       ├── monthly.tsx
│       ├── bank.tsx
│       ├── stats.tsx
│       ├── schedule.tsx
│       └── profile.tsx
├── src/
│   ├── components/          # Componentes compartilhados
│   ├── lib/auth/storage.ts  # SecureStore wrapper
│   ├── services/
│   │   ├── api/              # client.ts, endpoints.ts, types.ts
│   │   └── hooks/             # Hooks TanStack Query (por domínio)
│   └── utils/                 # currencyConvert, tournamentLucro, etc.
└── assets/                    # Ícones, splash screen
```

---

## Testes

Os testes unitários usam **Jest** (`jest-expo`) + **React Testing Library**.

```bash
npm run test
```

---

## Licença

MIT
