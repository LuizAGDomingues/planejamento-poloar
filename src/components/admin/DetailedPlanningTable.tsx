import React, { useState, useMemo } from 'react';
import { Deal } from '@/lib/pipedrive';
import { 
  PIPEDRIVE_STAGES,
  PIPEDRIVE_LABELS,
  PipedriveStage,
  PipedriveLabel,
  getPipedriveStageName,
  getPipedriveLabelName
} from '@/lib/constants';
import { DetailedPlanningsByUser } from '@/lib/planningService';

type DetailedPlanningProps = {
  plannings: DetailedPlanningsByUser;
};

export default function DetailedPlanningTable({ plannings }: DetailedPlanningProps) {
  // Estados para filtros
  const [userFilter, setUserFilter] = useState<string>('all');
  const [stageFilter, setStageFilter] = useState<number | 'all'>('all');
  const [labelFilter, setLabelFilter] = useState<number | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'close' | 'followup'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Lista de usuários para o filtro
  const userOptions = useMemo(() => {
    return ['all', ...Object.keys(plannings)];
  }, [plannings]);

  // Filtrar os dados com base nos filtros selecionados
  const filteredData = useMemo(() => {
    const result = { ...plannings };
    
    // Se estiver filtrando por usuário específico
    if (userFilter !== 'all') {
      const filtered: Record<string, any> = {};
      if (result[userFilter]) {
        filtered[userFilter] = result[userFilter];
      }
      return filtered;
    }
    
    return result;
  }, [plannings, userFilter]);

  // Filtrar deals com base nos filtros selecionados
  const getFilteredDeals = (deals: { deal: Deal, type: 'close' | 'followup' }[]) => {
    return deals.filter(item => {
      // Filtro por tipo (fechamento ou acompanhamento)
      if (typeFilter !== 'all' && item.type !== typeFilter) {
        return false;
      }
      
      // Filtro por etapa
      if (stageFilter !== 'all' && item.deal.stage_id !== stageFilter) {
        return false;
      }
      
      // Filtro por etiqueta
      if (labelFilter !== 'all') {
        const dealLabels = item.deal.label_ids || [];
        if (!dealLabels.includes(labelFilter as number)) {
          return false;
        }
      }
      
      // Filtro por texto
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          item.deal.title?.toLowerCase().includes(searchLower) ||
          item.deal.id.toString().includes(searchLower)
        );
      }
      
      return true;
    });
  };

  // Verificar se etapa existe nas constantes
  const getStageNameFromId = (stageId?: number) => {
    if (!stageId) return 'Não especificada';
    
    const stageValue = Object.values(PIPEDRIVE_STAGES).find(
      value => value === stageId
    ) as PipedriveStage | undefined;
    
    return stageValue 
      ? getPipedriveStageName(stageValue)
      : `Desconhecida (${stageId})`;
  };

  // Obter etiquetas do negócio
  const getLabelNamesFromIds = (labelIds?: number[]) => {
    if (!labelIds || !labelIds.length) return 'Sem etiquetas';
    
    return labelIds
      .map(id => {
        const labelValue = Object.values(PIPEDRIVE_LABELS).find(
          value => value === id
        ) as PipedriveLabel | undefined;
        
        return labelValue 
          ? getPipedriveLabelName(labelValue)
          : null;
      })
      .filter(Boolean)
      .join(', ') || 'Etiquetas não reconhecidas';
  };

  // Analisar o resultado com base nas regras
  const getResultado = (deal: Deal) => {
    const labelIds = deal.label_ids || [];
    
    // Verificar se possui label 22 (CANCELADO)
    if (labelIds.includes(22)) {
      return (
        <span className="inline-flex px-1.5 py-0.5 text-xxs font-medium rounded-full bg-red-100 text-red-800">
          CANCELADO
        </span>
      );
    }
    
    // Verificar se está no stage 5 (FECHADO)
    if (deal.stage_id === 5) {
      return (
        <span className="inline-flex px-1.5 py-0.5 text-xxs font-medium rounded-full bg-green-100 text-green-800">
          FECHADO
        </span>
      );
    }
    
    // Se tiver etiquetas, mostrar a primeira
    if (labelIds.length > 0) {
      const labelName = getPipedriveLabelName(labelIds[0] as PipedriveLabel) || 'Desconhecida';
      return (
        <span className="inline-flex px-1.5 py-0.5 text-xxs font-medium rounded-full bg-blue-100 text-blue-800">
          {labelName}
        </span>
      );
    }
    
    // Se não tiver etiquetas, verificar update_time
    const isUpdatedToday = () => {
      if (!deal.update_time) return false;
      
      const updateDate = new Date(deal.update_time);
      const today = new Date();
      
      return (
        updateDate.getDate() === today.getDate() &&
        updateDate.getMonth() === today.getMonth() &&
        updateDate.getFullYear() === today.getFullYear()
      );
    };
    
    if (isUpdatedToday()) {
      return (
        <span className="inline-flex px-1.5 py-0.5 text-xxs font-medium rounded-full bg-indigo-100 text-indigo-800">
          FEITO
        </span>
      );
    } else {
      return (
        <span className="inline-flex px-1.5 py-0.5 text-xxs font-medium rounded-full bg-gray-100 text-gray-800">
          NÃO FEITO
        </span>
      );
    }
  };

  // Formatação de valor
  const formatCurrency = (value?: number) => {
    if (value === undefined) return 'R$ 0,00';
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-3">
      <div className="bg-white p-3 rounded-lg shadow">
        <h3 className="text-base font-medium mb-3">Filtros</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {/* Filtro de Usuário */}
          <div>
            <label htmlFor="userFilter" className="block text-xs font-medium text-gray-700 mb-1">Vendedor</label>
            <select
              id="userFilter"
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={userFilter}
              onChange={e => setUserFilter(e.target.value)}
            >
              <option value="all">Todos</option>
              {userOptions.filter(u => u !== 'all').map(userName => (
                <option key={userName} value={userName}>
                  {plannings[userName]?.userName || userName}
                </option>
              ))}
            </select>
          </div>
          
          {/* Filtro de Etapa */}
          <div>
            <label htmlFor="stageFilter" className="block text-xs font-medium text-gray-700 mb-1">Etapa</label>
            <select
              id="stageFilter"
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={stageFilter.toString()}
              onChange={e => setStageFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            >
              <option value="all">Todas</option>
              {Object.entries(PIPEDRIVE_STAGES).map(([key, value]) => (
                <option key={key} value={value}>
                  {getPipedriveStageName(value as PipedriveStage)}
                </option>
              ))}
            </select>
          </div>
          
          {/* Filtro de Etiqueta */}
          <div>
            <label htmlFor="labelFilter" className="block text-xs font-medium text-gray-700 mb-1">Etiqueta</label>
            <select
              id="labelFilter"
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={labelFilter.toString()}
              onChange={e => setLabelFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            >
              <option value="all">Todas</option>
              {Object.entries(PIPEDRIVE_LABELS).map(([key, value]) => (
                <option key={key} value={value}>
                  {getPipedriveLabelName(value as PipedriveLabel)}
                </option>
              ))}
            </select>
          </div>
          
          {/* Filtro de Tipo */}
          <div>
            <label htmlFor="typeFilter" className="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
            <select
              id="typeFilter"
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as 'all' | 'close' | 'followup')}
            >
              <option value="all">Todos</option>
              <option value="close">Fechamento</option>
              <option value="followup">Acompanhamento</option>
            </select>
          </div>
          
          {/* Pesquisa */}
          <div>
            <label htmlFor="searchTerm" className="block text-xs font-medium text-gray-700 mb-1">Pesquisar</label>
            <input
              id="searchTerm"
              type="text"
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Pesquisar por título ou ID"
            />
          </div>
        </div>
      </div>
      
      {/* Tabela Detalhada */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendedor</th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Etapa</th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Etiquetas</th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resultado</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(filteredData).map(([userId, userData]) => {
                const filteredDeals = getFilteredDeals(userData.deals);
                
                return filteredDeals.length > 0 ? (
                  filteredDeals.map((item, index) => (
                    <tr key={`${userId}-${item.deal.id}-${index}`}>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                        {userData.userName}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs">
                        <span className={`inline-flex px-1.5 py-0.5 text-xxs font-medium rounded-full ${
                          item.type === 'close' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {item.type === 'close' ? 'Fechamento' : 'Acompanhamento'}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                        {item.deal.id}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                        {item.deal.title || 'Sem título'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                        {formatCurrency(item.deal.value)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                        {getStageNameFromId(item.deal.stage_id)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                        {getLabelNamesFromIds(item.deal.label_ids)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs">
                        {getResultado(item.deal)}
                      </td>
                    </tr>
                  ))
                ) : null;
              })}
              
              {Object.keys(filteredData).length === 0 || Object.values(filteredData).every(userData => getFilteredDeals(userData.deals).length === 0) ? (
                <tr>
                  <td colSpan={8} className="px-3 py-2 text-center text-xs text-gray-500">
                    Nenhum negócio encontrado com os filtros selecionados
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 