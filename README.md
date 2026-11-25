# @lalsilva/designacoes-vida-e-ministerio-core

Biblioteca de domínio em TypeScript contendo tipos, validadores das diretrizes S-38, regras de conflito de agenda e motor de sugestão/ranqueamento para a automação das designações da Reunião Vida e Ministério Cristão.

Projetada como pacote NPM privado no GitHub Packages para ser compartilhada entre a API e o Frontend, garantindo uma única fonte de verdade para as regras de negócio.

## Recursos

- **Tipagem e Enums de Domínio (`types`)**: Interfaces e enums em inglês com documentação JSDoc completa (`IPublisher`, `IMeetingPart`, `IAssignment`, `ICalendarEvent`, `ValidationReasonCode`, entre outros).
- **Validadores de Elegibilidade (`validators/eligibility`)**:
  - `validateAssigneeEligibility`: valida status de estudante ativo, gênero exigido e hierarquia mínima de privilégio.
  - `validateAssistantEligibility`: valida regras de pareamento de ajudantes (mesmo sexo ou mesmo grupo familiar, conforme o tipo de parte).
- **Validadores de Calendário e Agenda (`validators/schedule`)**:
  - `validateMeetingDateAvailability`: verifica se a semana da reunião (segunda a domingo) está cancelada por Assembleia, Congresso ou Celebração.
  - `validatePublisherScheduleConflicts`: impede duas designações na mesma data (titular ou ajudante) e repetição da mesma parte no mesmo mês.
- **Motor de Sugestão e Ranqueamento (`suggesters/assignment`)**:
  - `suggestAssignees`: filtra e ordena candidatos a titular priorizando privilégio-alvo (`targetPrivilege`), maior tempo sem fazer a parte específica e maior tempo sem qualquer designação.
  - `suggestAssistants`: filtra e ordena candidatos a ajudante priorizando disponibilidade na data e maior tempo sem atuar como ajudante.

## Instalação (GitHub Packages)

Por ser um pacote privado hospedado no GitHub Packages, é necessário configurar a autenticação uma única vez na máquina local e mapear o escopo no repositório consumidor.

### 1. Configurar credencial global (uma vez por máquina)

1. No GitHub, acesse **Settings → Developer settings → Personal access tokens → Tokens (classic)**.
2. Gere um token marcando apenas o escopo `read:packages`.
3. Adicione o token ao arquivo `~/.npmrc` da sua pasta de usuário:

```ini
//[npm.pkg.github.com/:_authToken=SEU_TOKEN_AQUI](https://npm.pkg.github.com/:_authToken=SEU_TOKEN_AQUI)
```

### 2. Mapear o escopo no projeto consumidor (API / Frontend)

Crie um arquivo `.npmrc` na raiz do repositório que vai consumir a biblioteca (este arquivo não contém segredos e pode ser versionado no Git):

```ini
@lalsilva:registry=[https://npm.pkg.github.com](https://npm.pkg.github.com)
```

### 3. Instalar o pacote

```bash
npm install @lalsilva/designacoes-vida-e-ministerio-core
```

## Exemplo de Uso

```typescript
import {
  Gender,
  IMeetingPart,
  IPublisher,
  MaritalStatus,
  MeetingSection,
  Privilege,
  suggestAssignees,
  validateAssigneeEligibility,
} from "@lalsilva/designacoes-vida-e-ministerio-core";

const publisher: IPublisher = {
  id: "pub-1",
  fullName: "João Silva",
  gender: Gender.Male,
  maritalStatus: MaritalStatus.Married,
  isParent: false,
  isMinor: false,
  isBaptized: true,
  privilege: Privilege.MinisterialServant,
  isApprovedChairman: false,
  isApprovedCbsConductor: false,
  canPray: true,
  canReadCbs: true,
  isActiveStudent: true,
};

const spiritualGems: IMeetingPart = {
  id: "part-gems",
  section: MeetingSection.Treasures,
  name: "Spiritual Gems",
  requiredGender: Gender.Male,
  minimumPrivilege: Privilege.MinisterialServant,
  targetPrivilege: Privilege.MinisterialServant,
  requiresAssistant: false,
  allowsFamilyAssistant: false,
};

// Validação pontual (retorna códigos padronizados prontos para i18n)
const validation = validateAssigneeEligibility(publisher, spiritualGems);

// Sugestão ranqueada para uma data específica
const candidates = suggestAssignees(
  [publisher],
  spiritualGems,
  new Date("2026-11-12T19:45:00.000Z"),
  [],
);
```

## Desenvolvimento Local

### Requisitos

- Node.js 22+
- npm

### Comandos

```bash
# Instalar dependências
npm install

# Executar a suíte de testes unitários (Vitest)
npm test

# Executar testes em modo watch
npm run test:watch

# Compilar TypeScript e gerar declarações (.d.ts) em dist/
npm run build
```

## Fluxo de Desenvolvimento (Gitflow)

- **`main`**: código estável em produção correspondente às versões publicadas.
- **`develop`**: branch de integração das novas funcionalidades.
- **`feature/*`**: novas funcionalidades criadas a partir de `develop`.
- **`refactor/*`, `fix/*`, `docs/*`**: refatorações, correções e documentação a partir de `develop`.
- **`release/*`**: preparação de versão (`package.json`, changelog) antes do merge em `main` e `develop`.
- **`hotfix/*`**: correções urgentes criadas a partir de `main` e integradas de volta em `main` e `develop`.

### Padrão de Commits e Código

- Código-fonte, tipos, documentação JSDoc e mensagens de commit em inglês seguindo [Conventional Commits](https://www.conventionalcommits.org/).

### Publicação de Novas Versões

A publicação no GitHub Packages é automatizada via GitHub Actions (`.github/workflows/publish.yml`). Ao criar e publicar uma nova **Release** (ex.: `v1.1.0`) apontando para a `main`, o workflow executa `npm test && npm run build` via `prepublishOnly` e publica o pacote automaticamente.
