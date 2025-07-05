Explicação do Fluxo de Automação – Google Sheets AI Agent
Este documento detalha o funcionamento do fluxo principal criado no n8n para automatizar operações em uma planilha Google Sheets, utilizando comandos em linguagem natural, IA (GPT-4) e integração com a API CoinGecko para cotações de criptomoedas.

Visão Geral
O fluxo foi desenhado para que qualquer pessoa possa atualizar, filtrar ou consultar informações em uma planilha apenas digitando frases comuns, como:

“A pessoa de ID 202 troca o carro para Honda”

“Quais pessoas têm conhecimento em JavaScript e moram em São Paulo?”

“Troque a moeda da pessoa para litecoin”

O sistema interpreta o comando, executa a ação correta na planilha e, se necessário, busca cotações em tempo real na CoinGecko.

Diagrama do Fluxo
![src/fluxo.png]

Descrição das Etapas do Fluxo

1. Disparo Manual
O fluxo é iniciado manualmente para facilitar testes e execuções controladas. Isso permite validar cada etapa antes de automatizar a entrada.

2. Entrada do Comando
O usuário digita um comando em linguagem natural, como:

A pessoa de ID 204 troca a moeda para litecoin
ou
Quais pessoas têm skill em Zapier e moram em São Paulo?

3. Interpretação do Comando com IA (GPT-4)
O comando é enviado ao modelo GPT-4 usando o node “Message a Model”. O modelo retorna os parâmetros estruturados em JSON, por exemplo:

{
  "acao": "atualizar",
  "criterio": "ID",
  "valorBusca": "204",
  "campoAtualizar": "Currency",
  "novoValor": "litecoin"
}

ou, para filtros:

{
  "acao": "filtrar",
  "criterios": {
    "skill": "Zapier",
    "cidade": "São Paulo"
  }
}

4. Parse JSON
A resposta da IA é convertida para objeto JSON, facilitando o processamento nos próximos passos.

5. Leitura da Planilha (Get Rows)
O fluxo lê todas as linhas da planilha Google Sheets para garantir que os dados estejam atualizados antes de qualquer ação.

6. Merge de Dados
Os parâmetros extraídos pela IA são combinados com os dados da planilha, preparando para a decisão de filtro ou atualização.

7. IF – Filtro ou Atualização
O fluxo verifica se o comando é de filtro ou atualização:

Se for filtro:
Aplica os critérios e retorna apenas os registros que atendem ao comando.

Se for atualização:
Localiza a linha correta e segue para atualizar o campo desejado.

8. Filtrar (Node Code)
Exemplo de código usado para aplicar múltiplos critérios:
return items.filter(item => {
  const skillOk = !criterios.skill || (item.json.Skills || '').toLowerCase().includes(criterios.skill.toLowerCase());
  const cidadeOk = !criterios.cidade || (item.json["City of Origin"] || '').toLowerCase() === criterios.cidade.toLowerCase();
  const carroOk = !criterios.carro || (item.json.Car || '').toLowerCase() === criterios.carro.toLowerCase();
  return skillOk && cidadeOk && carroOk;
});

Esse código garante que só aparecem no resultado final os registros que atendem a todos os critérios preenchidos no comando.


9. Localizar Linha para Atualização
Identifica a linha correta (por ID, nome, cidade, etc.) para modificar.

10. Atualizar na Planilha
Atualiza apenas o campo desejado na linha correta.
Exemplo de expressão usada no n8n para atualizar o campo:
{{ $json.row_number }}
e para o valor:
{{ $json.novoValor }}

11. Leitura Pós-Atualização
Lê novamente a planilha para garantir sincronização antes de buscar cotações externas.

12. Consulta à CoinGecko (HTTP Request)
Se o comando envolve moeda, faz uma chamada à API da CoinGecko para buscar a cotação da criptomoeda em BRL.

Exemplo de URL configurada:
https://api.coingecko.com/api/v3/simple/price?ids={{ $json["Currency"].toLowerCase() }}&vs_currencies=brl

3. Merge Cotação + Linha
Une a cotação recebida com a linha alterada.

14. Atualização de Preço (Node Code)
Exemplo de código:
const moeda = item.json.Currency.toLowerCase();
const price = item.json[moeda] && item.json[moeda].brl ? item.json[moeda].brl : 0;
return {
  json: {
    row_number: item.json.row_number,
    Price: price
  }
};
15. Atualizar Moeda na Planilha
Atualiza o campo “Price” com a cotação correta.

16. Encerramento
