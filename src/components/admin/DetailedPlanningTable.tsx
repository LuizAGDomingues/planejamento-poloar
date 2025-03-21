import React, { useState, useMemo, useEffect } from 'react';
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
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

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
  const [dateStart, setDateStart] = useState<string>('');
  const [dateEnd, setDateEnd] = useState<string>('');

  // Inicializar datas ao carregar o componente - data atual como padrão
  useEffect(() => {
    const today = new Date();
    const formattedToday = today.toISOString().split('T')[0];
    setDateStart(formattedToday);
    setDateEnd(formattedToday);
  }, []);

  // Lista de usuários para o filtro
  const userOptions = useMemo(() => {
    return ['all', ...Object.keys(plannings)];
  }, [plannings]);

  // Verificar se a data do planejamento está dentro do range selecionado
  const isPlanningInDateRange = (created_at: string) => {
    if (!created_at) return false;
    
    const creationDate = new Date(created_at);
    const creationDateStr = creationDate.toISOString().split('T')[0];
    
    // Filtro de datas
    if (dateStart && dateEnd) {
      return creationDateStr >= dateStart && creationDateStr <= dateEnd;
    }
    
    return true;
  };

  // Formatar nome do vendedor para exibição mais amigável
  const formatVendorName = (name: string) => {
    if (!name) return "";
    
    // Remove espaços extras
    name = name.trim();
    
    // Separa o nome em partes
    const nameParts = name.split(' ');
    
    // Capitaliza cada parte do nome
    const formattedParts = nameParts.map(part => {
      if (part.length === 0) return part;
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    });
    
    // Se o nome tiver mais de duas partes, mostra apenas o primeiro e último nome
    if (formattedParts.length > 2) {
      return `${formattedParts[0]} ${formattedParts[formattedParts.length - 1]}`;
    }
    
    // Caso contrário, retorna o nome completo formatado
    return formattedParts.join(' ');
  };

  // Filtrar os dados com base nos filtros selecionados, incluindo a data de criação
  const filteredData = useMemo(() => {
    const result: DetailedPlanningsByUser = {};
    
    // Primeiro filtramos por usuário
    const initialData = userFilter !== 'all' 
      ? plannings[userFilter] 
        ? { [userFilter]: plannings[userFilter] } 
        : {}
      : { ...plannings };
    
    // Depois filtramos por data de criação
    Object.entries(initialData).forEach(([userId, userData]) => {
      if (isPlanningInDateRange(userData.created_at)) {
        result[userId] = {
          ...userData,
          deals: [...userData.deals] // Fazemos uma cópia para evitar alterações no original
        };
      }
    });
    
    return result;
  }, [plannings, userFilter, dateStart, dateEnd]);

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

  // Preparar dados para exportação em formato tabular
  const prepareExportData = () => {
    const exportData: any[] = [];
    
    Object.entries(filteredData).forEach(([userId, userData]) => {
      const filteredDeals = getFilteredDeals(userData.deals);
      
      filteredDeals.forEach(item => {
        exportData.push({
          'Vendedor': formatVendorName(userData.userName),
          'Tipo': item.type === 'close' ? 'Fechamento' : 'Acompanhamento',
          'ID': item.deal.id,
          'Título': item.deal.title || 'Sem título',
          'Valor': item.deal.value ? Number(item.deal.value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00',
          'Etapa': getStageNameFromId(item.deal.stage_id),
          'Etiquetas': getLabelNamesFromIds(item.deal.label_ids),
          'Planejamento de': formatDate(userData.created_at),
          'Update': item.deal.update_time ? formatDate(item.deal.update_time) : 'N/A',
          'Resultado': getResultadoText(item.deal),
        });
      });
    });
    
    return exportData;
  };

  // Obter texto do resultado sem componentes React
  const getResultadoText = (deal: Deal): string => {
    const labelIds = deal.label_ids || [];
    
    if (labelIds.includes(22)) {
      return 'CANCELADO';
    }
    
    if (deal.stage_id === 5) {
      return 'FECHADO';
    }
    
    const recognizedLabels = labelIds.filter((id: number) => 
      Object.values(PIPEDRIVE_LABELS).includes(id as PipedriveLabel)
    );
    
    if (recognizedLabels.length > 0) {
      return getPipedriveLabelName(recognizedLabels[0] as PipedriveLabel) || 'Desconhecida';
    }
    
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
    
    return isUpdatedToday() ? 'FEITO' : 'NÃO FEITO';
  };

  // Exportar para Excel
  const exportToExcel = () => {
    const exportData = prepareExportData();
    
    if (exportData.length === 0) {
      alert('Não há dados para exportar com os filtros atuais.');
      return;
    }
    
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Planejamento Detalhado');
    
    // Adicionar data no nome do arquivo
    const hoje = new Date();
    const dataFormatada = hoje.toLocaleDateString('pt-BR').replace(/\//g, '-');
    
    // Converter para binário e fazer download
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, `Planejamento_Detalhado_${dataFormatada}.xlsx`);
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
    
    const labels = labelIds
      .map(id => {
        const labelValue = Object.values(PIPEDRIVE_LABELS).find(
          value => value === id
        ) as PipedriveLabel | undefined;
        
        return labelValue 
          ? getPipedriveLabelName(labelValue)
          : null;
      })
      .filter(Boolean);
    
    return labels.length > 0 ? labels.join(', ') : 'Sem etiquetas';
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
    
    // Se tiver etiquetas reconhecidas, mostrar a primeira
    const recognizedLabels = labelIds.filter((id: number) => 
      Object.values(PIPEDRIVE_LABELS).includes(id as PipedriveLabel)
    );
    
    if (recognizedLabels.length > 0) {
      const labelName = getPipedriveLabelName(recognizedLabels[0] as PipedriveLabel) || 'Desconhecida';
      return (
        <span className="inline-flex px-1.5 py-0.5 text-xxs font-medium rounded-full bg-blue-100 text-blue-800">
          {labelName}
        </span>
      );
    }
    
    // Se não tiver etiquetas reconhecidas, verificar update_time
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

  // Formatar data para exibição
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-3">
      <div className="bg-white p-3 rounded-lg shadow">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-base font-medium">Filtros</h3>
          <button
            onClick={exportToExcel}
            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Exportar para Excel
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          {/* Filtro de Data */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="dateStart" className="block text-xs font-medium text-gray-700 mb-1">
                Data Inicial
              </label>
              <input
                id="dateStart"
                type="date"
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={dateStart}
                onChange={(e) => setDateStart(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="dateEnd" className="block text-xs font-medium text-gray-700 mb-1">
                Data Final
              </label>
              <input
                id="dateEnd"
                type="date"
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={dateEnd}
                onChange={(e) => setDateEnd(e.target.value)}
              />
            </div>
          </div>
          
          {/* Filtro de Pesquisa */}
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
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
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
                  {formatVendorName(plannings[userName]?.userName || userName)}
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
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Planejamento de</th>
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
                        {formatVendorName(userData.userName)}
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
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                        {formatDate(userData.created_at)}
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
                  <td colSpan={9} className="px-3 py-2 text-center text-xs text-gray-500">
                    Nenhum planejamento encontrado com os filtros selecionados
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