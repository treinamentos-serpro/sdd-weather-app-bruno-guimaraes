---
mode: agent
description: 'Valida as condições de uso e a atribuição da Open-Meteo para a T-01.'
---

# Prompt — T-01: Validar uso da Open-Meteo e atribuição

Você é o **Code Agent**. Implemente a tarefa T-01 de
`tasks/weather-app-tasks.md`, usando a especificação e o plano como contexto.

## Contexto

O Weather App é uma aplicação React + TypeScript, em pt-BR, que consultará a
Open-Meteo diretamente por HTTPS, sem exigir API key do usuário. As APIs
planejadas são:

- Geocoding: `https://geocoding-api.open-meteo.com/v1/search`
- Forecast: `https://api.open-meteo.com/v1/forecast`

A especificação e o plano definem a Open-Meteo como fonte pretendida, mas
condicionam sua integração à validação de cobertura, licença, atribuição
exigida, limites e disponibilidade para o uso previsto. A atribuição validada
deverá aparecer na tela de resultados. Se houver restrição impeditiva, a
integração fica bloqueada até a decisão sobre a fonte ser revista.

Esta tarefa é uma pré-condição para a implementação dos serviços e da
interface de resultados. Não implemente a jornada completa de previsão: ela
pertence a outras tarefas do backlog.

## Fontes de referência

Consulte e cite fontes oficiais e atuais da Open-Meteo, incluindo, conforme
aplicável:

- Forecast API: <https://open-meteo.com/en/docs>
- Geocoding API: <https://open-meteo.com/en/docs/geocoding-api>
- Termos/licença, atribuição, limites e disponibilidade: localize as páginas
  oficiais pertinentes durante a validação.

Não use resultados de busca, blogs ou conhecimento prévio como evidência
principal quando houver documentação oficial disponível. Registre links
diretos e a data da consulta. Não afirme SLA, disponibilidade garantida,
licença aplicável ou condições comerciais sem evidência oficial. Se não for
possível verificar um item, registre-o explicitamente como não confirmado;
não o trate como aprovado.

## Critérios de aceite

1. As condições de uso aplicáveis às APIs de geocoding e previsão foram
   verificadas em fontes oficiais, com links diretos e data da consulta
   registrados.
2. Foram avaliados e documentados, separadamente quando necessário:
   - cobertura para as localidades pretendidas;
   - licença e condições aplicáveis ao uso previsto;
   - texto e localização exigidos para atribuição;
   - limites de uso;
   - disponibilidade e eventuais garantias ou ausência delas.
3. O texto e o local de exibição da atribuição na tela de resultados estão
   identificados a partir da documentação verificada.
4. Qualquer restrição impeditiva, incerteza relevante ou condição incompatível
   com o uso pretendido está claramente registrada. Se houver impedimento,
   não integre a fonte nem apresente a validação como aprovada; indique que a
   decisão sobre a fonte precisa ser revista.
5. A mudança permanece dentro do escopo de T-01: não implemente busca,
   forecast, estados completos de resultados ou outras funcionalidades de
   tarefas posteriores.
6. Se código de atribuição for implementado nesta tarefa, ele deve usar
   exatamente o texto e o destino de link confirmados nas fontes oficiais, ser
   acessível e ter teste correspondente. Não invente texto de atribuição.
7. Ao final, informe quais itens foram confirmados, quais permanecem
   pendentes e quais comandos de validação foram executados, com seus
   resultados.

## Arquivos

Leia:

- `specs/weather-app-spec.md`
- `plans/weather-app-plan.md`
- `tasks/weather-app-tasks.md`, especialmente a definição de T-01 e a tarefa
  T-23, que depende da atribuição validada.

Altere:

- `plans/weather-app-plan.md`: registre os resultados da validação, fontes
  oficiais com URLs diretas e data de consulta; atualize as decisões sobre
  uso da API e atribuição sem apagar o contexto técnico já existente.

Considere, somente se necessário para cumprir T-01:

- `src/components/CityResults.tsx`: o backlog cita este arquivo como provável
  para a atribuição. No estado atual do repositório, `src/` ainda não existe.
  Não crie a tela completa de resultados para antecipar T-23. Se implementar
  a atribuição agora for necessário, faça a menor mudança possível e deixe o
  restante da tela para a tarefa correspondente.
- `tests/components/CityResults.test.tsx`: crie ou atualize apenas se houver
  implementação de código nesta tarefa; verifique o texto/link acessível da
  atribuição sem chamar a API real.

## Restrições

- Não adicione dependências sem necessidade.
- Não faça chamadas reais à API nos testes.
- Não invente conclusões quando a documentação não for clara; registre a
  lacuna e explique seu impacto na decisão.
- Preserve as convenções do projeto: TypeScript strict, componentes React
  tipados, acessibilidade e narrativa/documentação em pt-BR.
- Se houver mudanças em `src/` ou `tests/`, rode `pnpm lint`, `pnpm build` e
  `pnpm test`. Informe cada comando e seu resultado. Não declare validação
  bem-sucedida se algum deles falhar.
