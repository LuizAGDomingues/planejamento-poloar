import React, { useState, useEffect, useMemo } from 'react';

type PlanningData = {
  id: string;
  nome: string;
  deal_count_close: number;
  deal_value_close: number;
  deal_count_followup: number;
  deal_value_followup: number;
  partners_count: number;
  deal_ids_close: number[];
  deal_ids_followup: number[];
  user_id: string;
  created_at: string;
};

interface DashboardTableProps {
  planningData: PlanningData[];
  initialDateStart?: string;
  initialDateEnd?: string;
  onDateChange?: (startDate: string, endDate: string) => void;
}

export default function DashboardTable({ 
  planningData, 
  initialDateStart, 
  initialDateEnd,
  onDateChange 
}: DashboardTableProps) {
  const [dateStart, setDateStart] = useState<string>('');
  const [dateEnd, setDateEnd] = useState<string>('');
  const [userFilter, setUserFilter] = useState<string>('all');

  // Inicializar datas ao carregar o componente - usar valores iniciais ou data atual como padrão
  useEffect(() => {
    if (initialDateStart && initialDateEnd) {
      setDateStart(initialDateStart);
      setDateEnd(initialDateEnd);
    } else {
      const today = new Date();
      const formattedToday = today.toISOString().split('T')[0];
      setDateStart(formattedToday);
      setDateEnd(formattedToday);
    }
  }, [initialDateStart, initialDateEnd]);

  // Notificar quando as datas mudam
  useEffect(() => {
    if (dateStart && dateEnd && onDateChange) {
      onDateChange(dateStart, dateEnd);
    }
  }, [dateStart, dateEnd, onDateChange]);

  // Lista única de usuários para o filtro
  const userOptions = useMemo(() => {
    const userMap = new Map<string, string>();
    
    planningData.forEach(item => {
      userMap.set(item.user_id, item.nome);
    });
    
    return [{ id: 'all', nome: 'Todos' }, ...Array.from(userMap.entries())
      .map(([id, nome]) => ({ id, nome }))
      .sort((a, b) => a.nome.localeCompare(b.nome))];
  }, [planningData]);

  // Verificar se a data do planejamento está dentro do range selecionado
  const isPlanningInDateRange = (created_at: string) => {
    if (!created_at) return false;
    
    const creationDate = new Date(created_at);
    const creationDateStr = creationDate.toISOString().split('T')[0];
    
    if (dateStart && dateEnd) {
      return creationDateStr >= dateStart && creationDateStr <= dateEnd;
    }
    
    return true;
  };

  // Filtrar dados por data e usuário
  const filteredData = useMemo(() => {
    return planningData.filter(item => {
      // Filtro de data
      if (!isPlanningInDateRange(item.created_at)) {
        return false;
      }
      
      // Filtro de usuário
      if (userFilter !== 'all' && item.user_id !== userFilter) {
        return false;
      }
      
      return true;
    });
  }, [planningData, dateStart, dateEnd, userFilter]);

  // Calcula os totais
  const totalCloseValue = filteredData.reduce((total, item) => total + item.deal_value_close, 0);
  const totalFollowupValue = filteredData.reduce((total, item) => total + item.deal_value_followup, 0);
  const totalPartnersCount = filteredData.reduce((total, item) => total + item.partners_count, 0);

  // Formata valores monetários
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(value);
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateStart(e.target.value);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateEnd(e.target.value);
  };

  return (
    <div>
      {/* Filtros */}
      <div className="bg-white p-3 rounded-lg shadow mb-6">
        <h3 className="text-base font-medium mb-3">Filtros</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Filtro de Data Inicial */}
          <div>
            <label htmlFor="dateStart" className="block text-xs font-medium text-gray-700 mb-1">
              Data Inicial
            </label>
            <input
              id="dateStart"
              type="date"
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={dateStart}
              onChange={handleStartDateChange}
            />
          </div>
          
          {/* Filtro de Data Final */}
          <div>
            <label htmlFor="dateEnd" className="block text-xs font-medium text-gray-700 mb-1">
              Data Final
            </label>
            <input
              id="dateEnd"
              type="date"
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={dateEnd}
              onChange={handleEndDateChange}
            />
          </div>
          
          {/* Filtro de Usuário */}
          <div>
            <label htmlFor="userFilter" className="block text-xs font-medium text-gray-700 mb-1">
              Vendedor
            </label>
            <select
              id="userFilter"
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
            >
              {userOptions.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.nome}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-red-600 mb-2">Fechamento</h3>
          <p className="text-3xl font-bold">{formatCurrency(totalCloseValue)}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-blue-600 mb-2">Acompanhamento</h3>
          <p className="text-3xl font-bold">{formatCurrency(totalFollowupValue)}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Total de Parceiros</h3>
          <p className="text-3xl font-bold">{totalPartnersCount}</p>
        </div>
      </div>

      {/* Tabela de Dados */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vendedor
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Negócios Fechamento
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valor Fechamento
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Negócios Acompanhamento
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valor Acompanhamento
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Parceiros
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredData.map((planning) => (
              <tr key={planning.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{planning.nome}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{planning.deal_count_close}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{formatCurrency(planning.deal_value_close)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{planning.deal_count_followup}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{formatCurrency(planning.deal_value_followup)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{planning.partners_count}</div>
                </td>
              </tr>
            ))}
            
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                  Nenhum dado disponível
                </td>
              </tr>
            )}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td className="px-6 py-4 whitespace-nowrap font-bold">
                Total
              </td>
              <td className="px-6 py-4 whitespace-nowrap font-bold">
                {filteredData.reduce((acc, item) => acc + item.deal_count_close, 0)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap font-bold">
                {formatCurrency(totalCloseValue)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap font-bold">
                {filteredData.reduce((acc, item) => acc + item.deal_count_followup, 0)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap font-bold">
                {formatCurrency(totalFollowupValue)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap font-bold">
                {totalPartnersCount}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
} 