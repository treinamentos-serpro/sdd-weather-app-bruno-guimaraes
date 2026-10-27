# Especificação de Produto — Weather App

## Overview

O Weather App é uma aplicação web responsiva para consultar o clima de uma
cidade escolhida pelo usuário. A experiência central cobre localizar e
selecionar uma cidade, consultar suas condições atuais e ver a previsão de
cinco dias — hoje e os quatro dias seguintes — com temperaturas em Celsius ou
Fahrenheit.

- **Fonte meteorológica definida:** Open-Meteo, sem exigir API key do usuário.
  Cobertura, atribuição e condições de uso ainda precisam ser confirmadas.
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
metas quantitativas e algumas decisões de apresentação permanecem sujeitas às
perguntas em aberto ao final deste documento.

## Functional Requirements

### FR-01 — Buscar e selecionar uma cidade

O sistema deve permitir que o usuário pesquise cidades pelo nome e escolha uma
das localidades retornadas. Quando a fonte disponibilizar contexto geográfico,
os resultados devem apresentá-lo para ajudar a distinguir cidades homônimas.

### FR-02 — Consultar as condições atuais

Após a seleção de uma cidade, o sistema deve consultar e apresentar as
condições meteorológicas atuais associadas àquela localidade, incluindo
temperatura e uma descrição da condição, quando esses dados forem fornecidos
pela fonte.

### FR-03 — Consultar a previsão de cinco dias

Para a cidade selecionada, o sistema deve apresentar a previsão de hoje e dos
quatro dias seguintes. As datas devem corresponder ao calendário local da
cidade. Os campos e a granularidade exatos da previsão dependem das decisões
em aberto.

### FR-04 — Alternar a unidade de temperatura

O sistema deve permitir alternar entre Celsius e Fahrenheit e atualizar as
temperaturas apresentadas na consulta para a unidade escolhida. A unidade
inicial deve ser Celsius.

### FR-05 — Comunicar falhas e permitir recuperação

Quando a busca ou a consulta meteorológica falhar, o sistema deve informar que
os dados não puderam ser obtidos e oferecer uma ação para tentar novamente.
Uma pesquisa sem cidades correspondentes deve ser comunicada como resultado
vazio, não como falha de serviço.

### FR-06 — Informar o estado da consulta

O sistema deve dar retorno observável durante a busca e a consulta, apresentar
os resultados associados à cidade selecionada e não deixar o usuário sem
orientação quando não houver resultados.

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
  - **Given:** o usuário pesquisou o nome de uma cidade e a fonte retornou ao
    menos uma correspondência.
  - **When:** a busca é concluída.
  - **Then:** o sistema apresenta uma ou mais opções de cidade que podem ser
    selecionadas.
- **AC-01.2**
  - **Given:** a fonte retornou país, estado ou região para uma opção de cidade.
  - **When:** o sistema apresenta os resultados da busca.
  - **Then:** essa opção exibe, junto ao nome da cidade, cada campo de contexto
    geográfico retornado pela fonte.
- **AC-01.3**
  - **Given:** o sistema apresentou opções de cidade e o usuário selecionou uma
    delas.
  - **When:** os resultados meteorológicos dessa seleção são apresentados.
  - **Then:** o nome da localidade selecionada pode ser identificado nos
    resultados.
- **AC-01.4**
  - **Given:** a fonte não retornou correspondências para o nome pesquisado.
  - **When:** a busca é concluída.
  - **Then:** o sistema informa que nenhuma cidade foi encontrada e mantém
    disponível a possibilidade de iniciar outra pesquisa.

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
  - **Then:** a descrição é exibida junto à temperatura e associada à mesma
    cidade.
- **AC-02.3**
  - **Given:** há uma temperatura atual disponível e a unidade selecionada é
    Celsius.
  - **When:** o sistema apresenta as condições atuais.
  - **Then:** a temperatura é identificada e exibida em Celsius.

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
  - **Then:** cada data é distinguível das demais e exibe os dados retornados
    pela fonte para aquela data.
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

### Para FR-04 — Alternar a unidade de temperatura

- **AC-04.1**
  - **Given:** a interface de consulta está disponível.
  - **When:** o usuário consulta o controle de unidade.
  - **Then:** o controle oferece Celsius e Fahrenheit e indica qual opção está
    selecionada.
- **AC-04.2**
  - **Given:** há temperaturas atuais e de previsão disponíveis.
  - **When:** o usuário seleciona Fahrenheit ou Celsius.
  - **Then:** as temperaturas atuais e da previsão são exibidas na unidade
    selecionada.
- **AC-04.3**
  - **Given:** uma cidade está selecionada e sua previsão está apresentada.
  - **When:** o usuário alterna a unidade de temperatura.
  - **Then:** a cidade selecionada e as datas da previsão permanecem
    inalteradas.
- **AC-04.4**
  - **Given:** uma nova sessão é iniciada sem preferência de unidade previamente
    definida.
  - **When:** a interface fica pronta para consulta.
  - **Then:** Celsius está selecionado.

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
  - **Then:** o sistema inicia novamente a mesma busca ou consulta que falhou.
- **AC-05.4**
  - **Given:** uma nova tentativa de busca ou consulta também falhou.
  - **When:** o sistema apresenta o resultado dessa tentativa.
  - **Then:** a mensagem de falha permanece visível e a ação de tentar novamente
    continua disponível.

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
    seleciona a cidade B.
  - **When:** os resultados da cidade B são apresentados.
  - **Then:** os dados exibidos são identificados como pertencentes à cidade B,
    sem serem associados à cidade A.

## Non-Functional Requirements

Os valores marcados como **meta proposta** vieram da discovery e ainda
precisam de aprovação e de um método de medição acordado.

- **NFR-01 — Responsividade:** a interface deve adaptar conteúdo e controles a
  diferentes larguras de tela. **Meta proposta:** a partir de 320 px de largura,
  as funções principais permanecem disponíveis sem rolagem horizontal.
- **NFR-02 — Usabilidade:** busca, consulta da previsão e alternância de unidade
  devem ser compreensíveis sem treinamento ou documentação externa. O método
  de validação com usuários precisa ser definido.
- **NFR-03 — Desempenho:** **meta proposta:** 95% das consultas apresentam
  resultados em até 3 segundos. Rede, dispositivo, período, população e método
  de medição ainda precisam ser definidos. O tempo da aplicação e o da fonte
  externa devem ser medidos separadamente.
- **NFR-04 — Disponibilidade:** **meta proposta:** disponibilidade mensal de
  99,5%. O cálculo deve distinguir a disponibilidade da aplicação da
  disponibilidade da fonte externa e ainda precisa de método acordado.
- **NFR-05 — Acessibilidade:** as telas principais devem atender ao WCAG 2.2
  nível AA, incluindo operação por teclado, foco visível, contraste adequado,
  nomes acessíveis para controles e comunicação acessível de estados dinâmicos.
- **NFR-06 — Compatibilidade:** navegadores e versões móveis suportados devem
  ser acordados antes da implementação.
- **NFR-07 — Atualidade dos dados:** deve ser possível informar o horário
  pertinente à atualização dos dados e identificar dados considerados
  desatualizados. A origem do horário, frequência de atualização e idade
  máxima aceitável precisam ser definidos.
- **NFR-08 — Privacidade e segurança:** os dados coletados, suas finalidades e
  períodos de retenção devem ser documentados; dados transmitidos devem ser
  protegidos em trânsito. Se localização por GPS vier a ser incluída, seu uso
  deverá ser informado e depender de permissão do usuário.

## Edge Cases

- A pesquisa está vazia, contém apenas espaços ou não corresponde a nenhuma
  cidade.
- Há diversas cidades com o mesmo nome; o usuário precisa reconhecer a
  localidade correta pelo contexto geográfico disponível.
- O usuário pesquisa nomes parciais, com acentos ou grafias alternativas; o
  comportamento esperado da fonte ainda precisa ser confirmado.
- A busca ou a consulta falha por falta de rede, timeout, indisponibilidade ou
  limite da fonte. A interface deve comunicar a falha e permitir nova tentativa.
- A fonte retorna resposta vazia, incompleta ou inválida, inclusive sem
  temperatura, descrição ou dados para uma ou mais datas da previsão. O sistema
  não deve apresentar conteúdo ausente como se fosse um dado válido; a
  comunicação específica precisa ser definida.
- A fonte responde lentamente; enquanto a operação não terminar, deve ser
  possível distinguir carregamento de resultado vazio ou falha. O limite de
  timeout ainda não está definido.
- O usuário troca a cidade enquanto uma consulta está em andamento; os dados
  exibidos devem continuar identificados com a cidade a que pertencem.
- O fuso horário local da cidade, a mudança de data ou o horário de verão
  diferem do dispositivo do usuário; os dias da previsão devem continuar
  associados às datas locais corretas.
- A conversão entre Celsius e Fahrenheit resulta em casas decimais; regra de
  arredondamento e precisão exibida ainda precisam ser definidas.
- A cidade não tem cobertura para todos os campos ou dias pretendidos na
  fonte; a interface não deve sugerir cobertura completa quando houver dados
  ausentes.
- O usuário fica sem conexão após carregar dados; disponibilidade offline ou
  apresentação de dados previamente consultados ainda não está definida.
- O usuário não concede permissão de localização; a busca manual permanece o
  fluxo definido para encontrar uma cidade, pois GPS não está confirmado para
  esta versão.

## Assumptions

- A consulta começa com a pesquisa e seleção explícita de uma cidade.
- A fonte meteorológica será Open-Meteo e não será necessária API key para o
  usuário consultar o serviço; a cobertura e as condições de uso ainda serão
  verificadas.
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
| Indisponibilidade, lentidão, limites ou cobertura insuficiente da Open-Meteo | Consultas podem falhar, demorar ou não atender a certas localidades. | Confirmar cobertura e condições de uso; monitorar falhas e latência; definir timeout, mensagens de recuperação e política para dados em cache, se aplicável. |
| Seleção de cidade homônima incorreta | O usuário pode tomar decisões com dados de outra localidade. | Exibir contexto geográfico disponível nos resultados e validar o fluxo de seleção para nomes ambíguos. |
| Dados desatualizados ou previsão interpretada como garantia | Decisões podem ser baseadas em dados antigos ou em estimativas mal compreendidas. | Definir frequência e idade máxima; apresentar horário relevante e sinalizar desatualização; esclarecer limitações da previsão. |
| Datas agrupadas incorretamente por fuso horário ou horário de verão | A previsão pode aparecer no dia local errado. | Usar as datas e o fuso da cidade e validar mudanças de data e horário de verão. |
| Metas propostas sem método de medição | Desempenho e disponibilidade podem ser medidos de formas incompatíveis ou não ser verificáveis. | Aprovar condições e método de medição; distinguir métricas da aplicação e da fonte. |
| Idioma, formatos ou unidades não alinhados ao público | A informação pode ser confusa ou reduzir a confiança nos dados. | Confirmar público, formatos e apresentação das grandezas antes da implementação. |
| Barreiras de acessibilidade ou incompatibilidade | Pessoas podem não conseguir operar a busca ou interpretar seus resultados. | Definir navegadores suportados e validar teclado, foco, contraste, nomes acessíveis, estados dinâmicos e tamanhos de tela. |
| Coleta de localização ou outros dados sem expectativa clara | Pode haver perda de confiança e riscos de privacidade. | Manter a busca manual como fluxo base; se GPS for aprovado, explicar o uso, solicitar permissão e documentar coleta, finalidade e retenção. |

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

As decisões abaixo não foram respondidas na discovery. Não devem ser tratadas
como requisitos confirmados sem validação.

### Produto, público e plataforma

1. Quem são os usuários prioritários, qual problema principal deve ser
   resolvido e como o sucesso será medido?
2. Qual região geográfica e quais localidades precisam ser cobertas?
3. A interface web responsiva é suficiente ou há necessidade de PWA ou
   aplicativos nativos?

### Busca e seleção de cidades

4. A busca aceitará apenas nomes de cidades ou também país, estado/região,
   código postal e coordenadas?
5. A busca será enviada explicitamente ou oferecerá sugestões enquanto o
   usuário digita? Serão necessários correção de erros, histórico ou outros
   recursos?
6. Quais campos de localização devem identificar cada resultado e como tratar
   cidades sem contexto suficiente para desambiguação?
7. Qual cobertura de localidades se espera e como serão tratados nomes
   parciais, acentos, grafias alternativas e muitos resultados?

### Dados e apresentação meteorológica

8. Quais campos são essenciais para condições atuais e previsão, além de
   temperatura e descrição da condição?
9. A previsão terá granularidade diária, horária ou ambas? Qual resumo de cada
   dia deve ser exibido?
10. Como serão tratados fusos, horário de verão, nascer e pôr do sol e mudanças
    de data na apresentação?
11. Qual frequência de atualização define “clima atual”? Qual horário deve ser
    apresentado como última atualização e qual idade torna os dados
    desatualizados?
12. São necessários alertas meteorológicos ou eventos severos? Como comunicar
    incerteza, precisão e limitações da previsão?
13. A cobertura, a licença, a atribuição, os limites e a disponibilidade da
    Open-Meteo atendem ao uso pretendido?

### Unidades, idioma e preferências

14. A preferência de unidade será mantida entre sessões? Como será escolhida a
    unidade inicial além do padrão Celsius já definido?
15. Celsius e Fahrenheit bastam para temperatura? Quais unidades serão usadas
    para vento, precipitação e distância?
16. Haverá suporte a outros idiomas? Como idioma, formatos de data e números
    serão selecionados e localizados?
17. Qual precisão e regra de arredondamento serão usadas para temperaturas
    convertidas?

### Persistência, conectividade e erros

18. GPS, cidades favoritas ou consultas recentes serão adicionados? Se GPS for
    considerado, quando será solicitada permissão e qual alternativa será
    oferecida?
19. O app precisa apresentar a última consulta quando a rede falhar ou
    funcionar offline? Como dados armazenados serão identificados pela idade?
20. Quais categorias de falha devem ser distinguidas para o usuário e quais
    terão ações de recuperação específicas?
21. Qual timeout será usado e quando o usuário poderá atualizar os dados
    manualmente?
22. Quais estados de interface, além de carregamento, vazio e erro, são
    necessários para confirmar a seleção da cidade e a atualização dos dados?

### Qualidade, compatibilidade e operação

23. A largura mínima proposta de 320 px foi aprovada?
24. As metas propostas de desempenho (95% em até 3 segundos) e disponibilidade
    (99,5% mensal) foram aprovadas? Qual será o método de medição, incluindo
    população, rede, dispositivo, período e separação da fonte externa?
25. Quais navegadores e versões devem ser suportados?
26. Como será verificada a conformidade WCAG 2.2 AA nas telas e nos estados
    dinâmicos?
27. Como será validada com usuários a afirmação de que os fluxos são
    compreensíveis sem treinamento?
28. Quais dados são coletados pela aplicação, infraestrutura ou ferramentas de
    análise, para quais finalidades, por quanto tempo e em quais regiões são
    armazenados?
29. Há requisitos adicionais de segurança, retenção ou região de armazenamento?
    Quem monitorará desempenho, falhas e limites da fonte, e qual será o
    procedimento de resposta a incidentes?
