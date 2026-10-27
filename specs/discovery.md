# Discovery — Aplicação de Previsão do Tempo

## Contexto

A empresa solicitou uma aplicação para que usuários consultem informações meteorológicas de cidades. A experiência deve permitir localizar uma cidade, consultar as condições atuais e a previsão para os próximos cinco dias, escolher a unidade de temperatura e acessar o serviço por dispositivos móveis.

Este documento registra o entendimento inicial do briefing. Fonte de dados, público-alvo, critérios de desempenho e detalhes de interação ainda precisam ser confirmados.

## Requisitos Funcionais

- **RF-01 — Buscar cidades:** permitir que o usuário pesquise cidades pelo nome.
- **RF-02 — Consultar clima atual:** exibir as condições meteorológicas atuais da cidade selecionada.
- **RF-03 — Consultar previsão:** exibir a previsão para cinco dias da cidade selecionada.
- **RF-04 — Alternar unidade:** permitir alternar entre Celsius e Fahrenheit e atualizar as temperaturas exibidas.
- **RF-05 — Tratar falhas de consulta:** informar quando não for possível obter os dados meteorológicos e permitir que o usuário tente novamente.

## Requisitos Não-Funcionais

Os critérios quantitativos abaixo são propostas iniciais para validação; o briefing não define metas.

- **RNF-01 — Responsividade:** conteúdo e controles devem se adaptar a diferentes tamanhos de tela. Em larguras a partir de 320 px, as funções principais devem estar disponíveis sem rolagem horizontal.
- **RNF-02 — Usabilidade:** busca, consulta da previsão e alternância de unidade devem ser compreensíveis sem treinamento ou documentação externa.
- **RNF-03 — Desempenho:** como meta inicial, 95% das consultas devem apresentar resultados em até 3 segundos, sob condições de rede a definir. O tempo de resposta da fonte externa deve ser considerado e medido separadamente.
- **RNF-04 — Disponibilidade:** como meta inicial, a aplicação deve manter disponibilidade mensal de 99,5%. A medição deve distinguir a disponibilidade da aplicação da disponibilidade da fonte externa de dados.
- **RNF-05 — Acessibilidade:** atender ao WCAG 2.2 nível AA nas telas principais, incluindo operação por teclado, foco visível, contraste adequado e nomes acessíveis para controles.
- **RNF-06 — Compatibilidade:** navegadores e versões móveis suportados devem ser definidos antes da implementação.
- **RNF-07 — Atualidade dos dados:** exibir o horário da última atualização e definir uma idade máxima para considerar os dados atuais; dados mais antigos devem ser identificados como desatualizados.
- **RNF-08 — Privacidade e segurança:** documentar dados coletados, finalidade e período de retenção; proteger dados em trânsito. Caso seja implementada localização por GPS, seu uso deve ser informado e depender de permissão do usuário.

## Riscos

- **Dependência de dados externos:** indisponibilidade, limites de uso ou mudanças na fonte meteorológica podem impedir consultas.
- **Ambiguidade na busca:** nomes iguais ou semelhantes podem levar à seleção da cidade errada sem contexto adicional, como estado ou país.
- **Atualidade dos dados:** sem uma política de atualização e indicação de horário, usuários podem interpretar dados desatualizados como atuais.
- **Diferenças de fuso horário:** a previsão diária pode ser agrupada incorretamente se o fuso da cidade não for considerado.
- **Escopo móvel indefinido:** “usar em dispositivos móveis” pode significar apenas um site responsivo ou também uma aplicação instalável.
- **Dependência de localização:** se localização automática for incluída, permissões e tratamento de dados de localização precisam ser definidos.
- **Expectativas não especificadas:** não há definição sobre unidades de outras grandezas, idioma, localização automática ou persistência de preferências.

## Perguntas em Aberto

1. A aplicação será um site responsivo, um app instalável (PWA) ou ambos?
2. Qual fonte de dados meteorológicos deve ser utilizada? Há requisitos de licença, custo ou limites de uso?
3. A busca deve aceitar apenas o nome da cidade ou também país, estado/região e código postal?
4. O que deve ser exibido para diferenciar cidades homônimas?
5. Quais informações compõem “clima atual” e “previsão de 5 dias” (por exemplo: temperatura mínima/máxima, condição, precipitação e vento)?
6. A previsão de cinco dias deve incluir dados por dia ou também por hora?
7. Celsius ou Fahrenheit deve ser a unidade inicial? A preferência deve persistir entre visitas?
8. O produto deve oferecer localização automática por GPS ou permitir salvar cidades favoritas?
9. Qual idioma ou quais idiomas devem ser suportados?
10. As metas propostas de desempenho (95% em até 3 segundos), disponibilidade (99,5% ao mês), responsividade (a partir de 320 px) e acessibilidade (WCAG 2.2 AA) são adequadas? Quais navegadores e versões devem ser compatíveis?
11. Como a aplicação deve se comportar quando a busca não encontrar resultados ou a fonte de dados falhar?
12. Qual idade máxima os dados podem ter antes de serem identificados como desatualizados?
13. Quais dados podem ser coletados, por quanto tempo devem ser retidos e a localização por GPS será oferecida?

## Suposições

- A consulta começa com a busca e seleção explícita de uma cidade; localização automática não está incluída até confirmação.
- “Clima atual” e “previsão de 5 dias” serão fornecidos por uma fonte externa de dados meteorológicos.
- Celsius e Fahrenheit se aplicam às temperaturas; outras unidades não estão definidas no briefing.
- A previsão é associada à cidade selecionada e deve respeitar seu fuso horário.
- O suporte a dispositivos móveis será atendido inicialmente por uma interface web responsiva; desenvolvimento de aplicativo nativo não está implícito.
- Não há requisitos definidos para autenticação, contas, cidades favoritas ou armazenamento de preferências.