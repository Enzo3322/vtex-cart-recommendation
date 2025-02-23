# Sistema de Recomendação de Itens Baseado em Pedidos Anteriores

## Objetivo

Desenvolver uma aplicação que recomenda itens aos clientes com base nos itens presentes em seu carrinho, utilizando dados históricos de pedidos da VTEX. A recomendação será fundamentada em padrões de co-ocorrência identificados em pedidos anteriores que contêm mais de um item, otimizando a experiência do cliente e potencialmente aumentando as vendas por meio de sugestões relevantes.

## Visão Geral do Processo

O sistema proposto será implementado em Node.js e dividido em três etapas principais: coleta de dados, armazenamento e análise, e geração de recomendações. Abaixo, detalhamos cada etapa do processo de implementação.

## Etapas da Implementação

1. Coleta de Dados via API da VTEX
A aplicação fará requisições à API de Orders da VTEX para buscar dados históricos de pedidos. Serão utilizados parâmetros de paginação para garantir a captura eficiente de grandes volumes de dados.


2. Armazenamento dos Dados em Banco Local
Os pedidos filtrados serão armazenados em um banco de dados local para análise posterior, garantindo que a aplicação não depende de chamadas repetitivas à API da VTEX em tempo real.
   
4. Análise de Padrões e Geração de Recomendações
A aplicação analisará os dados armazenados para identificar padrões de co-ocorrência (itens frequentemente comprados juntos) e usará esses padrões para recomendar itens com base no carrinho atual do cliente.

## Tecnologias:

- Node.js: Para lógica de backend e manipulação de dados.
- Express: Framework para criar uma API RESTful que receberá os dados do carrinho e retornará recomendações.

## Algoritmo de Recomendação:

- Extrair todos os pedidos do banco.
- Gerar pares de itens comprados juntos e contar sua frequência (ex.: "item1-item2" apareceu 10 vezes).
- Para cada item no carrinho do cliente, identificar os itens mais asociados nos pares históricos, excluindo os já presentes no carrinho.
- Ordenar por frequência e selecionar as top 3 recomendações.

## Endpoint da API:

POST /recommend: Recebe um JSON com o array de itens do carrinho (ex.: {"items": ["skuid1", "skuid2"]}) e retorna as recomendações (ex.: {"["sku3", "sku4", "sku5"]}).
Resultado: Recomendações personalizadas entregues em tempo real ao cliente.
Benefícios da Implementação
Aumento de Conversão: Sugestões relevantes incentivam compras adicionais, elevando o valor médio dos pedidos.
Escalabilidade: O uso de um banco local permite análises rápidas sem sobrecarregar a API da VTEX.
Flexibilidade: O sistema pode ser adaptado para bancos de dados mais robustos ou algoritmos mais sofisticados (ex.: machine learning) conforme a necessidade.

## Como rodar

Para popular seu banco é necessário rodar o script `node src/data-fetching.js`

Após a conclusão do script: `node src/index.js`

PS: O código poderia ser feito com HashMaps mas consumiria mais memória, mas isso é um tradeoff aceitável para desempenho em aplicações com muitos acessos. E a função preprocessData foi criada com o intuito isolar o custo de complexidade deixando as rotas com complexidade quase constante em relação ao tamanho do carrinho.
