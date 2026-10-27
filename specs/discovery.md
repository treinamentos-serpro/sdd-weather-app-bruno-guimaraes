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

As probabilidades abaixo são estimativas iniciais. Público, fonte de dados e critérios de aceite ainda precisam ser confirmados.

| Risco | Tipo | Probabilidade | Impacto | Estratégia de mitigação |
|---|---|---|---|---|
| Indisponibilidade, lentidão ou limites da API meteorológica | Técnico | Média | Consultas podem falhar ou demorar, prejudicando a experiência. | Confirmar cobertura, licença e limites da fonte; monitorar latência e falhas; definir timeouts, mensagens de erro, nova tentativa e, se apropriado, cache com indicação de dados antigos. |
| Usuário selecionar a cidade errada entre resultados homônimos | Produto | Alta | O app pode mostrar informações corretas para o local errado, sem que isso seja evidente. | Exibir contexto nos resultados, como país e estado/região; definir tratamento para nomes parciais, acentos e busca sem resultados. |
| Dados antigos ou interpretação equivocada da previsão | Produto/Técnico | Média | Usuários podem tomar decisões com dados defasados ou entender estimativas como garantias. | Definir frequência e idade máxima dos dados; mostrar horário da última atualização e sinalizar dados desatualizados; comunicar limitações da previsão. |
| Agrupamento incorreto dos cinco dias por fuso horário ou horário de verão | Técnico | Média | Previsões podem aparecer no dia errado, especialmente para cidades em outros fusos. | Usar o fuso da cidade para agrupar os dados; definir se “cinco dias” significa dias civis locais ou períodos de 24 horas; testar mudanças de data e horário de verão. |
| Escopo do produto e expectativas de uso não definidos | Produto | Alta | A equipe pode construir uma experiência inadequada ao público ou deixar de incluir capacidades esperadas. | Confirmar usuários prioritários, objetivo e critério de sucesso; decidir se o produto será site responsivo, PWA ou app nativo; explicitar se recursos como alertas e favoritos fazem parte do escopo. |
| Metas de desempenho e disponibilidade sem definição de medição | Técnico/Produto | Média | Metas propostas podem não ser verificáveis ou não refletir a experiência real, inclusive quando a API externa falhar. | Aprovar condições e método de medição; acompanhar separadamente aplicação e fonte externa; estabelecer monitoramento e procedimentos de resposta a incidentes. |
| Unidades, idioma e localização inconsistentes com o público | Produto | Média | Formatos ou unidades inesperados podem confundir usuários e reduzir a confiança. | Definir região e idiomas suportados, unidade inicial e persistência da preferência; especificar conversão e apresentação das demais grandezas meteorológicas. |
| Barreiras de acessibilidade ou incompatibilidade em dispositivos e navegadores | Técnico/Produto | Média | Parte dos usuários pode não conseguir buscar ou interpretar a previsão. | Definir navegadores suportados; validar teclado, foco, contraste, nomes acessíveis e estados dinâmicos; testar responsividade a partir da largura mínima proposta. |
| Coleta de localização ou outros dados sem expectativa clara do usuário | Produto/Técnico | Baixa/Média | Pode afetar a confiança e criar riscos de privacidade, especialmente se GPS for adicionado. | Manter busca manual como alternativa; se usar GPS, pedir permissão com contexto, limitar a coleta ao necessário e documentar finalidade, retenção e tratamento dos dados. |

## Perguntas em Aberto

As perguntas abaixo detalham as decisões ainda necessárias. O impacto descreve o risco de avançar sem uma resposta acordada.

### Produto e público

1. **Pergunta:** Quem são os usuários prioritários e em que situações consultarão o app?
   **Impacto:** A experiência pode ser otimizada para o público ou contexto errado, como consulta casual em vez de planejamento de viagem.
2. **Pergunta:** Qual problema principal o produto deve resolver e como será medido o sucesso?
   **Impacto:** Faltam critérios para priorizar funcionalidades e avaliar se o produto entrega valor.
3. **Pergunta:** “Acessar por dispositivos móveis” significa site responsivo, PWA instalável, apps nativos ou uma combinação?
   **Impacto:** Escopo, custo e expectativas sobre instalação, notificações e uso offline podem mudar substancialmente.
4. **Pergunta:** O produto será direcionado a uma região ou público geográfico específico?
   **Impacto:** Cobertura de cidades, idioma, formatos, unidades e requisitos regulatórios podem ser definidos incorretamente.

### Busca e seleção de cidades

5. **Pergunta:** Quais entradas a busca aceitará: nome, país, estado/região, código postal ou coordenadas?
   **Impacto:** Usuários podem não localizar a cidade pretendida; também ficam indefinidos o tratamento de acentos, grafias alternativas e nomes parciais.
6. **Pergunta:** A busca ocorrerá após envio ou terá sugestões enquanto o usuário digita, correção de erros ou histórico?
   **Impacto:** Fluxos, estados de carregamento e expectativas de velocidade ficam indefinidos; incluir esses recursos depois pode exigir retrabalho.
7. **Pergunta:** Que informações identificarão resultados homônimos, como país, estado ou região?
   **Impacto:** O usuário pode selecionar a cidade errada e receber dados plausíveis, mas referentes a outro lugar.
8. **Pergunta:** Como serão tratados nenhum resultado, muitos resultados, entrada inválida e falha de busca?
   **Impacto:** A busca pode terminar sem orientação ou parecer travada; “tentar novamente” não define todos esses cenários.
9. **Pergunta:** A busca deve cobrir qualquer localidade disponível na fonte ou haverá limites geográficos?
   **Impacto:** A cobertura percebida pode divergir da cobertura real, especialmente para localidades pequenas ou regiões menos atendidas.

### Dados meteorológicos e previsões

10. **Pergunta:** Qual fonte será usada e quais restrições de licença, atribuição, custo, limites e disponibilidade se aplicam?
    **Impacto:** A fonte escolhida pode não permitir o uso pretendido, exceder limites ou não oferecer cobertura e dados necessários.
11. **Pergunta:** Quais campos definem “condições atuais” e “previsão” (por exemplo, sensação térmica, precipitação, vento e umidade)?
    **Impacto:** O produto pode omitir informações que usuários ou stakeholders consideram essenciais.
12. **Pergunta:** A previsão de cinco dias será diária, horária ou terá as duas granularidades?
    **Impacto:** “Cinco dias” pode resultar em experiências bastante diferentes, afetando apresentação, volume de dados e interpretação.
13. **Pergunta:** Cada dia da previsão representa o dia civil local, as próximas 24 horas ou outro intervalo?
    **Impacto:** A previsão pode começar ou terminar em horários inesperados e parecer incompatível com o calendário local.
14. **Pergunta:** Como serão tratados fuso horário, horário de verão, nascer/pôr do sol e mudanças de data?
    **Impacto:** Horários e previsões podem ser atribuídos ao dia errado, sobretudo em locais distantes do fuso do usuário.
15. **Pergunta:** Qual é a frequência de atualização e o que significa “clima atual” para o produto?
    **Impacto:** Dados defasados podem parecer atuais; atualizações excessivas podem elevar custos ou consumir limites da fonte.
16. **Pergunta:** Qual idade máxima torna um dado desatualizado e como isso será comunicado?
    **Impacto:** Usuários podem confiar em dados antigos ou receber rótulos inadequados à cadência real da fonte.
17. **Pergunta:** O produto precisa exibir alertas meteorológicos ou eventos severos?
    **Impacto:** Se forem esperados, sua ausência pode ser uma lacuna relevante; se não forem, usuários ainda podem presumir que o app os oferece.
18. **Pergunta:** Como serão explicadas a incerteza, a precisão e as limitações da previsão?
    **Impacto:** Usuários podem interpretar estimativas como garantias, especialmente para previsões distantes ou locais com cobertura limitada.

### Unidades, idioma e preferências

19. **Pergunta:** Qual será a unidade inicial de temperatura e como a preferência será armazenada?
    **Impacto:** Usuários podem ver uma unidade inesperada ou perder a escolha ao atualizar ou reabrir o app.
20. **Pergunta:** Celsius e Fahrenheit são as únicas unidades necessárias? Como serão tratados vento, precipitação e distância?
    **Impacto:** A alternância pode converter apenas a temperatura, deixando grandezas relacionadas inconsistentes ou sem contexto compreensível.
21. **Pergunta:** Quais idiomas serão suportados e como serão localizados descrições meteorológicas, datas e números?
    **Impacto:** Interface e dados podem aparecer em idiomas ou formatos misturados, comprometendo compreensão e confiança.
22. **Pergunta:** Idioma e unidades seguirão a configuração do dispositivo, uma escolha no app ou outra regra?
    **Impacto:** O comportamento inicial pode surpreender e gerar inconsistências entre sessões ou regiões.

### Localização, favoritos e persistência

23. **Pergunta:** A localização por GPS fará parte do produto? Se sim, quando será solicitada e haverá alternativa manual?
    **Impacto:** Pedir permissão sem contexto pode reduzir confiança; não oferecer alternativa pode bloquear quem negar a permissão.
24. **Pergunta:** Será possível salvar cidades favoritas ou manter cidades consultadas recentemente?
    **Impacto:** Sem essa decisão, não se sabe se o fluxo deve privilegiar consultas pontuais ou acesso recorrente, nem quais dados persistir.
25. **Pergunta:** O app precisa funcionar offline ou apresentar a última consulta quando a rede falhar?
    **Impacto:** Conexões instáveis podem tornar o app inutilizável; dados armazenados sem indicação de idade podem induzir a erro.
26. **Pergunta:** Haverá contas, sincronização entre dispositivos ou armazenamento apenas local?
    **Impacto:** Persistência, privacidade e esforço de implementação ficam indefinidos; preferências podem não acompanhar o usuário.

### Erros e interação

27. **Pergunta:** Quais falhas precisam ser distinguidas: falta de rede, limite da fonte, cidade não encontrada, erro do serviço ou dado inválido?
    **Impacto:** Mensagens e ações de recuperação podem ser inadequadas; tentar novamente não resolve todos os tipos de falha.
28. **Pergunta:** Quando e como o usuário poderá atualizar os dados novamente?
    **Impacto:** Ficam indefinidos o equilíbrio entre atualidade, consumo da fonte e comportamento da interface.
29. **Pergunta:** Quais estados visuais são necessários durante busca e consulta, e como a seleção da cidade será confirmada?
    **Impacto:** O usuário pode não saber se a ação foi aceita, se os dados estão carregando ou qual cidade está sendo exibida.
30. **Pergunta:** Como será validado que a busca, a consulta e a alternância de unidade são compreensíveis sem treinamento?
    **Impacto:** O requisito de usabilidade não será verificável; a equipe pode presumir que a interface é intuitiva sem evidência.

### Qualidade, operação e requisitos técnicos

31. **Pergunta:** As metas propostas de desempenho, disponibilidade, largura mínima e acessibilidade foram aprovadas? Como serão medidas?
    **Impacto:** Propostas podem ser tratadas como compromissos ou ignoradas sem acordo sobre critérios de aceite.
32. **Pergunta:** O que significa “95% das consultas em até 3 segundos”: qual população, período, dispositivo, rede e intervalo de medição?
    **Impacto:** A meta não pode ser verificada consistentemente; diferentes métodos podem produzir resultados incompatíveis.
33. **Pergunta:** Como será calculada a disponibilidade de 99,5% e como serão separadas falhas da aplicação e da fonte externa?
    **Impacto:** Fica indefinido se a meta mede a experiência completa ou somente componentes sob controle da equipe.
34. **Pergunta:** Quais navegadores e versões são obrigatórios?
    **Impacto:** Incompatibilidades podem ser descobertas tarde, causando retrabalho ou exclusão de usuários.
35. **Pergunta:** Quais critérios de aceite demonstrarão WCAG 2.2 AA nas telas principais?
    **Impacto:** A acessibilidade pode não ser testada de ponta a ponta; controles, mensagens dinâmicas e fluxos podem permanecer inacessíveis.
36. **Pergunta:** Quais dados serão coletados pelo app, pela infraestrutura e por ferramentas de análise, para quais finalidades e por quanto tempo?
    **Impacto:** A documentação pode omitir coleta indireta ou retenção real, gerando riscos de confiança, conformidade e mudanças tardias.
37. **Pergunta:** Há requisitos de segurança, retenção ou região de armazenamento além de proteger dados em trânsito?
    **Impacto:** As proteções definidas podem não cobrir os dados coletados nem as obrigações aplicáveis ao produto.
38. **Pergunta:** Quem monitorará falhas, limites da fonte, desempenho e disponibilidade, e qual será o procedimento de resposta?
    **Impacto:** Metas sem monitoramento não permitem detectar regressões nem agir diante de degradação do serviço.

### Decisões prioritárias

Antes de fechar o escopo, priorizar a definição do público e objetivo do produto, plataforma, fonte e licença dos dados, conteúdo e granularidade da previsão, busca e desambiguação, e comportamento diante de dados ausentes ou desatualizados. Essas decisões condicionam boa parte da experiência, da arquitetura e dos critérios de aceite.

## Suposições

- A consulta começa com a busca e seleção explícita de uma cidade; localização automática não está incluída até confirmação.
- “Clima atual” e “previsão de 5 dias” serão fornecidos por uma fonte externa de dados meteorológicos.
- Celsius e Fahrenheit se aplicam às temperaturas; outras unidades não estão definidas no briefing.
- A previsão é associada à cidade selecionada e deve respeitar seu fuso horário.
- O suporte a dispositivos móveis será atendido inicialmente por uma interface web responsiva; desenvolvimento de aplicativo nativo não está implícito.
- Não há requisitos definidos para autenticação, contas, cidades favoritas ou armazenamento de preferências.