1. Start Manual
O fluxo é disparado manualmente para facilitar testes e execuções controladas.

2. Comando Manual
Recebe o comando em linguagem natural, como:
ou
A pessoa de ID 202 troca o carro para Honda

3. Criar um Assistente IA
Envia o comando para o modelo GPT-4, que interpreta a frase e devolve os parâmetros estruturados (ação, campo, critério, novo valor).

4. Parse JSON da IA
Converte a resposta da IA para um objeto JSON, facilitando o processamento nos próximos passos.

5. Obter Linhas na Planilha
Lê todas as linhas da planilha do Google Sheets para garantir que os dados estejam atualizados antes de qualquer ação.

7. IF (Filtro ou Atualização)
Verifica se o comando é de filtro ou de atualização:

Filtro: Aplica critérios e retorna apenas os registros que atendem ao comando.

Atualização: Segue para localizar e modificar a linha correta.

8. Filtrar
Aplica lógica AND entre os critérios do comando. Exemplo de código usado no node Function:

return items.filter(item => {
  const skillOk = !criterios.skill || (item.json.Skills || '').toLowerCase().includes(criterios.skill.toLowerCase());
  const cidadeOk = !criterios.cidade || (item.json["City of Origin"] || '').toLowerCase() === criterios.cidade.toLowerCase();
  const carroOk = !criterios.carro || (item.json.Car || '').toLowerCase() === criterios.carro.toLowerCase();
  return skillOk && cidadeOk && carroOk;
});

Esse código garante que só aparecem no resultado final os registros que atendem a todos os critérios preenchidos no comando.

9. Localizar Linha para Atualização
Identifica a linha correta a ser modificada, usando o critério do comando (ID, nome, cidade, etc.).

10. Atualizar
Realiza a alteração solicitada na planilha, como trocar o carro, a cidade ou a moeda, atualizando apenas o campo correto.

11. Obter Planilha Atualizada
Lê novamente a planilha para garantir que os dados estejam sincronizados antes de buscar informações externas (como cotações de moedas).

12. API CoinGecko
Se o comando envolve moeda, faz uma chamada à API da CoinGecko para buscar a cotação da criptomoeda em reais (BRL) em tempo real.
Exemplo de URL configurada no nó HTTP Request:
https://api.coingecko.com/api/v3/simple/price?ids={{ $json["Currency"].toLowerCase() }}&vs_currencies=brl

13. Merge Moedas
Une a cotação recebida com a linha que foi alterada, garantindo que cada registro tenha o preço certo.

14. Atualização de Preço (Code)
Bloco de código para associar a cotação à linha da planilha:
 
const moeda = item.json.Currency.toLowerCase();
const price = item.json[moeda] && item.json[moeda].brl ? item.json[moeda].brl : 0;
return {
  json: {
    row_number: item.json.row_number,
    Price: price
  }
};

5. Atualizar Moedas
Atualiza o campo “Price” na planilha com o valor da cotação.

16. Obter Atualização Moedas
Lê a planilha novamente para garantir que todas as informações estão corretas e atualizadas.

17. Encerramento
O fluxo termina com um nó “No Operation”.

Observações Finais
Todo comando executado é registrado em uma planilha de histórico, facilitando auditoria e rastreabilidade.

O fluxo está preparado para expansão, podendo receber novos tipos de comandos e integrações no futuro.