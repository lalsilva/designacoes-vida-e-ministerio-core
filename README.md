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
