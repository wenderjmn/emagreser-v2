# Skills do fluxo spec-driven

Conjunto de skills do Claude Code para um fluxo de desenvolvimento guiado por especificação:

| Skill | Comando | O que faz |
|-------|---------|-----------|
| **spec** | `/spec` | Entrevista você e gera a especificação em `specs/<nome>.md` |
| **build** | `/build` | Constrói o código lendo **estritamente** o spec (sem feature creep) |
| **auditar** | `/auditar` | Auditor adversarial isolado (`context: fork`) que compara código x spec |
| **goal** | `/goal specs/<nome>.md` | Orquestra o loop `build → auditar` até a aprovação |

> A skill `auditar` foi renomeada de `review` para evitar conflito com o `/review` nativo.

## Como usar em qualquer projeto

Existem 3 formas, dependendo de onde você usa o Claude Code.

### 1. Local (CLI/desktop) — global em todos os projetos

Rode o instalador **uma vez** na sua máquina. Ele escreve as skills em `~/.claude/skills/`,
que valem para **todos** os projetos locais:

```bash
bash scripts/install-skills.sh
```

Para instalar só num projeto específico:

```bash
bash scripts/install-skills.sh /caminho/do/projeto
```

Depois é só abrir o Claude Code e usar `/spec`, `/build`, `/auditar`, `/goal`.

### 2. Plugin (local + web) — fonte única reutilizável

Este repositório também é um **marketplace de plugin**. Em qualquer projeto:

```bash
# adiciona o marketplace (uma vez)
claude plugin marketplace add wenderjmn/emagreser-v2

# instala o plugin
claude plugin install sdd@claude-skills
```

Pelo plugin, os comandos ficam com namespace: `/sdd:spec`, `/sdd:build`, `/sdd:auditar`, `/sdd:goal`.

### 3. Claude Code na web — por projeto

Sessões web só enxergam o que está **commitado no repo**. Para um projeto novo na web, copie
a pasta `.claude/skills/` para o repositório dele (ou rode o instalador apontando para ele e
faça commit). Alternativamente, declare o plugin no `.claude/settings.json` do projeto:

```json
{
  "enabledPlugins": ["sdd@claude-skills"]
}
```

## Estrutura

```
.claude/skills/            # skills ativas neste repo (/spec, /build, /auditar, /goal)
scripts/install-skills.sh  # instalador local (global ou por projeto)
.claude-plugin/
  marketplace.json         # catálogo do marketplace
plugins/sdd/
  .claude-plugin/plugin.json
  skills/                  # mesmas 4 skills, empacotadas como plugin
```
