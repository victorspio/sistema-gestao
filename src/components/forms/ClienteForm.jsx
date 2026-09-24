import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { clienteSchema } from '../../utils/schemas';

export default function ClienteForm({ onSubmit, initialData, isEditing }) {
  const [tipoPessoa, setTipoPessoa] = useState(initialData?.tipoPessoa || 'PF');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset
  } = useForm({
    resolver: zodResolver(clienteSchema),
    defaultValues: initialData || {
      tipoPessoa: 'PF',
      nome: '',
      razaoSocial: '',
      apelido: '',
      telefone: '',
      whatsapp: '',
      cpf: '',
      email: '',
      endereco: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      cep: '',
      observacoes: ''
    }
  });

  useEffect(() => {
    if (initialData?.tipoPessoa) {
      setTipoPessoa(initialData.tipoPessoa);
    }
  }, [initialData]);

  const handleTipoChange = (tipo) => {
    setTipoPessoa(tipo);
    setValue('tipoPessoa', tipo);
  };

  const handleFormSubmit = async (data) => {
    try {
      await onSubmit({ ...data, tipoPessoa });
      if (!isEditing) {
        reset();
      }
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Seletor Tipo de Pessoa */}
      <div className="flex items-center gap-4 bg-slate-100 dark:bg-slate-800 p-2 rounded-xl w-fit">
        <button
          type="button"
          onClick={() => handleTipoChange('PF')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
            tipoPessoa === 'PF'
              ? 'bg-cyan-500 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Pessoa Física (PF)
        </button>
        <button
          type="button"
          onClick={() => handleTipoChange('PJ')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
            tipoPessoa === 'PJ'
              ? 'bg-cyan-500 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Pessoa Jurídica (PJ)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nome / Razão Social */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            {tipoPessoa === 'PJ' ? 'Razão Social *' : 'Nome Completo *'}
          </label>
          <input
            type="text"
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-700 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
            placeholder={tipoPessoa === 'PJ' ? 'Ex: Tech Segurança Ltda' : 'Ex: João da Silva'}
            {...register('nome')}
          />
          {errors.nome && (
            <p className="mt-2 text-sm text-red-500">{errors.nome.message}</p>
          )}
        </div>

        {/* Nome Fantasia / Apelido */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            {tipoPessoa === 'PJ' ? 'Nome Fantasia' : 'Apelido / Como prefere ser chamado'}
          </label>
          <input
            type="text"
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-700 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
            placeholder={tipoPessoa === 'PJ' ? 'Ex: Tech Seg' : 'Ex: João'}
            {...register('apelido')}
          />
          {errors.apelido && (
            <p className="mt-1 text-sm text-red-600">{errors.apelido.message}</p>
          )}
        </div>

        {/* CPF / CNPJ */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            {tipoPessoa === 'PJ' ? 'CNPJ' : 'CPF'}
          </label>
          <input
            type="text"
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-700 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
            placeholder={tipoPessoa === 'PJ' ? '14 dígitos (apenas números)' : '11 dígitos (apenas números)'}
            maxLength={tipoPessoa === 'PJ' ? 14 : 11}
            {...register('cpf')}
          />
          {errors.cpf && (
            <p className="mt-1 text-sm text-red-600">{errors.cpf.message}</p>
          )}
        </div>

        {/* Telefone Principal */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Telefone Principal *
          </label>
          <input
            type="tel"
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-700 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
            placeholder="DDD + Número (apenas números)"
            {...register('telefone')}
          />
          {errors.telefone && (
            <p className="mt-1 text-sm text-red-600">{errors.telefone.message}</p>
          )}
        </div>

        {/* WhatsApp */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            WhatsApp
          </label>
          <input
            type="tel"
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-700 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
            placeholder="DDD + Número (apenas números)"
            {...register('whatsapp')}
          />
          {errors.whatsapp && (
            <p className="mt-1 text-sm text-red-600">{errors.whatsapp.message}</p>
          )}
        </div>

        {/* E-mail */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            E-mail
          </label>
          <input
            type="email"
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-700 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
            placeholder="exemplo@email.com"
            {...register('email')}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>
      </div>

      {/* Seção de Endereço / Local de Instalação */}
      <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-4">
          Endereço / Local de Atendimento
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Endereço */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Logradouro e Número
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-700 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
              placeholder="Rua, Avenida, Número"
              {...register('endereco')}
            />
            {errors.endereco && (
              <p className="mt-1 text-sm text-red-600">{errors.endereco.message}</p>
            )}
          </div>

          {/* Complemento */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Complemento
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-700 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
              placeholder="Apto, Sala, Bloco, Galpão"
              {...register('complemento')}
            />
            {errors.complemento && (
              <p className="mt-1 text-sm text-red-600">{errors.complemento.message}</p>
            )}
          </div>

          {/* Bairro */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Bairro
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-700 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
              placeholder="Nome do bairro"
              {...register('bairro')}
            />
            {errors.bairro && (
              <p className="mt-1 text-sm text-red-600">{errors.bairro.message}</p>
            )}
          </div>

          {/* Cidade */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Cidade
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-700 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
              placeholder="Cidade"
              {...register('cidade')}
            />
            {errors.cidade && (
              <p className="mt-1 text-sm text-red-600">{errors.cidade.message}</p>
            )}
          </div>

          {/* Estado */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Estado
            </label>
            <select
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
              {...register('estado')}
            >
              <option value="">Selecione o estado</option>
              <option value="AC">Acre</option>
              <option value="AL">Alagoas</option>
              <option value="AP">Amapá</option>
              <option value="AM">Amazonas</option>
              <option value="BA">Bahia</option>
              <option value="CE">Ceará</option>
              <option value="DF">Distrito Federal</option>
              <option value="ES">Espírito Santo</option>
              <option value="GO">Goiás</option>
              <option value="MA">Maranhão</option>
              <option value="MT">Mato Grosso</option>
              <option value="MS">Mato Grosso do Sul</option>
              <option value="MG">Minas Gerais</option>
              <option value="PA">Pará</option>
              <option value="PB">Paraíba</option>
              <option value="PR">Paraná</option>
              <option value="PE">Pernambuco</option>
              <option value="PI">Piauí</option>
              <option value="RJ">Rio de Janeiro</option>
              <option value="RN">Rio Grande do Norte</option>
              <option value="RS">Rio Grande do Sul</option>
              <option value="RO">Rondônia</option>
              <option value="RR">Roraima</option>
              <option value="SC">Santa Catarina</option>
              <option value="SP">São Paulo</option>
              <option value="SE">Sergipe</option>
              <option value="TO">Tocantins</option>
            </select>
            {errors.estado && (
              <p className="mt-1 text-sm text-red-600">{errors.estado.message}</p>
            )}
          </div>

          {/* CEP */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              CEP
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-700 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
              placeholder="00000-000"
              maxLength="9"
              {...register('cep')}
            />
            {errors.cep && (
              <p className="mt-1 text-sm text-red-600">{errors.cep.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Observações */}
      <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Observações / Informações Técnicas do Cliente
        </label>
        <textarea
          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-700 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 min-h-[100px]"
          placeholder="Ex: Horário de acesso para manutenção, portão eletrônico, síndico/responsável local..."
          {...register('observacoes')}
        />
        {errors.observacoes && (
          <p className="mt-1 text-sm text-red-600">{errors.observacoes.message}</p>
        )}
      </div>
      
      <div className="flex justify-end gap-4 pt-6 border-t border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={() => {
            reset();
            onSubmit(null);
          }}
          className="px-6 py-3 text-slate-600 dark:text-white bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl font-medium transition-all duration-200"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 active:bg-cyan-700 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow"
        >
          {isSubmitting ? 'Salvando...' : isEditing ? 'Atualizar Cliente' : 'Cadastrar Cliente'}
        </button>
      </div>
    </form>
  );
}