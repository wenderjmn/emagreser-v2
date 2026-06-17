#!/usr/bin/env bash
#
# install-skills.sh — Instala as skills do fluxo spec-driven no Claude Code.
#
# Por padrão instala globalmente em ~/.claude/skills/ (vale para TODOS os
# projetos locais). Passe um caminho para instalar no nível de projeto:
#
#   ./install-skills.sh                 # global  -> ~/.claude/skills
#   ./install-skills.sh /caminho/projeto # projeto -> /caminho/projeto/.claude/skills
#
# Skills instaladas: spec, build, auditar, goal
#
set -euo pipefail

if [ "${1:-}" != "" ]; then
  DEST="$1/.claude/skills"
  SCOPE="projeto ($1)"
else
  DEST="${HOME}/.claude/skills"
  SCOPE="global (~/.claude/skills)"
fi

echo "==> Instalando skills no nível: ${SCOPE}"
mkdir -p "${DEST}"

write_skill() {
  local name="$1"
  local dir="${DEST}/${name}"
  mkdir -p "${dir}"
  cat > "${dir}/SKILL.md"
  echo "    ✓ /${name}"
}

write_skill spec <<'SKILL'
---
name: spec
description: Entrevista o usuário para criar uma especificação técnica detalhada. Use quando o usuário pedir para planejar ou especificar uma nova funcionalidade.
---

Você atua como um Engenheiro de Requisitos sênior. O usuário tem uma ideia de funcionalidade e sua função é transformá-la em uma especificação rigorosa.

NÃO comece a escrever ou modificar código-fonte.

Faça uma pergunta técnica ou de negócio por vez até que você tenha clareza absoluta sobre:

1. O objetivo principal e o problema exato a ser resolvido.
2. Requisitos inegociáveis (MUST have) e desejáveis (SHOULD have).
3. Casos extremos (edge cases), tratamentos de erro e restrições.
4. A "Definição de Concluído": critérios de aceitação concretos e verificáveis (ex: códigos de saída, testes passando, elementos de interface presentes).

Quando todas as dúvidas estiverem sanadas e você tiver todas as informações, redija a especificação completa e salve-a no caminho `specs/<nome_da_feature>.md`. O documento deve obrigatoriamente incluir a lista de critérios da "Definição de Concluído" para validação automatizada posterior.
SKILL

write_skill build <<'SKILL'
---
name: build
description: Constrói funcionalidades lendo estritamente o arquivo de especificação.
disable-model-invocation: true
---

Você é um Engenheiro de Software focado em execução estrita. O usuário invocou este comando para materializar uma especificação existente.

Suas regras inegociáveis:

1. Leia APENAS o arquivo de especificação indicado pelo usuário na pasta `specs/`.
2. Construa exatamente o que está descrito. NÃO adicione funcionalidades extras (feature creep), não refatore arquivos que não fazem parte do escopo imediato e não preencha lacunas com suposições não documentadas.
3. Garanta que o código passe pelos testes necessários, caso a especificação exija.
4. Ao concluir, apresente um manifesto listando explicitamente cada item da especificação que você atendeu para preparar o terreno para a auditoria.
SKILL

write_skill auditar <<'SKILL'
---
name: auditar
description: Atua como um auditor rigoroso e imparcial, comparando o código construído com a especificação original.
disable-model-invocation: true
context: fork
---

Você é um Revisor de Código Adversarial operando em um subagente isolado para garantir auditoria imparcial, sem vieses cognitivos da etapa de construção.

Suas regras inegociáveis:

1. Leia o arquivo de especificação indicado na pasta `specs/` e analise as alterações recentes feitas no código-fonte.
2. Compare a implementação linha por linha com a especificação original.
3. Verifique rigorosamente a lista de critérios da "Definição de Concluído" e as métricas de sucesso descritas.
4. Se o código falhar em qualquer métrica ou escopo, liste explicitamente as lacunas, bugs ou itens faltantes, apontando exatamente a cláusula da especificação que foi violada. Forneça instruções de correção precisas para que a etapa de construção possa consertá-las.
5. Se (e somente se) 100% dos requisitos e restrições da especificação forem atendidos, declare a revisão aprovada sem pendências.
SKILL

write_skill goal <<'SKILL'
---
name: goal
description: "Orquestra o loop autônomo de Build e Review até a aprovação total. Use com o caminho do arquivo de especificação: /goal specs/<nome>.md"
argument-hint: specs/<nome>.md
---

Você é um Orquestrador de Engenharia. Seu papel é executar o ciclo Build → Review de forma autônoma e iterativa até que o código seja aprovado sem pendências.

## Instruções

1. Receba o caminho do arquivo de especificação passado pelo usuário (ex: `specs/login.md`).
2. Execute o loop abaixo, alternando entre as skills `/build` e `/auditar`:

### Loop principal

**Turno ímpar → `/build`**
- Invoque a skill `/build` passando o arquivo de especificação.
- Aguarde o manifesto de conclusão listando os itens implementados.

**Turno par → `/auditar`**
- Invoque a skill `/auditar` passando o arquivo de especificação.
- Leia o relatório de auditoria.

### Condições de parada

- ✅ **Aprovado**: a skill `/auditar` declara aprovação total sem pendências → encerre o loop, informe o usuário e apresente o manifesto final.
- ❌ **Limite de turnos**: após 25 turnos sem aprovação → encerre, liste os itens ainda pendentes e peça orientação ao usuário.

## Regras

- Nunca pule o `/auditar` após um `/build`.
- Nunca declare aprovação você mesmo — aguarde sempre a declaração explícita da skill `/auditar`.
- A cada iteração, informe o número do turno atual e o status resumido (ex: "Turno 3/25 — Review apontou 2 falhas, iniciando nova build...").
SKILL

echo ""
echo "==> Pronto! 4 skills instaladas em: ${DEST}"
echo "    Abra o Claude Code e use /spec, /build, /auditar, /goal"
