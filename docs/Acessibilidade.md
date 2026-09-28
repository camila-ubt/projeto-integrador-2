# Acessibilidade

O sistema possui recursos de acessibilidade para apoiar a leitura e a navegação. Na área pública, o controle Acessibilidade fica no canto inferior direito da tela e reúne opções de contraste e tamanho do texto.

## Contraste e tamanho do texto

A opção Alto contraste altera as cores definidas pelo tema e mantém os links sublinhados. O botão informa se a opção está ativada ou desativada.

Os controles A+ e A− ajustam o tamanho base do texto entre 100%, 120% e 140%, em intervalos de 20 pontos percentuais. Ao atingir um dos limites, o botão correspondente fica desabilitado. A ampliação acompanha os elementos dimensionados em relação ao tamanho base; textos com tamanho fixo podem não acompanhar esse ajuste.

A opção Restaurar padrão desativa o alto contraste e retorna o tamanho do texto a 100%. As preferências ficam no estado da interface e não são salvas para uma nova visita. Ao recarregar a página, os controles voltam ao padrão.

## Navegação por teclado

O painel utiliza controles nativos que podem ser alcançados com a tecla Tab. Há indicação visual de foco nos controles de acessibilidade e nos links e botões abrangidos pelos estilos globais.

Com o foco dentro do painel de acessibilidade, a tecla Escape fecha as opções e devolve o foco ao controle Acessibilidade. O painel tem altura limitada e rolagem interna para acomodar seu conteúdo em telas menores.

## Apoio a leitores de tela

Os botões de aumentar e diminuir o texto possuem nomes descritivos. O controle de contraste informa seu estado com `aria-pressed`, e a indicação do tamanho do texto utiliza `aria-live` para comunicar alterações a tecnologias assistivas.

Outras telas também incluem marcações de apoio. No dashboard, os botões de expandir e recolher seções informam seu estado, e as mensagens de erro são identificadas como alertas. Controles como fechar janelas, abrir menus e acessar registros possuem nomes descritivos nos componentes em que foram implementados.

## Abrangência dos recursos

O painel de contraste e tamanho do texto faz parte do layout da área pública. Ele não é exibido no painel administrativo, que possui seus próprios controles e marcações de apoio à navegação.

Esta página descreve os recursos presentes no código. Sua implementação, por si só, não comprova conformidade integral com diretrizes de acessibilidade nem substitui a validação das telas com teclado e tecnologias assistivas.

Os demais recursos estão em [Funcionalidades](Funcionalidades), e as análises do painel administrativo estão em [Dashboard e Análise de Dados](Dashboard-e-Analise-de-Dados).
