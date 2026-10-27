# Plano Técnico — Weather App

Este plano deriva da [especificação de produto](../specs/weather-app-spec.md).
Os requisitos FR-01 a FR-06 e os critérios AC-01 a AC-06 são a referência para
as decisões abaixo. Os tipos são contratos conceituais para orientar a
implementação; não são código final.

## Architecture

Aplicação cliente sem backend próprio, organizada em camadas com dependências
direcionadas da apresentação aos dados. Componentes React apresentam a
interface e encaminham ações; hooks orquestram o estado e o fluxo assíncrono;
serviços isolam chamadas HTTP à Open-Meteo; funções puras em `lib/` normalizam
respostas e calculam valores de apresentação.

```text
components (apresentação)
       │ ações / dados para renderização
       ▼
hooks (orquestração e estado)
       │ operações de dados
       ▼
services (HTTP e erros de transporte)
       │ payloads externos
       ▼
lib (normalização e funções puras)

types define contratos compartilhados entre as camadas.
```

- Manter dependências unidirecionais: componentes não chamam serviços nem
  conhecem o formato da API; hooks não constroem payloads externos; serviços
  não dependem de React.
- Separar a resposta externa do modelo de domínio: serviços cuidam do
  transporte HTTP e `lib/` valida/normaliza os payloads antes de expô-los ao
  restante da aplicação.
- Manter lógica de apresentação sem efeitos colaterais em funções puras sempre
  que ela puder ser expressa como transformação de entradas em saídas.
- Manter uma única aplicação web responsiva, sem API própria, banco de dados,
  autenticação, analytics ou armazenamento de consultas/preferências.
- Usar coordenadas da localidade selecionada para carregar o clima; não
  resolver a cidade novamente pelo texto do nome.
- Exibir a atribuição Open-Meteo exigida na tela de resultados, após confirmar
  suas condições de uso antes da implementação.

## Tech Stack

| Área | Decisão | Motivo |
|---|---|---|
| Linguagem | TypeScript strict | Contratos explícitos para respostas externas e estados da UI. |
| Interface | React 19 + Vite | Stack já configurada no repositório e adequada a uma SPA simples. |
| Estilo | Tailwind CSS | Stack do projeto; permite interface responsiva e tema dark glassmorphism sem introduzir outra camada de UI. |
| Dados | `fetch` nativo, encapsulado em `src/services/` | Evita dependência de cliente HTTP para duas operações simples. |
| Testes | Vitest + Testing Library; Playwright para E2E | Ferramentas já previstas/configuradas no projeto. |
| Qualidade | Biome | Lint e formatação definidos pelo projeto. |

Não introduzir cache, gerenciamento de estado externo, persistência ou
dependências adicionais sem necessidade demonstrada.

## Project Structure

Estrutura proposta para a implementação, ainda não existente no repositório:

```text
src/
  App.tsx
  main.tsx
  components/
    CitySearch.tsx        # Busca e seleção acessível de localidades
    CityResults.tsx       # Condições atuais, cinco dias e atribuição
    UnitToggle.tsx        # Controle Celsius/Fahrenheit
  hooks/
    useWeatherSearch.ts   # Orquestra busca, seleção, previsão e estado
  services/
    geocodingService.ts   # Requisição HTTP de geocoding e erros de transporte
    weatherService.ts     # Requisição HTTP de previsão e erros de transporte
  lib/
    normalizeGeocoding.ts # Validação e normalização do payload de geocoding
    normalizeWeather.ts   # Validação e normalização do payload de previsão
    temperature.ts        # Conversão, arredondamento e apresentação
    weatherCode.ts        # Mapeamento de códigos para pt-BR
    date.ts               # Datas locais da cidade e formatação pt-BR
  types/
    weather.ts            # Contratos compartilhados de domínio e estados
tests/
  unit/                   # Funções puras, normalizadores e serviços
  components/             # Interação e renderização com Testing Library
  e2e/                    # Fluxos principais com respostas de API controladas
```

### Responsabilidades por camada

- **`components/` — apresentação:** renderizam busca, opções, resultados e
  controle de unidade; encaminham eventos para o hook e exibem os estados
  recebidos. Não fazem `fetch`, não montam URLs e não interpretam payloads
  externos. Devem manter semântica, acessibilidade e estados visuais de
  carregamento, vazio, sucesso e erro.
- **`hooks/` — orquestração e estado:** coordenam consulta, busca, seleção de
  cidade, previsão, unidade e retry. Chamam os serviços, controlam operações
  assíncronas e impedem que respostas obsoletas substituam resultados mais
  recentes. Mantêm o estado local da página, sem introduzir estado global.
- **`services/` — acesso a dados:** encapsulam `fetch`, construção de URL e
  parâmetros, timeout e classificação de falhas de transporte. Encaminham os
  payloads para os normalizadores de `lib/` e retornam dados de domínio ou
  erros tipados; não contêm lógica de interface nem dependem de React.
- **`lib/` — funções puras:** contém transformações determinísticas sem efeitos
  colaterais, como validação/normalização de payloads, conversões de
  temperatura, mapeamento WMO e operações de datas locais. As funções recebem
  dados explícitos e retornam resultados, sem acessar rede, estado React ou
  ambiente global mutável.
- **`types/` — contratos:** reúne os tipos compartilhados de domínio, unidade,
  estados assíncronos e erros. Os payloads externos podem ter tipos internos
  aos normalizadores; a UI consome os contratos normalizados.

Essa divisão mantém cada camada substituível e limita o impacto de mudanças:
alterações de API ficam nos serviços/normalizadores, mudanças de fluxo no hook
e ajustes visuais nos componentes. Manter componentes pequenos; adicionar
arquivos apenas quando houver responsabilidade clara, reutilização ou valor de
teste independente.

## Data Model

Contratos de domínio normalizados, separados dos payloads da Open-Meteo e com
nomes em camelCase. `null` representa campo ausente ou inválido na resposta;
esses valores são mostrados como indisponíveis e nunca formatados como
temperaturas ou condições válidas.

```ts
export type Unit = "celsius" | "fahrenheit"; // Unidade de exibição.

export interface City {
  id: number | null; // Identificador retornado pelo geocoding.
  name: string; // Nome da localidade.
  country: string | null; // Nome do país (country).
  region: string | null; // Estado ou região (admin1).
  latitude: number; // Latitude em graus decimais.
  longitude: number; // Longitude em graus decimais.
}

export interface CurrentWeather {
  temperatureCelsius: number | null; // Temperatura a 2 m (temperature_2m), em °C.
  weatherCode: number | null; // Código meteorológico WMO (weather_code).
  descriptionPtBr: string | null; // Descrição derivada do código WMO em pt-BR.
  sourceLocalTime: string | null; // Horário local de referência (current.time).
}

export interface ForecastDay {
  localDate: string; // Data YYYY-MM-DD no calendário da cidade (daily.time).
  minimumCelsius: number | null; // Mínima diária (temperature_2m_min), em °C.
  maximumCelsius: number | null; // Máxima diária (temperature_2m_max), em °C.
  weatherCode: number | null; // Código WMO diário (daily.weather_code).
  descriptionPtBr: string | null; // Descrição derivada do código WMO em pt-BR.
}

export interface WeatherData {
  city: City; // Localidade selecionada no geocoding.
  current: CurrentWeather; // Condições atuais normalizadas.
  forecast: ForecastDay[]; // Hoje e os quatro dias seguintes, em ordem.
  timeZone: string | null; // Fuso IANA retornado pela previsão (timezone).
  utcOffsetSeconds: number | null; // Deslocamento informado (utc_offset_seconds).
}
```

- O serviço deve garantir cinco datas consecutivas em `forecast`; o tipo
  `ForecastDay[]` não impõe esse tamanho. Mesmo quando a fonte omitir uma data,
  a posição mantém `localDate` e os demais campos como `null`.
- `descriptionPtBr` é derivada pela aplicação de uma tabela explícita dos
  códigos meteorológicos WMO suportados; não vem da API de previsão. Códigos
  desconhecidos resultam em descrição `null`, sem inventar condições.
- Temperaturas são armazenadas em Celsius, com a precisão de origem. `Unit`
  pertence ao estado da interface: alterná-la converte somente a exibição,
  sem nova requisição. Arredondar ao inteiro mais próximo com empates para
  longe de zero apenas na apresentação.
- `sourceLocalTime` é o horário de referência das condições atuais, não o
  instante de atualização da previsão. Não interpretar esse valor no fuso do
  dispositivo; usar o contexto de fuso retornado pela fonte.
- Não incluir `updatedAt` ou `forecastUpdatedAt` enquanto não houver um campo
  confiável documentado pela fonte para a atualização da previsão.

Estados assíncronos devem distinguir `idle`, `loading`, `success`, `empty` e
`error`. `empty` aplica-se a geocoding sem correspondências; não é estado de
erro meteorológico.

```ts
type RetryRequest =
  | { operation: "search"; query: string }
  | { operation: "weather"; city: City };

interface WeatherAppError {
  kind: "network" | "api" | "http" | "timeout" | "invalid-response";
  retryRequest: RetryRequest;
  messagePtBr: string;
}
```

## Data Flow

1. A pessoa informa uma cidade e envia pelo botão ou Enter. Remover apenas
   espaços externos; string vazia não gera requisição e produz orientação para
   preencher o campo.
2. `geocodingService` codifica a consulta como parâmetro de URL, consulta a
   Open-Meteo e preserva a ordem da resposta. O componente apresenta nome,
   país e região disponíveis; se isso não distinguir homônimos, inclui as
   coordenadas.
3. Selecionar uma opção atualiza imediatamente a cidade ativa e inicia a
   consulta meteorológica com suas coordenadas. Durante o carregamento, não
   apresentar dados da cidade anterior como se fossem da nova seleção.
4. `weatherService` valida a resposta e a normaliza para `WeatherData`.
   Usar a data local de `current.time` como início do calendário e gerar as
   cinco datas com aritmética de data-only; associar os dados diários pela
   string `YYYY-MM-DD`. Uma data diária ausente continua na lista como
   indisponível e a data do dispositivo não interfere.
5. A unidade vive na sessão da página, inicia em Celsius e somente transforma
   valores para apresentação; não provoca nova consulta nem altera cidade ou
   datas.
6. Busca ou seleção mais recente prevalece: associe cada operação a um
   identificador incremental e descarte respostas cujo identificador não seja
   mais o ativo. Cancelamento de requisição pode reduzir trabalho, mas a
   proteção contra resposta obsoleta é obrigatória independentemente dele.
7. Uma nova tentativa reutiliza exatamente os parâmetros da operação que
   falhou. Um acionamento não inicia operações duplicadas.

## External APIs

**Open-Meteo**, por HTTPS e sem chave fornecida pelo usuário, sujeito à
validação prévia de cobertura, licença, atribuição, limites e disponibilidade.

### Geocoding

- **URL:** `https://geocoding-api.open-meteo.com/v1/search`
- **Parâmetros:** `name` obrigatório, com a consulta aparada e codificada como
  parâmetro URL; `count=10` limita a até dez opções; `language=pt` solicita
  nomes traduzidos quando disponíveis; `format=json` explicita o formato JSON
  (também é o padrão).
- **Exemplo de chamada:**
  `https://geocoding-api.open-meteo.com/v1/search?name=Lisboa&count=10&language=pt&format=json`
- **Resposta resumida:**

  ```json
  {
    "results": [
      {
        "id": 2267057,
        "name": "Lisboa",
        "latitude": 38.72509,
        "longitude": -9.1498,
        "country": "Portugal",
        "admin1": "Distrito de Lisboa"
      }
    ]
  }
  ```

- **Mapeamento:** cada item de `results`, mantendo a ordem recebida, origina
  uma opção `City`: `id` → `id`, `name` → `name`, `country` → `country`,
  `admin1` → `region`, `latitude` → `latitude` e `longitude` → `longitude`.
  Campo opcional ausente ou inválido vira `null` quando o tipo permite; nome ou
  coordenadas sem valor válido tornam a resposta estruturalmente inválida.
  Lista `results` vazia é resultado vazio, não erro.

### Forecast

- **URL:** `https://api.open-meteo.com/v1/forecast`
- **Parâmetros:** `latitude` e `longitude` da `City` selecionada; `current` e
  `daily` selecionam explicitamente as variáveis abaixo; `temperature_unit=celsius`
  fixa a unidade recebida; `timezone=auto` determina o fuso local pelas
  coordenadas; `forecast_days=5` solicita hoje e os quatro dias seguintes.
- **Exemplo de chamada:**
  `https://api.open-meteo.com/v1/forecast?latitude=38.72509&longitude=-9.1498&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&temperature_unit=celsius&timezone=auto&forecast_days=5`
- **Resposta resumida** (os arrays diários correspondem por índice):

  ```json
  {
    "utc_offset_seconds": 0,
    "timezone": "Europe/Lisbon",
    "current": {
      "time": "2026-10-27T17:15",
      "temperature_2m": 20.8,
      "weather_code": 2
    },
    "daily": {
      "time": ["2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30", "2026-10-31"],
      "weather_code": [3, 1, 0, 0, 0],
      "temperature_2m_max": [23.5, 24.6, 25.7, 26.9, 26.4],
      "temperature_2m_min": [12.0, 12.8, 11.9, 13.7, 14.2]
    }
  }
  ```

- **Mapeamento para `WeatherData`:** a `City` associada é a opção escolhida,
  não uma cidade reconstruída a partir da resposta de forecast. `current.time`
  → `current.sourceLocalTime`; `current.temperature_2m` →
  `current.temperatureCelsius`; `current.weather_code` →
  `current.weatherCode`; `timezone` → `timeZone`; `utc_offset_seconds` →
  `utcOffsetSeconds`. Para cada índice `i` de `daily.time`, criar um
  `ForecastDay`: `time[i]` → `localDate`, `temperature_2m_min[i]` →
  `minimumCelsius`, `temperature_2m_max[i]` → `maximumCelsius` e
  `weather_code[i]` → `weatherCode`. Os valores numéricos devem ser validados;
  campo ausente ou inválido vira `null`, sem deslocar os demais índices.
  `descriptionPtBr` em `CurrentWeather` e `ForecastDay` é derivada do código
  WMO pela tabela da aplicação; não é um campo deste payload.

Referências oficiais: [Forecast API](https://open-meteo.com/en/docs) e
[Geocoding API](https://open-meteo.com/en/docs/geocoding-api).

- Solicitações devem codificar corretamente acentos, espaços internos e
  pontuação. Preservar a ordem dos resultados de geocoding.
- O forecast é solicitado em Celsius; conversões para Fahrenheit e retorno a
  Celsius são locais, evitando chamadas extras e perda de precisão por
  conversão repetida.
- Usar o timezone retornado e `current.time` como referência para o primeiro
  dia local; associar previsões por `YYYY-MM-DD` e não pelo calendário/fuso do
  dispositivo. Não inferir valores ou horários que a resposta não forneça.
- Cada requisição expira em 10 segundos. Timeout, erro HTTP/rede ou resposta
  estruturalmente inválida são falhas recuperáveis; lista válida vazia do
  geocoding é resultado vazio.
- Exibir a atribuição requerida pela Open-Meteo nos resultados. Não implementar
  antes de confirmar texto/localização exigidos pela licença aplicável.

## State Management

Manter o estado efêmero no hook `useWeatherSearch`, consumido pela página e
pelos componentes de apresentação. Não há necessidade de Redux, Context
global ou armazenamento persistente. O campo de busca, a cidade selecionada,
os estados independentes de busca e previsão e a unidade escolhida vivem
juntos nesse estado local. A unidade inicia em Celsius e não é persistida.

```ts
type OperationState<T> =
  | { status: "idle" }
  | { status: "loading"; requestId: number }
  | { status: "success"; data: T }
  | { status: "empty" }
  | { status: "error"; error: WeatherAppError };

interface WeatherPageState {
  query: string;
  search: OperationState<City[]>;
  selectedCity: City | null;
  weather: OperationState<WeatherData>;
  unit: Unit; // inicia em celsius; nunca persistida
}
```

As transições são explícitas: cada operação começa em `idle`, passa a `loading`
quando enviada e termina em `success` ou `error`; busca bem-sucedida sem
correspondências termina em `empty`. `empty` é um resultado válido somente
para geocoding, nunca uma falha ou um estado meteorológico sem dados.
Operações de busca e previsão têm estados independentes. Ao mudar cidade,
associar imediatamente a previsão ao novo alvo e não renderizar os dados da
cidade anterior sob o nome novo. Uma resposta assíncrona só pode atualizar o
estado se seu `requestId` ainda for o atual para aquela operação.

Armazenar todas as temperaturas normalizadas em Celsius, sem substituir ou
mutar esses valores quando a unidade mudar. A renderização deriva o valor
exibido a partir da temperatura canônica e de `unit`: em Fahrenheit, aplicar
`°F = °C × 9/5 + 32`; em Celsius, usar o valor de origem. Arredondar para o
inteiro mais próximo, com empates para longe de zero, apenas no formatador de
apresentação. A alternância atualiza somente `unit` e a tela; não chama
serviços, não faz novo request e não converte repetidamente valores já
arredondados.

## Error Handling

- Validar antes de enviar: consulta vazia/composta por espaços gera mensagem
  acessível e nenhuma chamada.
- Normalizar falhas em erros tipados recuperáveis: `network` para falha de
  transporte/conexão; `timeout` quando o limite de 10 segundos expirar; `http`
  para resposta não-2xx sem erro de domínio interpretável; `api` para erro
  declarado pela Open-Meteo no payload; e `invalid-response` para JSON mal
  formado ou incompatível com o contrato esperado. A mensagem pt-BR deve
  informar que os dados não puderam ser obtidos, sem expor detalhes técnicos.
- Timeout de 10 segundos encerra o carregamento e oferece nova tentativa.
  Retry ocorre somente por ação do usuário, repete os mesmos parâmetros e
  mantém a ação disponível se falhar novamente. Uma falha deve sempre encerrar
  `loading` em `error`; nunca converter timeout ou falha da API em resultado
  vazio.
- Erros de busca não correspondem a resultados vazios. Geocoding válido sem
  correspondências apresenta estado vazio e permite outra busca.
- Campos ausentes, nulos, não numéricos ou não finitos são normalizados como
  indisponíveis. Se a resposta meteorológica não puder ser interpretada ou não
  houver nenhum campo meteorológico utilizável entre condições atuais e dias
  previstos, tratar como `invalid-response` recuperável. Uma resposta
  parcialmente utilizável, com ao menos um campo meteorológico válido, é
  `success`: apresentar os campos válidos e indicar cada campo/dia ausente,
  sem completar dados, datas ou descrições por inferência.
- Estados de carregamento, vazio, sucesso e erro devem ter comunicação
  perceptível e acessível (incluindo leitores de tela); falha não deixa
  carregamento ativo.
- Condições atuais exibem o horário de referência da fonte no fuso local e
  recebem indicação de desatualizadas se tiverem mais de duas horas. Se o
  horário for ausente/inválido, não afirmar atualização nem desatualização.
  Para previsão, só exibir atualização se houver campo confiável documentado.

## Testing Strategy

- **`lib/` (Vitest):** testar funções puras diretamente, sem renderização ou
  mocks de rede: conversões nos dois sentidos e empates para longe de zero;
  mapeamento WMO; normalização de payloads completos, parciais, inválidos e
  não finitos; exatamente cinco datas locais; comparação de horário de
  referência. Isso isola regras determinísticas e torna os casos de borda
  rápidos e reproduzíveis.
- **`services/` (Vitest):** controlar/mockar `fetch` para validar URLs,
  parâmetros, codificação da consulta, timeout, respostas HTTP e falhas de
  rede. Esses testes não dependem da disponibilidade da Open-Meteo e não
  precisam renderizar componentes.
- **`hooks/` (Testing Library):** verificar a coordenação dos estados
  assíncronos, retry com os mesmos parâmetros, bloqueio de operações
  duplicadas e descarte de respostas obsoletas. Serviços podem ser substituídos
  por mocks para testar o fluxo sem tráfego de rede.
- **`components/` (Testing Library):** testar comportamento observável e
  acessível: busca por botão/Enter, validação vazia, seleção por teclado,
  contexto geográfico/coordenadas, alternância de unidade, indicação de
  indisponibilidade e apresentação de carregamento, vazio, erro e retry. Não
  testar detalhes internos de implementação nem chamadas reais à API;
  confirmar que alternar unidade atualiza os valores exibidos sem iniciar
  outra requisição.
- **Concorrência:** controlar respostas de teste para comprovar que buscas
  anteriores e consultas da cidade anterior não substituem a operação mais
  recente; garantir que resultado e identificação de cidade permaneçam
  consistentes.
- **E2E (Playwright):** interceptar APIs com fixtures determinísticas; cobrir
  fluxo de pesquisa → seleção → dados atuais/previsão → alternância e cenários
  vazio, falha/retry, consulta lenta e dados parciais. Não depender da
  disponibilidade real da Open-Meteo nos testes automatizados.
- **Acessibilidade:** executar verificação automatizada e revisão manual por
  teclado/foco em busca, carregamento, vazio, erro e resultados; automação não
  substitui revisão manual.
- **Aceite não funcional:** verificar ausência de rolagem horizontal a partir
  de 320 px; suportar as duas versões estáveis mais recentes de Chrome, Edge,
  Firefox e Safari (incluindo macOS/iOS), registrando browser, versão, sistema
  e viewport. Conduzir teste moderado com ao menos cinco participantes
  representativos (meta: quatro completam as tarefas sem ajuda).
- **Medições antes da publicação:** registrar método, ambiente, rede, amostras,
  população, janela e exclusões. Medir p95 de até três segundos para busca e
  previsão separadamente, distinguindo aplicação e fonte, e disponibilidade
  mensal de 99,5% da aplicação e da fonte separadamente.
- Comandos locais previstos: `pnpm lint`, `pnpm build`, `pnpm test` e
  `pnpm test:e2e`.

## Risks & Trade-offs

| Risco / trade-off | Decisão ou mitigação |
|---|---|
| Cobertura, limites, disponibilidade, licença ou atribuição da Open-Meteo podem não atender ao uso. | Validar todos antes da implementação; manter a fonte ou reabrir a decisão se a validação falhar. |
| Localidades homônimas podem levar à consulta errada. | Mostrar contexto geográfico e, se insuficiente, coordenadas; consultar usando a seleção/coordenadas, nunca apenas o nome. |
| Datas ou atualidade podem ser interpretadas incorretamente por diferença de fuso ou horário de verão. | Usar timezone e datas locais da fonte; validar semântica/documentação do horário antes de definir conversões. |
| Respostas lentas, falhas ou concorrência podem deixar estado incorreto. | Timeout de 10 segundos, retry explícito, estados distinguíveis e descarte por identificador de requisição. |
| Dados parciais podem parecer completos ou precisos. | Representar ausências como `null`, exibir indisponibilidade e não inferir valores; códigos de condição sem mapeamento também ficam indisponíveis. |
| Converter sempre a resposta Celsius mantém modelo simples, mas adiciona conversão local. | Manter precisão de origem em Celsius e arredondar apenas na exibição; evita chamadas adicionais e dependência de payload em Fahrenheit. |
| Clientes chamam a API diretamente, sem backend. | Adequado ao escopo sem autenticação/persistência; a aplicação não controla disponibilidade/limites e deve documentar os dados enviados por HTTPS e a atribuição. |
| Logs do provedor de hospedagem podem conter dados técnicos. | Não adicionar analytics nem registrar termos/localidades pela aplicação; documentar provedor, região, retenção e responsável por incidentes antes da publicação. |
| Metas de usabilidade, performance, disponibilidade, acessibilidade e compatibilidade exigem validação externa ao teste unitário. | Registrar evidências e condições de medição conforme NFR-01 a NFR-08 da especificação; não declarar conformidade sem a validação correspondente. |

Fora do escopo desta versão: GPS, contas, favoritos, histórico, persistência
local/de servidor, analytics, alertas, notificações, funcionamento offline
garantido, idiomas além de pt-BR e outras conversões de grandezas.
