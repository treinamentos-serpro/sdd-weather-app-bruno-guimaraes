# Backlog de Tarefas — Weather App

Backlog derivado de [plano técnico](../plans/weather-app-plan.md) e
[especificação de produto](../specs/weather-app-spec.md). As tarefas estão
agrupadas por etapa de implementação: tipos, funções puras, serviços, hook,
componentes, integração, testes e hardening. As dependências explícitas
registram os pré-requisitos de cada tarefa; a sequência em fatias verticais
abaixo sugere uma ordem alternativa de entrega. Tarefas de validação
pré-publicação não substituem testes automatizados nem autorizam declarar
metas sem evidências.

Cada critério de aceite deve descrever um resultado observável e verificável,
com limiar ou condição explícita quando aplicável. A rastreabilidade de cada
tarefa aponta para os IDs pertinentes de requisitos, critérios de aceite ou
requisitos não funcionais da spec; quando não houver vínculo direto, a tarefa
é identificada como habilitadora técnica e vinculada ao plano.

## Prioridade, tamanho e sequência de entrega

**Prioridade** indica quando a tarefa precisa ser concluída:

- **P0 — MVP:** necessária para a primeira versão funcional e verificável do
  fluxo principal.
- **P1 — qualidade de entrega:** necessária para robustez, acessibilidade ou
  validação antes de considerar a entrega pronta.
- **P2 — evidência de publicação:** pode ser feita depois do MVP interno, mas
  não deve ser interpretada como dispensável; critérios da spec que exigem
  conclusão antes da publicação continuam bloqueando a publicação.

**Tamanho relativo** estima esforço e abrangência, não duração: **P** é
localizado e de baixa complexidade; **M** envolve uma unidade de trabalho com
vários casos ou integrações; **G** cruza estados, fluxos ou múltiplas
plataformas e requer validação abrangente.

| Tarefa | Prioridade | Tamanho | Tarefa | Prioridade | Tamanho |
|---|---|---|---|---|---|
| T-01 | P0 | P | T-23 | P0 | G |
| T-02 | P0 | P | T-24 | P0 | P |
| T-03 | P0 | M | T-25 | P0 | G |
| T-04 | P0 | P | T-26 | P0 | M |
| T-05 | P0 | M | T-27 | P0 | M |
| T-06 | P0 | P | T-28 | P0 | M |
| T-07 | P0 | M | T-29 | P1 | G |
| T-08 | P0 | M | T-30 | P1 | M |
| T-09 | P0 | M | T-31 | P1 | M |
| T-10 | P0 | P | T-32 | P1 | M |
| T-11 | P0 | P | T-33 | P1 | M |
| T-12 | P0 | P | T-34 | P2 | G |
| T-13 | P0 | G | T-35 | P1 | P |
| T-14 | P0 | M | T-36 | P1 | P |
| T-15 | P0 | M | T-37 | P1 | M |
| T-16 | P0 | M | T-38 | P2 | G |
| T-17 | P0 | M | T-39 | P2 | G |
| T-18 | P0 | M | T-40 | P2 | G |
| T-19 | P0 | G | T-41 | P1 | P |
| T-20 | P0 | G | T-42 | P0 | M |
| T-21 | P0 | M | T-43 | P1 | M |
| T-22 | P0 | M |  |  |  |

### Sequência sugerida em fatias verticais

As fatias abaixo entregam incrementos demonstráveis. Dentro de cada fatia,
respeite as dependências declaradas nas tarefas; testes devem acompanhar a
implementação, não ficar para o fim.

1. **Aplicação visível:** T-02, T-03 e T-04. Monta a aplicação e apresenta o
   shell visual inicial. É um primeiro marco rápido, ainda sem consulta de
   clima.
2. **Primeira jornada útil:** T-01 e T-05 a T-27, respeitando dependências.
   Entrega busca e seleção de cidade, condições atuais, cinco dias e
   alternância de unidade, com estados de carregamento e erro; os testes
   unitários e de componentes acompanham cada parte.
3. **MVP verificável:** T-42 e T-28. Confirma os testes unitários/de
   componentes e demonstra a jornada principal em E2E com fixtures; T-28
   depende também do layout responsivo T-27, concluído na fatia anterior.
4. **Robustez e preparação da entrega:** T-29 a T-31, T-43, T-41, T-32,
   T-33 e T-35 a T-37, nessa ordem para respeitar dependências. Acrescenta
   recuperação de falhas, concorrência, teclado, mobile, auditorias de
   acessibilidade, validação externa da fonte e privacidade. T-41 depende de
   T-43; as auditorias e validações externas dependem de T-41.
5. **Evidências para publicação:** T-34 e T-38 a T-40. Conclua depois de
   T-41, conforme dependências. São validações amplas ou medições que podem
   esperar pelo MVP interno, mas seus critérios e NFRs continuam valendo
   antes da publicação.

## Matriz de rastreabilidade dos requisitos funcionais

A tabela relaciona cada requisito funcional da especificação às tarefas que
implementam seu comportamento e às tarefas que o verificam.

| Requisito da spec | Tarefas de implementação | Tarefas de verificação |
|---|---|---|
| FR-01 — Buscar e selecionar uma cidade | T-04, T-05, T-15, T-19, T-21, T-26 | T-06, T-16, T-20, T-22, T-28, T-29, T-35 |
| FR-02 — Consultar as condições atuais | T-04, T-07, T-09, T-13, T-17, T-23, T-26 | T-08, T-10, T-14, T-18, T-25, T-28, T-36 |
| FR-03 — Consultar a previsão de cinco dias | T-04, T-07, T-09, T-13, T-17, T-23, T-26 | T-08, T-10, T-14, T-18, T-25, T-28, T-29, T-36 |
| FR-04 — Alternar a unidade de temperatura | T-04, T-11, T-19, T-24, T-26 | T-12, T-20, T-25, T-28, T-30 |
| FR-05 — Comunicar falhas e permitir recuperação | T-04, T-15, T-17, T-19, T-21, T-23, T-26 | T-16, T-18, T-20, T-22, T-25, T-29 |
| FR-06 — Informar o estado da consulta | T-04, T-19, T-21, T-23, T-26 | T-20, T-22, T-25, T-28, T-29 |

T-02 e T-03 são habilitadoras técnicas comuns do fluxo, e T-01 é a validação
prévia da fonte externa e de sua atribuição. T-42 e T-43 validam,
respectivamente, as suítes unitária/de componentes e E2E de forma transversal.
Todas as tarefas FR-01 a FR-06 têm correspondência de implementação; não há
requisito funcional sem tarefa correspondente.

## Entrega 1 — Tipos

### T-04 — Definir os contratos compartilhados de domínio

- **Descrição:** Declarar os modelos normalizados de cidade, condições atuais,
  previsão, clima, unidade, estados assíncronos e erros recuperáveis.
- **Critérios de aceite:**
  - `City`, `CurrentWeather`, `ForecastDay`, `WeatherData` e `Unit` seguem os
    campos e nulabilidade descritos no plano.
  - Os estados distinguem `idle`, `loading`, `success` e `error`; somente a
    busca representa ausência de correspondências com `empty`.
  - Os erros tipados incluem a operação e os parâmetros necessários para retry.
- **Dependências:** Nenhuma.
- **Arquivos prováveis:** `src/types/weather.ts`.
- **Tipo:** Data.
- **Rastreabilidade:** FR-01 a FR-06; AC-02.4, AC-03.5, AC-05.1 a AC-05.6,
  AC-06.1 a AC-06.5.


## Entrega 2 — Funções puras e normalização

### T-05 — Normalizar resultados de geocoding

- **Descrição:** Converter e validar o payload externo de geocoding para uma
  lista ordenada de `City`, distinguindo resposta vazia de resposta inválida.
- **Critérios de aceite:**
  - Os campos externos são mapeados para o contrato `City`, preservando a
    ordem recebida e convertendo opcionais inválidos para `null`.
  - Nome ou coordenadas obrigatórias inválidas tornam a resposta
    estruturalmente inválida; `results: []` representa busca vazia.
  - A função não acessa rede, React nem estado global.
- **Dependências:** T-04.
- **Arquivos prováveis:** `src/lib/normalizeGeocoding.ts`.
- **Tipo:** Data.
- **Rastreabilidade:** FR-01; AC-01.2, AC-01.2a, AC-01.3, AC-01.4.

### T-07 — Implementar utilitários de calendário local e atualidade

- **Descrição:** Criar funções puras para datas consecutivas no calendário da
  cidade e avaliação de atualidade a partir do horário e offset da fonte.
- **Critérios de aceite:**
  - São geradas cinco datas `YYYY-MM-DD` a partir da data de `current.time`,
    sem depender do fuso ou data do dispositivo e cobrindo viradas de
    mês/ano.
  - Datas locais são validadas e tratadas como componentes UTC; a conversão
    para instante da fonte subtrai o `utc_offset_seconds` retornado.
  - A indicação de desatualização ocorre somente acima de duas horas; horário
    ou offset inválido não permite classificar os dados.
- **Dependências:** T-04.
- **Arquivos prováveis:** `src/lib/date.ts`.
- **Tipo:** Data.
- **Rastreabilidade:** FR-02, FR-03; AC-02.5, AC-02.6, AC-03.1, AC-03.4;
  NFR-07.

### T-09 — Mapear códigos meteorológicos WMO para pt-BR

- **Descrição:** Implementar a tabela de condições em português do Brasil,
  incluindo o comportamento para códigos desconhecidos.
- **Critérios de aceite:**
  - Cada código WMO listado na documentação oficial consultada na
    implementação possui uma descrição pt-BR no mapeador.
  - Código desconhecido ou não mapeado retorna descrição indisponível, sem
    inferir uma condição.
  - A função é pura e não altera o código meteorológico de origem.
- **Dependências:** T-04.
- **Arquivos prováveis:** `src/lib/weatherCodes.ts`.
- **Tipo:** Data.
- **Rastreabilidade:** FR-02, FR-03; AC-02.2, AC-03.2, AC-05.6.

### T-11 — Implementar conversão e formatação de temperatura

- **Descrição:** Criar funções puras para conversão entre Celsius e Fahrenheit
  e arredondamento somente na apresentação.
- **Critérios de aceite:**
  - As conversões usam as fórmulas padrão definidas na especificação.
  - O arredondamento ao inteiro mais próximo trata empates para longe de zero.
  - A precisão canônica em Celsius não é mutada nem perdida durante
    alternâncias repetidas.
- **Dependências:** T-04.
- **Arquivos prováveis:** `src/lib/temperature.ts`.
- **Tipo:** Data.
- **Rastreabilidade:** FR-04; AC-02.3, AC-03.3, AC-04.2.

### T-13 — Normalizar dados meteorológicos da previsão

- **Descrição:** Validar e transformar a resposta de forecast em `WeatherData`,
  incluindo dados parciais e cinco dias locais.
- **Critérios de aceite:**
  - A cidade no resultado é a opção selecionada; temperaturas permanecem em
    Celsius com precisão de origem.
  - Os arrays diários são associados por data, sem deslocar índices quando
    campos faltam, e a previsão contém cinco datas consecutivas locais.
  - Campos ausentes/inválidos tornam-se indisponíveis; resposta sem qualquer
    campo meteorológico válido é inválida, enquanto resposta parcialmente
    utilizável é sucesso.
  - Descrições são derivadas do mapeador WMO e horários/offsets são
    normalizados sem inferir valores.
- **Dependências:** T-04, T-07, T-09.
- **Arquivos prováveis:** `src/lib/normalizeWeather.ts`.
- **Tipo:** Data.
- **Rastreabilidade:** FR-02, FR-03; AC-02.1 a AC-02.6, AC-03.1 a AC-03.5,
  AC-05.6.


## Entrega 3 — Services

### T-01 — Validar uso da Open-Meteo e atribuição

- **Descrição:** Confirmar cobertura, licença, atribuição exigida, limites e
  disponibilidade da Open-Meteo para o uso previsto antes de integrar a fonte.
- **Critérios de aceite:**
  - As condições de uso aplicáveis às APIs de geocoding e previsão estão
    verificadas em fontes oficiais, com links e data de consulta registrados.
  - O texto e o local exigidos para atribuição estão identificados para a tela
    de resultados.
  - Qualquer restrição impeditiva está registrada e bloqueia a integração até
    que a decisão de fonte seja revista.
- **Dependências:** Nenhuma.
- **Arquivos prováveis:** `plans/weather-app-plan.md`,
  `src/components/CityResults.tsx`.
- **Tipo:** Infra.
- **Rastreabilidade:** Pré-condição do plano (External APIs; Risks & Trade-offs);
  NFR-08.

### T-15 — Implementar o serviço de geocoding

- **Descrição:** Encapsular a chamada HTTP à API de geocoding e entregar
  resultados normalizados ou erros tipados.
- **Critérios de aceite:**
  - A consulta externa é aparada e codificada como parâmetro `name`; a
    requisição inclui `count=10`, `language=pt` e `format=json`.
  - A ordem das opções recebidas é preservada e a resposta vazia não é
    classificada como falha.
  - Timeout de 10 segundos e falhas de rede, HTTP, API ou estrutura são
    classificados como erros recuperáveis apropriados.
- **Dependências:** T-01, T-05.
- **Arquivos prováveis:** `src/services/geocodingService.ts`.
- **Tipo:** Data.
- **Rastreabilidade:** FR-01, FR-05; AC-01.4, AC-01.6, AC-05.2 a AC-05.5.

### T-17 — Implementar o serviço de previsão

- **Descrição:** Encapsular a consulta de forecast por coordenadas, timeout,
  validação e normalização para o modelo de domínio.
- **Critérios de aceite:**
  - A URL usa latitude/longitude da cidade selecionada, variáveis `current` e
    `daily` do plano, Celsius, `timezone=auto` e `forecast_days=5`.
  - O serviço retorna `WeatherData` normalizado, sem depender de React ou
    reconstruir a cidade a partir do forecast.
  - Timeout de 10 segundos e falhas de rede, HTTP, API ou resposta inválida
    resultam em erro recuperável; não são convertidos em sucesso vazio.
- **Dependências:** T-01, T-13.
- **Arquivos prováveis:** `src/services/weatherService.ts`.
- **Tipo:** Data.
- **Rastreabilidade:** FR-02, FR-03, FR-05; AC-02.1, AC-03.1, AC-05.1,
  AC-05.5, AC-05.6.


## Entrega 4 — Hook

### T-19 — Orquestrar busca, seleção, previsão e retry

- **Descrição:** Implementar o hook que coordena consulta, seleção da cidade,
  estados independentes, unidade e novas tentativas.
- **Critérios de aceite:**
  - Busca vazia/composta por espaços não chama serviço e mantém orientação de
    validação.
  - Busca e previsão mantêm estados independentes; cada seleção inicia
    previsão pelas coordenadas escolhidas e não apresenta dados da cidade
    anterior como se fossem da nova.
  - Identificadores de requisição descartam sucessos e falhas obsoletos para
    busca e previsão.
  - Retry repete os mesmos parâmetros somente por ação do usuário; uma ação
    única não inicia operações duplicadas.
  - A unidade inicia em Celsius, não persiste e não aciona nova consulta.
- **Dependências:** T-04, T-15, T-17.
- **Arquivos prováveis:** `src/hooks/useWeatherSearch.ts`.
- **Tipo:** Data.
- **Rastreabilidade:** FR-01, FR-04, FR-05, FR-06; AC-01.5, AC-01.7,
  AC-04.4, AC-05.1 a AC-05.5, AC-06.1 a AC-06.5.


## Entrega 5 — Componentes

### T-21 — Criar a interface acessível de busca de cidades

- **Descrição:** Implementar campo, envio por botão/Enter, apresentação
  selecionável das opções e estados de busca.
- **Critérios de aceite:**
  - Campo tem nome acessível e permite envio por botão ou Enter; consulta em
    branco exibe orientação sem solicitar busca.
  - Opções preservam ordem, exibem nome e contexto geográfico disponível e
    mostram coordenadas quando o contexto textual não distingue homônimos.
  - As opções são operáveis por teclado; loading, erro e vazio têm roles e
    mensagens acessíveis distintas, verificáveis por testes de componente.
- **Dependências:** T-04, T-19.
- **Arquivos prováveis:** `src/components/CitySearch.tsx`,
  `src/components/SearchBar.tsx`.
- **Entrega parcial:** `SearchBar` implementa campo acessível, envio explícito
  com trim, orientação para consulta em branco e bloqueio por `disabled`.
  Seleção de opções e estados de rede continuam pendentes nesta tarefa.
- **Tipo:** UI.
- **Rastreabilidade:** FR-01, FR-05, FR-06; AC-01.1 a AC-01.7, AC-05.2,
  AC-06.1, AC-06.3.

### T-23 — Criar a interface de condições atuais e previsão

- **Recorte do hero:** Implementar `src/components/CurrentWeather.tsx` com
  `city`, `current` e `unit`, temperatura em destaque, ícone WMO, condição e
  métricas opcionais (umidade, vento, precipitação e pressão). Criar os
  utilitários de T-09/T-11 e ampliar o contrato de T-04 sem quebrar consumidores.
  Validar Celsius/Fahrenheit, empates negativos, códigos desconhecidos,
  métricas zero, ausentes e inválidas, além de identificação acessível da cidade.
  Atualizar o mock para demonstrar as quatro métricas. Este recorte não conclui
  T-23: previsão, estados de rede, atualidade e atribuição continuam pendentes;
  ampliar a consulta/normalização da API em T-13/T-17 permanece fora da entrega.
- **Descrição:** Apresentar cidade, condições atuais, cinco dias, campos
  indisponíveis, referência temporal e atribuição da fonte.
- **Critérios de aceite:**
  - A tela identifica a cidade selecionada e exibe temperatura/descrição
    atuais disponíveis, horário local da fonte e aviso de desatualização
    somente quando aplicável.
  - Exibe exatamente cinco datas locais em ordem, com mínimas, máximas e
    descrições disponíveis; ausências permanecem identificadas como
    indisponíveis.
  - A atribuição previamente validada da Open-Meteo é exibida nos resultados.
  - Loading, erro e sucesso têm comunicação perceptível e não deixam dados
    anteriores associados à cidade nova.
- **Dependências:** T-01, T-04, T-19.
- **Arquivos prováveis:** `src/components/CityResults.tsx`.
- **Tipo:** UI.
- **Rastreabilidade:** FR-02, FR-03, FR-05, FR-06; AC-02.1 a AC-02.6,
  AC-03.1 a AC-03.5, AC-05.1, AC-06.1, AC-06.2, AC-06.4, AC-06.5.

### T-24 — Criar o controle acessível de unidade

- **Descrição:** Implementar controle Celsius/Fahrenheit ligado ao estado de
  unidade da página.
- **Critérios de aceite:**
  - As duas unidades são apresentadas com indicação acessível da seleção
    atual e são operáveis por teclado.
  - A interação atualiza todas as temperaturas exibidas sem alterar cidade ou
    datas e sem iniciar requisições.
  - Celsius é a unidade inicial em uma nova sessão.
- **Dependências:** T-04, T-11, T-19.
- **Arquivos prováveis:** `src/components/UnitToggle.tsx`.
- **Tipo:** UI.
- **Rastreabilidade:** FR-04; AC-02.3, AC-03.3, AC-04.1 a AC-04.4.


## Entrega 6 — Integração

### T-02 — Configurar a montagem inicial da aplicação

- **Descrição:** Configurar o ponto de entrada React existente para montar
  `App`, aproveitando Vite e TypeScript.
- **Critérios de aceite:**
  - `pnpm dev` inicia o servidor Vite sem falha e uma requisição à rota `/`
    retorna HTTP 200.
  - O ponto de entrada monta `App` no elemento raiz existente, sem erro de
    execução no console durante a inicialização.
- **Dependências:** Nenhuma.
- **Arquivos prováveis:** `src/main.tsx`, `index.html`.
- **Tipo:** Infra.
- **Rastreabilidade:** Habilitadora técnica para FR-01 a FR-06; estrutura de
  execução prevista no plano.

### T-03 — Criar o shell e o tema base

- **Descrição:** Definir a composição inicial de `App` e o estilo global dark
  glassmorphism sem introduzir outra biblioteca de UI.
- **Critérios de aceite:**
  - `App` renderiza uma região principal e o CSS global aplica o tema escuro
    definido no plano.
  - As pastas `components`, `hooks`, `services`, `lib` e `types` existem, e
    `package.json` não adiciona outra biblioteca de UI.
- **Dependências:** T-02.
- **Arquivos prováveis:** `src/App.tsx`, `src/index.css`.
- **Tipo:** UI.
- **Rastreabilidade:** NFR-01; habilitadora técnica dos fluxos FR-01 a FR-06,
  conforme estrutura do plano.

### T-26 — Integrar o fluxo completo na aplicação

- **Descrição:** Conectar hook, busca, resultados e unidade pelo componente
  raiz da aplicação.
- **Critérios de aceite:**
  - O fluxo de ponta a ponta pesquisa e seleciona uma cidade, consulta pelas
    coordenadas dessa seleção e altera a unidade sem chamadas de serviço
    originadas pelos componentes de apresentação.
  - Busca e previsão expõem seus estados `loading`, `success` e `error`;
    `empty` é usado somente para busca sem correspondências.
  - A integração mantém disponíveis as ações de retry após falha e não associa
    o resultado anterior à cidade recém-selecionada.
- **Dependências:** T-03, T-19, T-21, T-23, T-24.
- **Arquivos prováveis:** `src/App.tsx`.
- **Tipo:** UI.
- **Rastreabilidade:** FR-01 a FR-06; NFR-01, NFR-05.

### T-27 — Ajustar o layout responsivo da aplicação

- **Descrição:** Adaptar o shell e o estilo global para os viewports móveis
  previstos.
- **Critérios de aceite:**
  - A aplicação não apresenta rolagem horizontal a partir de 320 px.
  - Em larguras de 320 px e 390 px, busca, resultados e controle de unidade
    permanecem visíveis dentro da viewport; o teste de aceite consegue
    interagir com cada controle sem rolagem horizontal.
- **Dependências:** T-26.
- **Arquivos prováveis:** `src/App.tsx`, `src/index.css`.
- **Tipo:** UI.
- **Rastreabilidade:** NFR-01.


## Entrega 7 — Testes

### T-06 — Testar a normalização de geocoding

- **Descrição:** Cobrir dados completos, opcionais, inválidos e lista vazia do
  normalizador de geocoding.
- **Critérios de aceite:**
  - Testes verificam mapeamento, ordem, coordenadas obrigatórias, opcionais
    ausentes/inválidos e resposta vazia.
  - Payloads incompatíveis são verificados como inválidos e não são tratados
    como lista vazia.
- **Dependências:** T-05.
- **Arquivos prováveis:** `tests/unit/normalizeGeocoding.test.ts`.
- **Tipo:** Test.
- **Rastreabilidade:** FR-01; AC-01.2, AC-01.2a, AC-01.4.

### T-08 — Testar datas locais e limite de atualidade

- **Descrição:** Verificar calendários locais, offsets e o limite de duas horas
  com relógio controlado.
- **Critérios de aceite:**
  - Os testes cobrem virada de mês/ano, independência do fuso do dispositivo,
    offsets positivo e negativo e dados de horário de verão conforme o offset
    da fonte.
  - Exatamente duas horas não classifica como desatualizado; intervalo maior
    classifica.
  - Horário e offset ausentes ou inválidos não geram afirmação de atualidade.
- **Dependências:** T-07.
- **Arquivos prováveis:** `tests/unit/date.test.ts`.
- **Tipo:** Test.
- **Rastreabilidade:** AC-02.5, AC-02.6, AC-03.1, AC-03.4; NFR-07.

### T-10 — Testar o mapeamento WMO

- **Descrição:** Testar os códigos documentados e os casos desconhecidos do
  mapeador de condições.
- **Critérios de aceite:**
  - Existe ao menos uma asserção para cada código WMO listado na documentação
    oficial usada pelo mapeador e para um código não mapeado.
  - Códigos desconhecidos não recebem descrição inventada.
- **Dependências:** T-09.
- **Arquivos prováveis:** `tests/unit/weatherCode.test.ts`.
- **Tipo:** Test.
- **Rastreabilidade:** AC-02.2, AC-03.2, AC-05.6.

### T-12 — Testar conversão e formatação de temperatura

- **Descrição:** Criar testes unitários das funções puras de conversão e
  formatação de temperatura, validando fórmulas, arredondamento, precisão
  canônica e ausência de deriva ao alternar unidades.
- **Critérios de aceite:**
  - Testes Vitest exercitam as funções de conversão sem interface ou rede.
  - Os testes incluem `0 °C → 32 °F`, `100 °C → 212 °F` e `−40 °C → −40 °F`.
  - Empates positivos e negativos arredondam para longe de zero.
  - Alternar unidades repetidamente sempre parte do valor original, sem
    acumular arredondamento.
- **Dependências:** T-11.
- **Arquivos prováveis:** `tests/unit/temperature.test.ts`.
- **Tipo:** Test.
- **Rastreabilidade:** FR-04; AC-04.2, AC-04.3, AC-04.4.

### T-14 — Testar a normalização meteorológica

- **Descrição:** Cobrir respostas completas, parciais, inválidas e
  desalinhadas do normalizador de forecast.
- **Critérios de aceite:**
  - Testes verificam campos ausentes, `null`, não numéricos e não finitos,
    respostas parciais e resposta totalmente inutilizável.
  - Cinco datas permanecem na ordem correta inclusive em viradas de mês/ano e
    com dados diários ausentes.
  - São testados códigos WMO conhecidos/desconhecidos e a cidade selecionada
    mantida no resultado.
- **Dependências:** T-13.
- **Arquivos prováveis:** `tests/unit/normalizeWeather.test.ts`.
- **Tipo:** Test.
- **Rastreabilidade:** AC-02.4, AC-03.1 a AC-03.5, AC-05.6.

### T-16 — Testar o serviço de geocoding

- **Descrição:** Testar parâmetros, codificação, normalização, estados vazios e
  classificação de falhas usando `fetch` mockado, sem tráfego de rede real.
- **Critérios de aceite:**
  - Testes verificam acentos, espaços internos, pontuação, parâmetros e ordem
    dos resultados por meio de chamadas interceptadas ao `fetch`.
  - Sucesso, lista vazia, erro HTTP/API/rede, JSON inválido e timeout são
    cobertos.
  - Timers são controlados e limpos ao final de cada teste.
- **Dependências:** T-15.
- **Arquivos prováveis:** `tests/unit/geocodingService.test.ts`.
- **Tipo:** Test.
- **Rastreabilidade:** AC-01.4, AC-01.6, AC-05.2, AC-05.5.

### T-18 — Testar o serviço de previsão

- **Descrição:** Verificar contrato HTTP, coordenadas, parâmetros, normalização
  e erros do serviço de forecast com `fetch` mockado, sem tráfego de rede real.
- **Critérios de aceite:**
  - Testes confirmam, por meio do `fetch` mockado, as coordenadas selecionadas
    e todos os parâmetros exigidos, sem usar a API real.
  - Sucesso completo/parcial, falhas HTTP/API/rede, JSON inválido, resposta
    incompatível e timeout são cobertos.
  - Timers são liberados após sucesso e falha.
- **Dependências:** T-17.
- **Arquivos prováveis:** `tests/unit/weatherService.test.ts`.
- **Tipo:** Test.
- **Rastreabilidade:** AC-02.1, AC-03.1, AC-05.1, AC-05.5, AC-05.6.

### T-20 — Testar o hook de orquestração

- **Descrição:** Verificar transições, retry, validação, unidade, bloqueio de
  duplicidade e concorrência com serviços mockados.
- **Critérios de aceite:**
  - Testes cobrem consulta vazia sem chamada, busca vazia, loading, sucesso e
    erro para ambas as operações.
  - Retry reutiliza os mesmos argumentos; falhas e sucessos de operações
    obsoletas não alteram o estado mais recente.
  - Selecionar outra cidade limpa a associação visual ao resultado anterior;
    alternar unidade não chama serviços.
- **Dependências:** T-19.
- **Arquivos prováveis:** `tests/unit/useWeatherSearch.test.ts`.
- **Tipo:** Test.
- **Rastreabilidade:** AC-01.5, AC-01.7, AC-04.3, AC-05.3, AC-06.1 a AC-06.5.

### T-22 — Testar a interface de busca

- **Descrição:** Testar o componente de busca com Testing Library, cobrindo
  interação e estados loading, erro e vazio por comportamento acessível.
- **Critérios de aceite:**
  - Testes com Testing Library verificam envio por botão/Enter, seleção por
    teclado, validação vazia e preservação da ordem/contexto das opções.
  - Loading, erro de busca e vazio por ausência de correspondências são
    consultáveis por roles/labels, encerram o loading ao concluir e não são
    confundidos entre si.
  - A falha apresenta a ação de retry; o resultado vazio mantém disponível uma
    nova pesquisa.
- **Dependências:** T-21.
- **Arquivos prováveis:** `tests/components/CitySearch.test.tsx`,
  `tests/unit/SearchBar.test.tsx`.
- **Cobertura parcial:** testes da barra verificam label/região de busca,
  envio por botão/Enter, trim sem remover acentos ou pontuação, consulta em
  branco, correção, desabilitação e IDs únicos por instância.
- **Tipo:** Test.
- **Rastreabilidade:** AC-01.1 a AC-01.7, AC-05.2, AC-06.1, AC-06.3.

### T-25 — Testar resultados e controle de unidade

- **Descrição:** Testar os componentes de resultados e unidade com Testing
  Library, incluindo loading e erro da previsão, além de resultados
  completos/parciais, atualidade, indisponibilidades, atribuição e alternância.
- **Critérios de aceite:**
  - Testes verificam cidade, condições, cinco datas, campos indisponíveis e
    atribuição da fonte usando consultas acessíveis.
  - Loading da previsão é perceptível e a falha apresenta mensagem pt-BR,
    encerra o loading e oferece retry.
  - Não se espera estado vazio meteorológico: resposta sem dados utilizáveis é
    erro `invalid-response`; dados parcialmente utilizáveis são sucesso com
    campos indisponíveis.
  - O estado de atualidade respeita dados válidos/indisponíveis sem inventar
    status.
  - Celsius/Fahrenheit atualiza todas as temperaturas sem chamada de serviço
    e preserva cidade e datas.
- **Dependências:** T-23, T-24.
- **Arquivos prováveis:** `tests/components/CityResults.test.tsx`,
  `tests/components/UnitToggle.test.tsx`.
- **Tipo:** Test.
- **Rastreabilidade:** AC-02.1 a AC-02.6, AC-03.1 a AC-03.5, AC-04.1 a
  AC-04.4.

### T-42 — Validar testes unitários e de componentes

- **Descrição:** Executar os testes automatizados unitários e de componentes
  antes da entrega.
- **Critérios de aceite:**
  - `pnpm test` conclui sem falhas e o resultado é registrado.
  - Testes unitários e de componentes não dependem da disponibilidade real da
    Open-Meteo.
  - Falhas são corrigidas em tarefas focadas e os testes afetados são
    executados novamente.
- **Dependências:** T-06, T-08, T-10, T-12, T-14,
  T-16, T-18, T-20, T-22, T-25.
- **Arquivos prováveis:** `package.json`.
- **Tipo:** Test.
- **Rastreabilidade:** FR-01 a FR-06; NFR-05.

### T-28 — Cobrir jornada principal e busca vazia em E2E

- **Descrição:** Automatizar no Playwright a jornada principal e a validação de
  busca em viewport desktop, usando fixtures determinísticas interceptadas.
- **Critérios de aceite:**
  - Em Chromium, o teste pesquisa, seleciona cidade, visualiza condições e
    cinco dias e alterna °C/°F.
  - As asserções confirmam coordenadas enviadas e nenhuma requisição extra
    causada pela alternância de unidade.
  - Busca vazia não gera request; ausência de correspondências apresenta
    estado vazio e permite nova busca.
- **Dependências:** T-16, T-18, T-26, T-27, T-42.
- **Arquivos prováveis:** `tests/e2e/weather-search.spec.ts`.
- **Tipo:** Test.
- **Rastreabilidade:** AC-01.1 a AC-01.6, AC-02.1 a AC-02.4, AC-03.1 a
  AC-03.5, AC-04.1 a AC-04.4, AC-06.2, AC-06.3.

### T-29 — Cobrir falhas, dados parciais e concorrência em E2E

- **Descrição:** Automatizar recuperação de falhas e garantir que resultados
  atrasados não substituam operações mais recentes.
- **Critérios de aceite:**
  - Falhas de geocoding e previsão exibem erro e retry explícito, que reutiliza
    parâmetros e pode recuperar a jornada.
  - Respostas antigas de busca e de cidade não alteram os resultados mais
    recentes, inclusive quando a resposta obsoleta falha.
  - Respostas parciais mantêm datas/campos indisponíveis sem deslocar ou
    inventar dados.
- **Dependências:** T-28.
- **Arquivos prováveis:** `tests/e2e/weather-recovery.spec.ts`.
- **Tipo:** Test.
- **Rastreabilidade:** AC-01.7, AC-02.4, AC-03.5, AC-05.1 a AC-05.6,
  AC-06.4, AC-06.5.

### T-30 — Validar a operação principal por teclado em E2E

- **Descrição:** Automatizar a operação principal por teclado e conferir foco
  e nomes acessíveis dos controles.
- **Critérios de aceite:**
  - O fluxo principal é completável somente por teclado; os testes verificam
    foco visível e nomes acessíveis dos controles interativos.
- **Dependências:** T-26, T-28.
- **Arquivos prováveis:** `tests/e2e/weather-keyboard.spec.ts`.
- **Tipo:** Test.
- **Rastreabilidade:** NFR-05, NFR-05.1; AC-01.1, AC-04.1, AC-06.1 a
  AC-06.3.

### T-31 — Validar a jornada em viewport mobile

- **Descrição:** Reexecutar em E2E a jornada principal de busca, seleção,
  previsão e alternância de unidade em viewports móveis, verificando também os
  estados loading, erro e vazio.
- **Critérios de aceite:**
  - Com fixtures interceptadas, a jornada principal completa e os cenários de
    loading, erro e vazio são executados em 320 px e em viewport representativo
    de 390 × 844.
  - Não há rolagem horizontal nos estados de loading, erro, vazio e sucesso.
  - Os cinco dias e controles permanecem disponíveis e utilizáveis no mobile.
- **Dependências:** T-27, T-28.
- **Arquivos prováveis:** `tests/e2e/weather-mobile.spec.ts`.
- **Tipo:** Test.
- **Rastreabilidade:** NFR-01; AC-01.1, AC-04.1, AC-06.1 a AC-06.3.

### T-43 — Validar testes E2E

- **Descrição:** Executar a suíte Playwright antes da entrega.
- **Critérios de aceite:**
  - `pnpm test:e2e` conclui sem falhas e o resultado é registrado.
  - Os cenários E2E usam fixtures/interceptações e não dependem da
    disponibilidade real da Open-Meteo.
  - Falhas são corrigidas em tarefas focadas e os testes afetados são
    executados novamente.
- **Dependências:** T-28, T-29, T-30, T-31.
- **Arquivos prováveis:** `package.json`.
- **Tipo:** Test.
- **Rastreabilidade:** NFR-01, NFR-05.

### T-41 — Validar lint e build

- **Descrição:** Executar as verificações estáticas e o build de produção antes
  da entrega.
- **Critérios de aceite:**
  - `pnpm lint` e `pnpm build` concluem sem falhas.
  - Os resultados são registrados; falhas são corrigidas em tarefas focadas e
    os comandos afetados são executados novamente.
- **Dependências:** T-27, T-42, T-43.
- **Arquivos prováveis:** `package.json`.
- **Tipo:** Test.
- **Rastreabilidade:** Habilitadora técnica para validar a implementação de
  FR-01 a FR-06; checklist de entrega do plano.


## Entrega 8 — Hardening

### T-32 — Auditar acessibilidade de busca e teclado (WCAG 2.2 AA)

- **Descrição:** Auditar a busca, seus estados e a interação por teclado com
  verificação automatizada e revisão manual.
- **Critérios de aceite:**
  - A auditoria automatizada e a revisão manual por teclado cobrem busca
    vazia, erro e opções; cada verificação registra método e resultado.
  - O relatório lista cada violação encontrada pelo critério WCAG 2.2 AA,
    localização e evidência; após correção e repetição da auditoria, não há
    violação aberta nessa superfície.
- **Dependências:** T-22, T-30, T-41.
- **Arquivos prováveis:** `src/components/CitySearch.tsx`,
  `tests/e2e/weather-keyboard.spec.ts`.
- **Tipo:** Test.
- **Rastreabilidade:** NFR-05, NFR-05.1.

### T-33 — Auditar acessibilidade dos resultados e unidade (WCAG 2.2 AA)

- **Descrição:** Auditar resultados e controle de unidade por inspeção manual
  com teclado e leitor de tela.
- **Critérios de aceite:**
  - A revisão manual por teclado e leitor de tela cobre resultados, campos
    indisponíveis e controle de unidade; cada verificação registra método e
    resultado.
  - O relatório lista cada violação encontrada pelo critério WCAG 2.2 AA,
    localização e evidência; após correção e nova revisão, não há violação
    aberta nessa superfície.
- **Dependências:** T-25, T-26, T-41.
- **Arquivos prováveis:** `src/components/CityResults.tsx`,
  `src/components/UnitToggle.tsx`.
- **Tipo:** Test.
- **Rastreabilidade:** NFR-05, NFR-05.1.

### T-34 — Validar compatibilidade entre navegadores

- **Descrição:** Executar aceite separado nas duas versões estáveis mais
  recentes de Chrome, Edge, Firefox e Safari, incluindo Safari em macOS e iOS.
- **Critérios de aceite:**
  - Uma matriz registra a execução dos fluxos principais e estados em cada
    navegador, versão estável e plataforma exigidos pela NFR-06.
  - Cada evidência registra navegador, versão, sistema operacional, viewport
    e resultado aprovado/reprovado.
  - Emulação mobile ou WebKit isoladamente não é usada como substituto para
    Safari/iOS.
- **Dependências:** T-28, T-30, T-31, T-41.
- **Arquivos prováveis:** `playwright.config.ts`,
  `tests/e2e/weather-search.spec.ts`.
- **Tipo:** Test.
- **Rastreabilidade:** NFR-06.

### T-35 — Verificar geocoding real com a Open-Meteo

- **Descrição:** Verificar separadamente disponibilidade e contrato atual da
  API de geocoding, sem tornar a suíte principal dependente da rede externa.
- **Critérios de aceite:**
  - A API de geocoding é exercitada em uma verificação fora da suíte baseada em
    fixtures.
  - Endpoint, parâmetros e resposta observada são comparados ao contrato
    normalizado; falhas não são transformadas em resultado vazio.
  - Método, data e resultado da verificação são registrados.
- **Dependências:** T-15, T-26, T-28, T-41.
- **Arquivos prováveis:** `src/services/geocodingService.ts`,
  `plans/weather-app-plan.md`.
- **Tipo:** Test.
- **Rastreabilidade:** FR-01; AC-01.4, AC-01.6; pré-condição de validação da
  fonte em Open Questions da spec.

### T-36 — Verificar previsão real com a Open-Meteo

- **Descrição:** Verificar separadamente disponibilidade e contrato atual da
  API de previsão, sem tornar a suíte principal dependente da rede externa.
- **Critérios de aceite:**
  - A API de previsão é exercitada em uma verificação fora da suíte baseada em
    fixtures.
  - Endpoint, parâmetros e resposta observada são comparados ao contrato
    normalizado; falhas não são transformadas em sucesso vazio.
  - Método, data e resultado da verificação são registrados.
- **Dependências:** T-17, T-26, T-28, T-41.
- **Arquivos prováveis:** `src/services/weatherService.ts`,
  `plans/weather-app-plan.md`.
- **Tipo:** Test.
- **Rastreabilidade:** FR-02, FR-03; AC-02.1, AC-03.1; pré-condição de
  validação da fonte em Open Questions da spec.

### T-37 — Documentar o tratamento de dados e privacidade

- **Descrição:** Registrar dados enviados à fonte, finalidades e condições de
  retenção da hospedagem antes da publicação.
- **Critérios de aceite:**
  - A documentação identifica dados enviados por HTTPS à Open-Meteo e sua
    finalidade, sem analytics nem armazenamento de buscas pela aplicação.
  - Provedor/região de hospedagem, logs técnicos mínimos, prazo de retenção e
    responsável por incidentes estão documentados antes da publicação;
    qualquer item pendente bloqueia a publicação.
  - A solução não introduz GPS, contas, histórico, persistência de consultas
    ou persistência de preferências.
- **Dependências:** T-26, T-41.
- **Arquivos prováveis:** `README.md`, `plans/weather-app-plan.md`.
- **Tipo:** Infra.
- **Rastreabilidade:** NFR-08.

### T-38 — Medir usabilidade com participantes

- **Descrição:** Reunir evidências de usabilidade por meio de teste moderado
  antes da publicação.
- **Critérios de aceite:**
  - É realizado teste moderado com pelo menos cinco participantes cuja
    representatividade foi validada e registrada antes da sessão.
  - Os resultados registram, por participante, conclusão sem ajuda das três
    tarefas da NFR-02; a meta é atingida somente se pelo menos quatro
    participantes completarem todas as tarefas.
  - Nenhuma meta é declarada cumprida sem a evidência correspondente.
- **Dependências:** T-28, T-41.
- **Arquivos prováveis:** `README.md`.
- **Tipo:** Infra.
- **Rastreabilidade:** NFR-02.

### T-39 — Medir desempenho de busca e previsão

- **Descrição:** Medir separadamente p95 de busca e previsão antes da
  publicação, distinguindo aplicação e fonte.
- **Critérios de aceite:**
  - Em janela mensal, p95 de buscas e previsões concluídas com sucesso é medido
    do envio à exibição do resultado, com ambiente, rede, população e volume de
    amostras documentados.
  - Busca e previsão reportam p95 de ponta a ponta e discriminam os tempos da
    aplicação e da fonte; cada p95 de ponta a ponta é comparado com a meta de
    até 3 segundos da NFR-03.
  - Nenhuma meta é declarada cumprida sem a evidência correspondente.
- **Dependências:** T-28, T-35, T-36, T-41.
- **Arquivos prováveis:** `plans/weather-app-plan.md`, `README.md`.
- **Tipo:** Test.
- **Rastreabilidade:** NFR-03.

### T-40 — Medir disponibilidade da aplicação e da fonte

- **Descrição:** Reunir evidências de disponibilidade mensal separadas para
  aplicação e fonte de dados.
- **Critérios de aceite:**
  - A disponibilidade é calculada em percentual mensal sobre o total de
    minutos do mês, separadamente para carregamento da aplicação e resposta
    utilizável da fonte; método, janela e exclusões são registrados.
  - Cada percentual é comparado com a meta de 99,5% da NFR-04.
  - Nenhuma meta é declarada cumprida sem a evidência correspondente.
- **Dependências:** T-26, T-35, T-36, T-41.
- **Arquivos prováveis:** `plans/weather-app-plan.md`, `README.md`.
- **Tipo:** Infra.
- **Rastreabilidade:** NFR-04.
