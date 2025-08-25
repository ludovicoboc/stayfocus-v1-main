/**
 * Exemplos de teste para demonstrar o funcionamento das validações
 * Este arquivo serve como documentação e exemplo de uso
 */

import { 
  validateReceita, 
  validateMedicamento, 
  validateRegistroHumor, 
  validateDespesa,
  validateConcurso,
  validateSessaoEstudo,
  validateRegistroSono,
  validateAtividadeLazer,
  validateQuestao,
  validateItemListaCompras,
  validateData,
  DataValidator 
} from './validations'

// Exemplo de uso do DataValidator
export function exemploValidacaoPersonalizada() {
  const validator = new DataValidator()
  
  const resultado = validator.validateFields([
    { field: 'Nome', value: 'João Silva', rules: ['required', 'string', 'minLength:2', 'maxLength:100'] },
    { field: 'Email', value: 'joao@email.com', rules: ['required', 'email'] },
    { field: 'Idade', value: 25, rules: ['required', 'number', 'positive', 'max:120'] },
    { field: 'Data nascimento', value: '1998-05-15', rules: ['required', 'date'] },
  ])
}

const validations.testDefault = {
  exemploValidacaoPersonalizada,
  exemploValidacaoReceita,
  exemploValidacaoMedicamento,
  exemploValidacaoRegistroHumor,
  exemploValidacaoDespesa,
  exemploValidacaoConcurso,
  exemploValidacaoSessaoEstudo,
  exemploValidacaoRegistroSono,
  exemploValidacaoAtividadeLazer,
  exemploValidacaoQuestao,
  exemploValidacaoItemListaCompras,
  executarTodosExemplos,
  exemploTratamentoErros
};

export default validations.testDefault;
