// ** Função para processar a resposta da IA e retornar o JSON esperado, pega o texto JSON do campo "output"
let resposta = $json.output || '';

try {
  resposta = resposta.trim();
  // Se vier como array
  if (resposta.startsWith('[')) {
    return JSON.parse(resposta).map(obj => ({ json: obj }));
  }
  // Se vier como objeto
  if (resposta.startsWith('{')) {
    return [{ json: JSON.parse(resposta) }];
  }
  throw new Error('Formato inesperado da resposta da IA');
} catch (e) {
  throw new Error('Falha ao fazer parse do JSON da IA: ' + e.message);
}



// ** Função para filtrar os registros da planilha com base nos parâmetros do comando
const items = $input.all();
const resultados = [];

// Para cada registro da planilha, já enriquecido com os parâmetros do comando:
for (let i = 0; i < items.length; i++) {
  const registro = items[i].json;

  // Parâmetros do comando (vindos do Merge)
  const skill = (registro.skill || '').toLowerCase().trim();
  const cidade = (registro.cidade || '').toLowerCase().trim();
  const carro = (registro.carro || '').toLowerCase().trim();

  // Dados reais da planilha
  const skills = (registro.Skills || '')
    .split(',')
    .map(s => s.trim().toLowerCase());
  const cidadeLinha = (registro['City of Origin'] || '').toLowerCase().trim();
  const carroLinha = (registro.Car || '').toLowerCase().trim();

  // Filtro dinâmico: só retorna se todos os critérios preenchidos forem atendidos
  if (
    (!skill || skills.includes(skill)) &&
    (!cidade || cidadeLinha === cidade) &&
    (!carro || carroLinha === carro)
  ) {
    resultados.push(registro);
  }
}

return resultados.map(r => ({ json: r }));


// ** Função para atualizar ou remover skills de registros da planilha
const items = $input.all();
const parametros = items[items.length - 1].json;
const linhas = items.slice(0, items.length - 1);

let criterio = parametros.criterio || '';
let valorBusca = parametros.valorBusca || '';
let campoAtualizar = parametros.campoAtualizar || '';
let novoValor = parametros.novoValor || '';

if (parametros.acao === 'adicionar_skill' || parametros.acao === 'remover_skill') {
  if (parametros.valorBusca && parametros.criterio) {
    criterio = parametros.criterio;
    valorBusca = parametros.valorBusca;
  } else if (parametros.nome) {
    criterio = 'nome';
    valorBusca = parametros.nome;
  } else if (parametros.id) {
    criterio = 'id';
    valorBusca = parametros.id;
  }
  campoAtualizar = 'Skills';
  novoValor = parametros.skill || '';
}

const traducoes = {
  "carro": "Car",
  "nome": "Name",
  "cidade de origem": "City of Origin",
  "skills": "Skills",
  "cidade": "City of Origin"
};

const nomeColuna = traducoes[campoAtualizar.toLowerCase()] || campoAtualizar;

// Adicionar skill a todos se não houver critério
if (parametros.acao === 'adicionar_skill' && !criterio && !valorBusca) {
  let resultados = [];
  for (let i = 0; i < linhas.length; i++) {
    const registro = linhas[i].json;
    let skillsAtuais = (registro.Skills || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    // Adiciona skill apenas se não existir (case-insensitive)
    if (!skillsAtuais.map(s => s.toLowerCase()).includes(novoValor.toLowerCase())) {
      skillsAtuais.push(novoValor);
    }

    // Garante que não fique apenas uma vírgula
    const skillsStr = skillsAtuais.filter(Boolean).join(', ');

    resultados.push({
      json: {
        row_number: i + 2,
        Skills: skillsStr
      }
    });
  }
  return resultados;
}

// Remover skill de todos se não houver critério
if (parametros.acao === 'remover_skill' && !criterio && !valorBusca) {
  let resultados = [];
  for (let i = 0; i < linhas.length; i++) {
    const registro = linhas[i].json;
    let skillsAtuais = (registro.Skills || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    // Remove a skill (case-insensitive)
    skillsAtuais = skillsAtuais.filter(
      s => s.toLowerCase() !== novoValor.toLowerCase()
    );

    const skillsStr = skillsAtuais.filter(Boolean).join(', ');

    resultados.push({
      json: {
        row_number: i + 2,
        Skills: skillsStr
      }
    });
  }
  return resultados;
}

// Busca por registro específico
let linhaEncontrada = null;
let registroEncontrado = null;

for (let i = 0; i < linhas.length; i++) {
  const registro = linhas[i].json;
  if (criterio.toLowerCase() === "id" && String(registro.ID) === String(valorBusca)) {
    linhaEncontrada = i + 2;
    registroEncontrado = registro;
    break;
  }
  if (
    criterio.toLowerCase() === "nome" &&
    registro["Name"] &&
    registro["Name"].toLowerCase().includes(valorBusca.toLowerCase())
  ) {
    linhaEncontrada = i + 2;
    registroEncontrado = registro;
    break;
  }
  if (criterio.toLowerCase() === "cidade" && registro["City of Origin"] === valorBusca) {
    linhaEncontrada = i + 2;
    registroEncontrado = registro;
    break;
  }
  if (criterio.toLowerCase() === "skill" && registro.Skills && registro.Skills.includes(valorBusca)) {
    linhaEncontrada = i + 2;
    registroEncontrado = registro;
    break;
  }
}

if (linhaEncontrada === null && (criterio || valorBusca)) {
  throw new Error('Registro não encontrado');
}

// Lógica especial para remover skill de um registro específico
if (parametros.acao === 'remover_skill' && registroEncontrado) {
  let skillsAtuais = (registroEncontrado.Skills || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  skillsAtuais = skillsAtuais.filter(
    s => s.toLowerCase() !== novoValor.toLowerCase()
  );

  const skillsStr = skillsAtuais.filter(Boolean).join(', ');

  return [{
    json: {
      row_number: linhaEncontrada,
      Skills: skillsStr
    }
  }];
}

// Lógica para adicionar skill de um registro específico
if (parametros.acao === 'adicionar_skill' && registroEncontrado) {
  let skillsAtuais = (registroEncontrado.Skills || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  if (!skillsAtuais.map(s => s.toLowerCase()).includes(novoValor.toLowerCase())) {
    skillsAtuais.push(novoValor);
  }

  const skillsStr = skillsAtuais.filter(Boolean).join(', ');

  return [{
    json: {
      row_number: linhaEncontrada,
      Skills: skillsStr
    }
  }];
}

// Para as outras ações, mantém o padrão
if (linhaEncontrada !== null) {
  let resultado = {
    row_number: linhaEncontrada
  };
  resultado[nomeColuna] = novoValor;
  return [{ json: resultado }];
}

// Caso não caia em nenhum dos casos acima, retorna erro
throw new Error('Ação não reconhecida ou parâmetros insuficientes');


//** */ Função para extrair o preço em BRL de um registro com múltiplas moedas
const items = $input.all();

return items.map(item => {
  const moeda = item.json.Currency.toLowerCase();
  const price = item.json[moeda] && item.json[moeda].brl ? item.json[moeda].brl : 0;

  return {
    json: {
      row_number: item.json.row_number,
      Price: price
    }
  };
});