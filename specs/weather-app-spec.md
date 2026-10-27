# Especificação de Produto — Weather App

## Overview

O Weather App é uma aplicação web responsiva para consultar o clima de uma
cidade escolhida pelo usuário. A experiência central cobre localizar e
selecionar uma cidade, consultar suas condições atuais e ver a previsão de
cinco dias — hoje e os quatro dias seguintes — com temperaturas em Celsius ou
Fahrenheit.

- **Fonte meteorológica definida:** Open-Meteo, sem exigir API key do usuário.
  Antes da implementação, confirmar cobertura, atribuição, limites e condições
  de uso; incluir a atribuição exigida pela fonte na interface.
- **Unidade inicial:** Celsius.
- **Idioma da interface:** português do Brasil (pt-BR).
- **Acesso:** interface web responsiva, incluindo dispositivos móveis.
- **Conta e servidor:** não haverá autenticação nem persistência de dados do
  usuário no servidor nesta versão.
- **Público orientador:** pessoas que consultam o clima para deslocamentos,
  atividades ao ar livre ou planejamento de viagem. As personas descritas na
  discovery são hipóteses, não segmentos validados.

O sucesso do fluxo principal é o usuário conseguir identificar a cidade correta
e entender suas condições atuais e a previsão para os próximos cinco dias. As
decisões confirmadas definem o escopo desta versão. As metas marcadas como
propostas e os itens de publicação pendentes ao final deste documento exigem
aprovação antes de serem tratados como compromissos de produção.

## Functional Requirements

### FR-01 — Buscar e selecionar uma cidade

O sistema deve permitir que o usuário pesquise cidades pelo nome por meio de
envio explícito e escolha uma das localidades retornadas. Os resultados devem
exibir o nome da cidade, país e estado/região quando disponíveis. Se esse
contexto não bastar para distinguir localidades homônimas, devem exibir as
coordenadas retornadas pela fonte. A ordem dos resultados retornada pela fonte
deve ser preservada; uma nova busca não pode ser sobrescrita por uma resposta
atrasada de busca anterior.

### FR-02 — Consultar as condições atuais

Após a seleção de uma cidade, o sistema deve consultar e apresentar as
condições meteorológicas atuais associadas ao identificador ou às coordenadas
daquela localidade. Os campos essenciais são temperatura e descrição da
condição; quando ausentes ou inválidos, devem ser identificados como
indisponíveis, sem inferir valores. As descrições devem ser apresentadas em
português do Brasil. A atualização deve ser identificada pelo horário de
referência fornecido pela fonte, quando disponível.

### FR-03 — Consultar a previsão de cinco dias

Para a cidade selecionada, o sistema deve apresentar a previsão de hoje e dos
quatro dias seguintes, em granularidade diária e no calendário local da cidade.
Cada dia deve apresentar temperatura mínima, temperatura máxima e descrição da
condição. Campos ou datas sem dados ou inválidos devem permanecer identificados
como indisponíveis; a interface não deve calcular valores ausentes nem
apresentar dados de outra data.

### FR-04 — Alternar a unidade de temperatura

O sistema deve permitir alternar entre Celsius e Fahrenheit e atualizar as
temperaturas atuais e de previsão para a unidade escolhida. A conversão deve
usar as fórmulas padrão (°F = °C × 9/5 + 32; °C = (°F − 32) × 5/9) e exibir
temperaturas arredondadas ao inteiro mais próximo, com empates arredondados
para longe de zero. A unidade inicial deve ser Celsius e não será persistida
entre sessões nesta versão.

### FR-05 — Comunicar falhas e permitir recuperação

Quando a busca ou a consulta meteorológica falhar, o sistema deve informar que
os dados não puderam ser obtidos e oferecer uma ação para tentar novamente.
Uma pesquisa sem cidades correspondentes deve ser comunicada como resultado
vazio, não como falha de serviço. Nova tentativa só ocorre por ação do usuário
e repete a mesma operação com os mesmos parâmetros.

### FR-06 — Informar o estado da consulta

O sistema deve dar retorno observável durante a busca e a consulta, apresentar
os resultados associados à cidade selecionada e não deixar o usuário sem
orientação quando não houver resultados. Cada operação deve comunicar
carregamento, sucesso com dados, vazio ou falha; uma resposta obsoleta não pode
alterar o estado da operação mais recente.

## User Stories

As personas abaixo são hipóteses de discovery e devem ser validadas com
usuários.

- **US-01 — FR-01 — Busca e seleção de cidade:** Como Camila, pessoa que planeja
  uma viagem, quero buscar e confirmar a cidade de destino entre resultados com
  nomes semelhantes para consultar o clima do local correto.
- **US-02 — FR-02 — Condições atuais:** Como Marina, pessoa que se desloca
  diariamente, quero consultar a temperatura e a condição atual da minha cidade
  para me preparar para o dia.
- **US-03 — FR-03 — Previsão de cinco dias:** Como Rafael, organizador de
  atividades ao ar livre, quero consultar a previsão de hoje e dos próximos
  quatro dias para escolher quando realizar uma atividade.
- **US-04 — FR-04 — Unidade de temperatura:** Como Camila, pessoa que planeja
  uma viagem, quero alternar entre Celsius e Fahrenheit para interpretar a
  previsão na unidade que prefiro ao organizar a viagem.
- **US-05 — FR-05 — Falhas e nova tentativa:** Como Marina, pessoa que se
  desloca diariamente, quero ser informada quando os dados não puderem ser
  carregados e poder tentar novamente para saber como prosseguir com minha
  consulta.
- **US-06 — FR-06 — Estado da consulta:** Como Rafael, organizador de atividades
  ao ar livre, quero receber indicação de carregamento, resultados ou ausência
  de resultados para entender o estado da consulta e decidir o próximo passo.

## Critérios de Aceite

Os critérios estão identificados por requisito para manter rastreabilidade.
Cada cenário usa `Given/When/Then` (Dado/Quando/Então) e define condições
observáveis para validação automatizada.

### Para FR-01 — Buscar e selecionar uma cidade

- **AC-01.1**
  - **Given:** o usuário digitou o nome de uma cidade.
  - **When:** envia a busca pelo botão ou pela tecla Enter.
  - **Then:** o sistema consulta a fonte e apresenta as opções retornadas em
    ordem, cada uma selecionável por mouse ou teclado.
- **AC-01.2**
  - **Given:** a fonte retornou país e/ou estado/região para uma opção de
    cidade.
  - **When:** o sistema apresenta os resultados da busca.
  - **Then:** essa opção exibe, junto ao nome da cidade, cada campo de contexto
    geográfico retornado pela fonte.
- **AC-01.2a**
  - **Given:** o contexto geográfico textual não distingue duas ou mais opções
    com o mesmo nome.
  - **When:** o sistema apresenta essas opções.
  - **Then:** cada opção também exibe as coordenadas retornadas pela fonte.
- **AC-01.3**
  - **Given:** o sistema apresentou opções de cidade e o usuário selecionou uma
    delas.
  - **When:** os resultados meteorológicos dessa seleção são apresentados.
  - **Then:** o resultado identifica a localidade selecionada e corresponde ao
    identificador ou às coordenadas dessa opção, sem usar apenas o texto do
    nome para determinar a localização.
- **AC-01.4**
  - **Given:** a fonte não retornou correspondências para o nome pesquisado.
  - **When:** a busca é concluída.
  - **Then:** o sistema informa que nenhuma cidade foi encontrada e mantém
    disponível a possibilidade de iniciar outra pesquisa.
- **AC-01.5**
  - **Given:** o campo de busca está vazio ou contém apenas espaços em branco.
  - **When:** o usuário tenta iniciar a busca.
  - **Then:** o sistema não envia uma consulta à fonte, informa que é necessário
    digitar o nome de uma cidade e mantém o campo disponível para correção.
- **AC-01.6**
  - **Given:** o usuário pesquisa um nome de cidade que contém acentos,
    espaços internos ou pontuação válida.
  - **When:** o sistema envia a busca ao serviço de geocoding.
  - **Then:** o sistema remove apenas espaços em branco no início e no fim,
    codifica corretamente os demais caracteres e envia a consulta sem remover
    acentos, espaços internos ou pontuação.
- **AC-01.7**
  - **Given:** uma busca A está em andamento e o usuário inicia uma busca B.
  - **When:** as respostas de A e B chegam em qualquer ordem.
  - **Then:** somente o estado e os resultados de B são apresentados; uma
    resposta atrasada de A não substitui nem altera os resultados mais recentes.

### Para FR-02 — Consultar as condições atuais

- **AC-02.1**
  - **Given:** o usuário selecionou uma cidade para a qual a fonte retornou
    condições atuais, incluindo temperatura.
  - **When:** a consulta meteorológica é concluída.
  - **Then:** o resultado identifica a cidade selecionada e apresenta sua
    temperatura atual.
- **AC-02.2**
  - **Given:** a fonte retornou uma descrição da condição atual para a cidade
    selecionada.
  - **When:** o sistema apresenta as condições atuais.
  - **Then:** a descrição é apresentada em português do Brasil junto à
    temperatura e associada à mesma cidade.
- **AC-02.3**
  - **Given:** há uma temperatura atual disponível e a unidade selecionada é
    Celsius.
  - **When:** o sistema apresenta as condições atuais.
  - **Then:** a temperatura é identificada e exibida em Celsius.
- **AC-02.4**
  - **Given:** a fonte retornou alguns dados atuais, mas um ou mais campos,
    incluindo a temperatura ou a descrição da condição, estão ausentes.
  - **When:** o sistema apresenta as condições atuais.
  - **Then:** os campos disponíveis são exibidos e cada campo ausente é
    identificado como indisponível, sem inventar valores ou apresentar conteúdo
    de outra cidade.
- **AC-02.5**
  - **Given:** a fonte retornou um horário de referência adequado para os dados
    meteorológicos.
  - **When:** o sistema apresenta os dados da cidade.
  - **Then:** exibe esse horário no fuso local da cidade e identifica os dados
    como desatualizados se o horário tiver mais de duas horas.
- **AC-02.6**
  - **Given:** a fonte não fornece horário de referência ou fornece um horário
    inválido.
  - **When:** o sistema apresenta as condições atuais.
  - **Then:** não inventa um horário nem afirma que os dados estão atualizados;
    os campos meteorológicos válidos continuam disponíveis.

### Para FR-03 — Consultar a previsão de cinco dias

- **AC-03.1**
  - **Given:** o usuário selecionou uma cidade e a fonte retornou previsão para
    hoje e os quatro dias locais seguintes.
  - **When:** o sistema apresenta a previsão.
  - **Then:** são exibidas exatamente cinco datas consecutivas, começando pela
    data atual no calendário local da cidade.
- **AC-03.2**
  - **Given:** a fonte retornou dados de previsão para cada uma das cinco datas.
  - **When:** o sistema apresenta a previsão.
  - **Then:** cada data é distinguível das demais e exibe temperatura mínima,
    máxima e descrição da condição em português do Brasil.
- **AC-03.3**
  - **Given:** há temperaturas de previsão disponíveis e uma unidade de
    temperatura está selecionada.
  - **When:** o sistema apresenta a previsão.
  - **Then:** as temperaturas são exibidas na unidade selecionada.
- **AC-03.4**
  - **Given:** a data local da cidade selecionada difere da data do dispositivo
    do usuário.
  - **When:** o sistema apresenta as datas da previsão.
  - **Then:** cada previsão é associada à data do calendário local da cidade,
    não à data do dispositivo.
- **AC-03.5**
  - **Given:** a fonte retornou previsão incompleta para uma ou mais das cinco
    datas ou deixou ausentes alguns campos de uma data.
  - **When:** o sistema apresenta a previsão.
  - **Then:** a interface mantém visíveis as cinco datas esperadas, exibe os
    dados disponíveis, identifica cada campo ou dia sem dados como
    indisponível e não sugere que a previsão está completa.

### Para FR-04 — Alternar a unidade de temperatura

- **AC-04.1**
  - **Given:** a interface de consulta está disponível.
  - **When:** o usuário consulta o controle de unidade.
  - **Then:** o controle oferece Celsius e Fahrenheit e indica qual opção está
    selecionada.
- **AC-04.2**
  - **Given:** há temperaturas atuais e de previsão disponíveis.
  - **When:** o usuário seleciona Fahrenheit ou Celsius.
  - **Then:** as temperaturas atuais e da previsão são convertidas pelas
    fórmulas definidas em FR-04 e arredondadas ao inteiro mais próximo, com
    empates para longe de zero; por exemplo, 0 °C é exibido como 32 °F e 32 °F
    como 0 °C.
- **AC-04.3**
  - **Given:** uma cidade está selecionada e sua previsão está apresentada.
  - **When:** o usuário alterna a unidade de temperatura.
  - **Then:** a cidade selecionada e as datas da previsão permanecem
    inalteradas.
- **AC-04.4**
  - **Given:** uma nova sessão é iniciada.
  - **When:** a interface fica pronta para consulta.
  - **Then:** Celsius está selecionado, sem recuperar uma unidade de sessão
    anterior.

### Para FR-05 — Comunicar falhas e permitir recuperação

- **AC-05.1**
  - **Given:** uma consulta meteorológica para a cidade selecionada falhou.
  - **When:** o sistema apresenta o resultado da consulta.
  - **Then:** a interface informa que os dados não puderam ser carregados e
    disponibiliza uma ação identificável para tentar novamente.
- **AC-05.2**
  - **Given:** uma busca falhou por indisponibilidade de rede ou serviço.
  - **When:** o sistema apresenta o resultado da busca.
  - **Then:** a interface comunica a falha e oferece nova tentativa, sem
    apresentá-la como uma busca concluída sem correspondências.
- **AC-05.3**
  - **Given:** uma busca ou consulta está em estado de falha e oferece nova
    tentativa.
  - **When:** o usuário aciona essa ação.
  - **Then:** o sistema inicia novamente a mesma busca ou consulta que falhou,
    com os mesmos parâmetros, sem iniciar operações duplicadas por um único
    acionamento.
- **AC-05.4**
  - **Given:** uma nova tentativa de busca ou consulta também falhou.
  - **When:** o sistema apresenta o resultado dessa tentativa.
  - **Then:** a mensagem de falha permanece visível e a ação de tentar novamente
    continua disponível.
- **AC-05.5**
  - **Given:** uma requisição da busca ou consulta não foi concluída em até
    10 segundos.
  - **When:** o limite da requisição é atingido.
  - **Then:** o sistema encerra a operação como falha, informa que os dados não
    puderam ser obtidos e oferece nova tentativa, sem apresentar o timeout como
    resultado vazio.
- **AC-05.6**
  - **Given:** a estrutura da resposta meteorológica impede extrair dados
    válidos ou nenhum campo meteorológico esperado tem valor válido para as
    condições atuais ou para qualquer data prevista.
  - **When:** o sistema processa a resposta.
  - **Then:** o sistema comunica que os dados não puderam ser obtidos e oferece
    nova tentativa, sem exibir valores inválidos. Campos ausentes ou inválidos
    em uma resposta parcialmente utilizável são identificados como
    indisponíveis, conforme AC-02.4 e AC-03.5. Uma resposta válida de geocoding
    sem correspondências deve seguir AC-01.4, não este critério.

### Para FR-06 — Informar o estado da consulta

- **AC-06.1**
  - **Given:** uma busca ou consulta meteorológica foi iniciada e ainda não foi
    concluída.
  - **When:** a operação está em andamento.
  - **Then:** a interface apresenta um estado de carregamento perceptível.
- **AC-06.2**
  - **Given:** uma consulta meteorológica para a cidade selecionada foi
    concluída com dados.
  - **When:** o sistema apresenta o resultado.
  - **Then:** a interface apresenta os dados associados à cidade selecionada e
    encerra o estado de carregamento.
- **AC-06.3**
  - **Given:** uma busca foi concluída sem correspondências.
  - **When:** o sistema apresenta o resultado da busca.
  - **Then:** a interface apresenta uma mensagem de estado vazio e não mantém
    um indicador de carregamento ativo.
- **AC-06.4**
  - **Given:** uma consulta para a cidade A está em andamento e o usuário
    seleciona a cidade B antes de a consulta de A terminar.
  - **When:** a resposta de B chega antes ou depois da resposta de A.
  - **Then:** a interface apresenta apenas os dados da seleção mais recente
    (B), identifica-os como pertencentes a B e não permite que a resposta
    atrasada de A os substitua.
- **AC-06.5**
  - **Given:** a cidade A está apresentada e o usuário seleciona a cidade B.
  - **When:** a consulta de B está em andamento.
  - **Then:** a interface indica que B está sendo consultada e não identifica
    dados de A como pertencentes a B.

## Non-Functional Requirements

Os valores marcados como **meta proposta** são parâmetros para aprovação. Não
são critérios de aceite de produção até que responsáveis, ambiente, método e
eventuais exclusões de medição sejam acordados.

- **NFR-01 — Responsividade:** a interface deve adaptar conteúdo e controles a
  diferentes larguras de tela. **Meta proposta:** a partir de 320 px de largura,
  as funções principais permanecem disponíveis sem rolagem horizontal.
- **NFR-02 — Usabilidade:** busca, consulta da previsão e alternância de unidade
  devem ser compreensíveis sem treinamento ou documentação externa. **Método
  proposto:** teste moderado com pelo menos cinco participantes representativos;
  pelo menos quatro devem completar, sem ajuda, a busca e seleção de cidade, a
  identificação da previsão de cinco dias e a alternância de unidade. Registrar
  participantes, tarefas, resultados e impedimentos; validar a representatividade
  dos participantes antes do teste.
- **NFR-03 — Desempenho:** **meta proposta:** 95% das consultas apresentam
  resultados em até 3 segundos. Medir, em janela mensal, o percentil 95 do
  tempo entre o envio da busca/seleção e a exibição do resultado para consultas
  concluídas com sucesso; medir busca e previsão separadamente, reportar o
  tempo da aplicação e o da fonte externa separadamente e documentar ambiente,
  rede, volume de amostras e população usados na medição.
- **NFR-04 — Disponibilidade:** **meta proposta:** disponibilidade mensal de
  99,5%. Definir previamente o que constitui indisponibilidade, calcular a
  disponibilidade da aplicação e a da fonte externa em métricas separadas,
  sobre o total de minutos do mês, e publicar janela e exclusões adotadas.
- **NFR-05 — Acessibilidade:** as telas principais devem atender ao WCAG 2.2
  nível AA, incluindo operação por teclado, foco visível, contraste adequado,
  nomes acessíveis para controles e comunicação acessível de estados dinâmicos.
- **NFR-05.1 — Verificação de acessibilidade:** antes da entrega, executar
  verificação automatizada de acessibilidade e revisão manual por teclado em
  busca, carregamento, vazio, erro e resultados; registrar e corrigir violações
  WCAG 2.2 AA identificadas. A verificação automatizada, isoladamente, não
  comprova conformidade.
- **NFR-06 — Compatibilidade:** navegadores e versões suportados devem ser
  aprovados antes da publicação. Os testes de aceite devem registrar
  navegador, versão, sistema operacional e viewport em que foram executados.
- **NFR-07 — Atualidade dos dados:** deve ser possível informar o horário
  de referência fornecido pela fonte, no fuso local da cidade. Dados cujo
  horário de referência tenha mais de duas horas devem ser identificados como
  desatualizados. Antes da implementação, confirmar que a fonte fornece um
  horário de referência adequado e documentar sua semântica.
- **NFR-08 — Privacidade e segurança:** os dados coletados, suas finalidades e
  períodos de retenção devem ser documentados antes da publicação. O nome da
  cidade e a localidade selecionada são enviados à Open-Meteo para atender à
  consulta; essa transmissão deve ocorrer por HTTPS. Nesta versão não há GPS,
  contas, histórico nem persistência local ou no servidor de consultas ou
  preferências.

## Edge Cases

- O campo de pesquisa está vazio ou contém apenas espaços; a busca não é
  enviada, a interface solicita o nome de uma cidade e mantém o campo
  disponível para correção.
- O geocoding não encontra a cidade pesquisada, inclusive quando a localidade
  não existe ou não está coberta pela fonte; o sistema apresenta um estado
  vazio, não um erro de serviço, e permite iniciar outra pesquisa.
- Há diversas cidades com o mesmo nome; o usuário precisa reconhecer a
  localidade correta pelo contexto geográfico disponível; se país e
  estado/região não bastarem para distingui-las, são apresentadas as
  coordenadas retornadas pela fonte.
- O usuário pesquisa nomes parciais, com acentos, espaços ou pontuação válida;
  espaços externos são removidos e os demais caracteres são codificados sem
  alteração ao enviar a consulta. A correspondência e a cobertura de grafias
  alternativas seguem os limites documentados da fonte.
- A busca ou a consulta falha por falta de rede, timeout, indisponibilidade ou
  limite da fonte; a interface comunica falha, encerra o carregamento e permite
  repetir a mesma operação. Cada requisição expira após 10 segundos; timeout
  não deve ser comunicado como busca sem resultados.
- A fonte retorna alguns dados meteorológicos, mas omite campos atuais ou
  dados de uma ou mais datas da previsão; a interface exibe somente os dados
  disponíveis e identifica os campos ou dias ausentes como indisponíveis, sem
  sugerir cobertura completa.
- A fonte retorna valores nulos, não numéricos ou não finitos para campos
  meteorológicos; esses campos são tratados como indisponíveis e nunca
  formatados como valores válidos.
- A fonte retorna uma resposta vazia ou inválida que não pode ser usada como
  dado parcial; o sistema comunica falha e oferece nova tentativa, sem exibir
  valores inválidos.
- A fonte responde lentamente; enquanto a operação não terminar ou atingir o
  limite de timeout, deve ser possível distinguir carregamento, resultado vazio
  e falha.
- O usuário troca a cidade enquanto uma consulta está em andamento; os dados
  exibidos devem continuar identificados com a cidade a que pertencem e uma
  resposta atrasada de uma seleção anterior não pode substituir a mais recente.
- O fuso horário local da cidade, a mudança de data ou o horário de verão
  diferem do dispositivo do usuário; os dias da previsão devem continuar
  associados às datas locais corretas.
- A conversão entre Celsius e Fahrenheit resulta em casas decimais; as fórmulas
  padrão são usadas e o resultado é arredondado ao inteiro mais próximo, com
  empates para longe de zero.
- A cidade não tem cobertura para todos os campos ou dias pretendidos na
  fonte; a interface não deve sugerir cobertura completa quando houver dados
  ausentes.
- O usuário fica sem conexão após carregar dados; disponibilidade offline ou
  apresentação de dados previamente consultados ainda não está definida.
- Se uma versão futura incluir localização por GPS e o usuário não conceder
  permissão, a busca manual deverá continuar disponível como alternativa.
- O horário de referência informado pela fonte tem mais de duas horas; os
  dados são identificados como desatualizados, sem alterar ou ocultar
  silenciosamente os valores retornados.

## Assumptions

- A consulta começa com a pesquisa e seleção explícita de uma cidade.
- A fonte meteorológica será Open-Meteo e não será necessária API key para o
  usuário consultar o serviço; cobertura, atribuição, limites e condições de
  uso serão confirmados antes da implementação.
- “Cinco dias” significa hoje e os quatro dias seguintes, decisão já registrada
  na discovery.
- As datas da previsão devem respeitar o fuso horário da cidade selecionada.
- Celsius é a unidade inicial; Fahrenheit também poderá ser selecionada.
- A interface desta versão será web responsiva, em português do Brasil.
- Não haverá autenticação nem persistência de dados do usuário no servidor.
- As personas são hipóteses para orientar a especificação e não foram
  confirmadas por pesquisa com usuários.
- Não se presume persistência local de preferências, favoritos ou histórico.

## Risks

| Risco | Impacto potencial | Mitigação |
|---|---|---|
| Indisponibilidade, lentidão, limites ou cobertura insuficiente da Open-Meteo | Consultas podem falhar, demorar ou não atender a certas localidades. | Confirmar cobertura, atribuição e condições de uso; monitorar falhas e latência; aplicar timeout de 10 segundos e permitir nova tentativa. |
| Seleção de cidade homônima incorreta | O usuário pode tomar decisões com dados de outra localidade. | Exibir contexto geográfico e, quando insuficiente, coordenadas; associar consultas ao identificador ou às coordenadas selecionadas. |
| Dados desatualizados ou previsão interpretada como garantia | Decisões podem ser baseadas em dados antigos ou em estimativas mal compreendidas. | Exibir o horário de referência da fonte, sinalizar dados com mais de duas horas e comunicar que a previsão é estimativa. |
| Datas agrupadas incorretamente por fuso horário ou horário de verão | A previsão pode aparecer no dia local errado. | Usar as datas e o fuso da cidade e validar mudanças de data e horário de verão. |
| Metas propostas sem método de medição | Desempenho e disponibilidade podem ser medidos de formas incompatíveis ou não ser verificáveis. | Aprovar condições e método de medição; distinguir métricas da aplicação e da fonte. |
| Idioma, formatos ou unidades não alinhados ao público | A informação pode ser confusa ou reduzir a confiança nos dados. | Confirmar público, formatos e apresentação das grandezas antes da implementação. |
| Barreiras de acessibilidade ou incompatibilidade | Pessoas podem não conseguir operar a busca ou interpretar seus resultados. | Definir navegadores suportados e validar teclado, foco, contraste, nomes acessíveis, estados dinâmicos e tamanhos de tela. |
| Coleta de localização ou outros dados sem expectativa clara | Pode haver perda de confiança e riscos de privacidade. | Nesta versão, não coletar localização por GPS nem manter histórico; documentar dados de consulta transmitidos à fonte, finalidades e retenção antes da publicação. |

## Out of Scope

- Autenticação, contas de usuário e sincronização entre dispositivos.
- Persistência de dados de usuário no servidor.
- Aplicativos nativos para iOS ou Android; a plataforma considerada é uma
  interface web responsiva.
- Localização automática por GPS na versão base; ela só deve ser incluída após
  decisão explícita sobre permissão, finalidade e fluxo alternativo.
- Alertas meteorológicos e notificações.
- Cidades favoritas, histórico de consultas e persistência local de preferências
  ou dados meteorológicos, até que esses recursos sejam definidos.
- Funcionamento offline como requisito garantido.
- Idiomas de interface além de pt-BR e conversão de grandezas além de Celsius e
  Fahrenheit para temperatura.

## Open Questions

As decisões abaixo são pendências de aprovação, não funcionalidades implícitas.
As quatro primeiras são bloqueadores de publicação; as demais só entram no
escopo se forem aprovadas e especificadas em uma versão futura.

### Bloqueadores de publicação

1. A Open-Meteo atende à cobertura geográfica e aos requisitos de licença,
   atribuição, limites e disponibilidade do uso pretendido? Qual campo de
   horário será a referência oficial para indicar atualização?
2. Quais navegadores e versões serão suportados?
3. Quais dados serão coletados por hospedagem ou ferramentas de análise, para
   quais finalidades, por quanto tempo e em quais regiões serão armazenados?
   Quem será responsável por monitoramento e resposta a incidentes?
4. As metas propostas de desempenho, disponibilidade e largura mínima de
   320 px foram aprovadas? Quais condições, responsáveis e exclusões serão
   usadas na medição?

### Decisões para versões futuras

5. Há necessidade validada de outras regiões, campos meteorológicos, alertas,
   idiomas ou unidades?
6. Busca por país/estado, correção de erros, favoritos, histórico, GPS,
   atualização automática ou funcionamento offline serão necessários?
7. Há necessidade de pesquisa com usuários para validar público, tarefas e
   critérios quantitativos de usabilidade?
