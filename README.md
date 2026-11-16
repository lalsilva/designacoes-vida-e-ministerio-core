# Designações Vida e Ministério - Core

Este pacote contém as definições de tipos (Interfaces, Enums) e o motor de regras de negócio baseado nas diretrizes S-38 para a geração de escalas da reunião Vida e Ministério.

Ao manter o domínio centralizado aqui, garantimos que a API (Backend), o Frontend Web e o Aplicativo Mobile falem exatamente o mesmo "idioma" e respeitem as mesmas regras de validação.

## 📦 O que este pacote inclui?
- **Types/Interfaces:** Estruturas de dados para `Publicadores`, `Escalas`, `Partes` e `Ausencias`.
- **Enums:** Constantes para Privilégios, Gêneros e Status.
- **Validações:** Funções puras em TypeScript que validam regras específicas (ex: validação de ajudantes da mesma família ou mesmo sexo).

## 🚀 Instalação (Para Desenvolvedores do Projeto)
Como este é um pacote privado hospedado no GitHub Packages, você precisará estar autenticado no NPM com o seu token do GitHub.

```bash
npm install @seu-usuario/designacoes-vida-e-ministerio-core
```

## 🛠️ Como Contribuir
1. Clone o repositório.
2. Instale as dependências com `npm install`.
3. Adicione ou modifique as regras na pasta `src/`.
4. Compile o código com `npm run build`.
5. Atualize a versão no `package.json` e publique com `npm publish`.

## 🌿 Fluxo de Desenvolvimento (Git Workflow)
Utilizamos um Gitflow simplificado para garantir a estabilidade do pacote publicado.

### Branches Principais
- **`main`**: Reflete a versão de produção. Somente recebe *merges* da branch `develop` quando um novo *release* do pacote está pronto para ser publicado.
- **`develop`**: Branch de integração e testes. Todas as novas *features* e correções convergem para cá.

### Como Contribuir
1. Certifique-se de estar na branch de integração:
   `git checkout develop`
2. Atualize sua base local:
   `git pull origin develop`
3. Crie uma branch para a sua funcionalidade ou correção:
   `git checkout -b feature/nome-da-sua-feature` (ou `fix/...`)
4. Desenvolva, teste e faça seus commits granulares.
5. Envie para o repositório remoto:
   `git push origin feature/nome-da-sua-feature`
6. Abra um **Pull Request (PR)** apontando a sua branch para a branch **`develop`**.
