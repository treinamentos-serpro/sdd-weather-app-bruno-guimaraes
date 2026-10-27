# Discovery — Aplicação de Previsão do Tempo

## Contexto

A empresa solicitou uma aplicação para que usuários consultem informações meteorológicas de cidades. A experiência deve permitir localizar uma cidade, consultar as condições atuais e a previsão para os próximos cinco dias, escolher a unidade de temperatura e acessar o serviço por dispositivos móveis.

Este documento registra o entendimento inicial do briefing. Fonte de dados, público-alvo, critérios de desempenho e detalhes de interação ainda precisam ser confirmados.

## Requisitos Funcionais

- **RF-01 — Buscar cidades:** permitir que o usuário pesquise cidades pelo nome.
- **RF-02 — Consultar clima atual:** exibir as condições meteorológicas atuais da cidade selecionada.
- **RF-03 — Consultar previsão:** exibir a previsão para cinco dias da cidade selecionada.
- **RF-04 — Alternar unidade:** permitir alternar entre Celsius e Fahrenheit e atualizar as temperaturas exibidas.
- **RF-05 — Usar em dispositivos móveis:** disponibilizar uma experiência utilizável em dispositivos móveis.

## Requisitos Não-Funcionais

Os itens abaixo são propostas iniciais para validação; o briefing não define metas quantitativas.

- **RNF-01 — Responsividade:** conteúdo e controles devem se adaptar a diferentes tamanhos de tela, incluindo dispositivos móveis.
- **RNF-02 — Usabilidade:** busca, consulta da previsão e alternância de unidade devem ser compreensíveis e acessíveis sem instruções externas.
- **RNF-03 — Desempenho:** resultados devem ser apresentados em tempo adequado; definir uma meta de resposta durante a especificação.
- **RNF-04 — Disponibilidade dos dados:** a aplicação deve informar quando os dados meteorológicos não puderem ser obtidos ou estiverem indisponíveis.
- **RNF-05 — Acessibilidade:** interface e controles devem oferecer suporte a navegação por teclado e tecnologias assistivas, conforme padrão a confirmar.
- **RNF-06 — Compatibilidade:** navegadores e versões móveis suportados devem ser definidos antes da implementação.

## Riscos

- **Dependência de dados externos:** indisponibilidade, limites de uso ou mudanças na fonte meteorológica podem impedir consultas.
- **Ambiguidade na busca:** nomes iguais ou semelhantes podem levar à seleção da cidade errada sem contexto adicional, como estado ou país.
- **Atualidade dos dados:** sem uma política de atualização e indicação de horário, usuários podem interpretar dados desatualizados como atuais.
- **Diferenças de fuso horário:** a previsão diária pode ser agrupada incorretamente se o fuso da cidade não for considerado.
- **Escopo móvel indefinido:** “usar em dispositivos móveis” pode significar apenas um site responsivo ou também uma aplicação instalável.
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
10. Quais são as metas de desempenho, disponibilidade, acessibilidade e compatibilidade de navegadores?
11. Como a aplicação deve se comportar quando a busca não encontrar resultados ou a fonte de dados falhar?

## Suposições

- A consulta começa com a busca e seleção explícita de uma cidade; localização automática não está incluída até confirmação.
- “Clima atual” e “previsão de 5 dias” serão fornecidos por uma fonte externa de dados meteorológicos.
- Celsius e Fahrenheit se aplicam às temperaturas; outras unidades não estão definidas no briefing.
- A previsão é associada à cidade selecionada e deve respeitar seu fuso horário.
- O suporte a dispositivos móveis será atendido inicialmente por uma interface web responsiva; desenvolvimento de aplicativo nativo não está implícito.
- Não há requisitos definidos para autenticação, contas, cidades favoritas ou armazenamento de preferências.