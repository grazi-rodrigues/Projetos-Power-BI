-> Entendimento da base de dados.

-> TRATAMENTO NO POWER QUERY

Aqui foi realizado a conexão com a base de dados da tabela CONTRATO.
Com essa tabela, foi feito duas REFERÊNCIAS da mesma para (dFuncionário e fContrato).

OBS: Isso garante uma melhor performance e organização, e será mais fácil realizar os cálculos.

Dica: Para quando precisar trazer mais de um arquivo dentro de uma pasta
(que é o caso da nosso relatório) é aconselhado
trazer o caminho da pasta ao invés do arquivo individual,
para que assim você tenha uma automatização do relatório.
Isso acontece para relatórios periódicas que precisam economizar tempo.

-> MODELAGEM DE DADOS

° Dimensão: Todas possuem uma chave única + Colunas Descritivas. Um cadastro ou características
Geralmente possuem poucas linhas ou muitas colunas

° Fato: São eventos históricos
Geralmente possuem uma DATA + Chave Dim + Valor
Geralmente são gigantescas com milhões ou bilhões linhas

Você liga Dim -> Fato

Um relacionamento saudável é feito de 1 - * ( um para mitos)

-> MEDIDAS, TABELAS E COLUNAS CALCULADAS UTILIZADAS

Criando uma tabela Calendário

dCalendario =
CALENDAR(
  DATE(
    YEAR(MIN(fContrato[Data Admissão])), 01, 01),
      DATE(
      YEAR(MAX(fContrato[Data Admissão])), 12, 31)
)

Para realizar a contagem de linhas e obter a quantidade de contratações:

Contratações = COUNTROWS(fContrato)

Calculando a quantidade de demissão;
OBS: Função USERELATIONSHIP é para ativar um relacionamento inativo.

Demissões =
CALCULATE(
 [Contratações],
  fContrato[Situação] = "Demitido",
      USERELATIONSHIP(
        dCalendario[Data], fContrato[Data Afastamento]))

Calculando a quantidade paga para funcionários ativos

Massa Salárial =
CALCULATE(
    SUM(fContrato[Valor Salário]),
          fContrato[Situação] <> "Demitido")

Quantidade de funcionários ativos:

Headcount = [Contratações] - [Demissões]

Forma correta para realizar um acomunado dos contratos ativos:

Headcount =
CALCULATE([Contratações] - [Demissões],
  FILTER(
    ALL(dCalendario),
    dCalendario[Data] <= MAX(dCalendario[Data])))

Lógica por trás da métrica Headcount  acima
Em gestão de processos é chamado de "Curva S".

EXEMPLO com passo a passo.

Com a função ALL, ele removerá todo tipo de filtro da tabela:

Lógica DAX =
CALCULATE(
  [Contratações],
    ALL(dCalendario))

A função MAX trará a data até o contexto atual.

Data Contexto = MAX(dCalendario[Data])

Com isso, juntando as duas funções dentro de um FILTER:

Lógica DAX =
CALCULATE(
    [Contratações] - [demissões],
    FILTER(
        ALL(dCalendario),
        dCalendario[Data] <= MAX(dCalendario[Data])
)

Criando uma coluna calculada:

Entendendo a lógica.
Etapa 1: Função DATEDIFF irá retornar a diferença de datas em dias.

Má contratação = DATEDIFF(fContrato[Data Admissão], fContrato[Data Afastamento], DAY)

Etapa 2: Realizando dentro de uma condição, onde retornará o resultado de má contratação caso a quantidade de dias seja menor que 60 e situação igual a demitido.

Má contratação =
IF(
DATEDIFF(
    fContrato[Data Admissão], fContrato[Data Afastamento], DAY) < 60 && fContrato[Situação] = "Demitido",
    "Má Contratação",
    "OK"
)

Após termos feito a coluna calculada, será possível realizar a mesma para obtermos a medida de acumulado de má contratações dentro da função CALCULATE.

Má contratações =
CALCULATE(
    [Contratações],
    fContrato[Má contratação] = "Má Contratação"
)

Utilizando a mesma lógica da coluna dentro da medida:
OBS: Utilizar dessa forma resultará numa melhor performance e evite criar uma outra coluna dentro da tabela.

Má contratações =
CALCULATE(
    [Contratações],
    FILTER(fContrato,
        DATEDIFF(fContrato[Data Admissão], fContrato[Data Afastamento], DAY) < 60 &&
         fContrato[Situação] = "Demitido"
    )
)   

Retornando o percentual Turnover até o ano do atual contexto:

% Turnover Ano Max =
CALCULATE(
    [% de Turnover],
    FILTER(
        ALL(dCalendario),
        dCalendario[Ano] = MAX(dCalendario[Ano])))

→ VISUALIZÃO

DICA!
Se precisar um filtro onde precise analisar resultados com uma outra coluna, basta ir na barra de tarefas MODELAGEM > NOVO PARÂMETRO > CAMPO. Depois é só escolher as colunas que deseja.

Exemplo do filtro de segmentação

auxMedida = {
    ("Contratações", NAMEOF('Medidas'[Contratações]), 0),
    ("Demissões", NAMEOF('Medidas'[Demissões]), 1),
    ("Headcount", NAMEOF('Medidas'[Headcount]), 2),
    ("Má contratações", NAMEOF('Medidas'[Má contratações]), 3),
    ("Massa Salárial", NAMEOF('Medidas'[Massa Salárial]), 4)
}

Indicador TURNOVER