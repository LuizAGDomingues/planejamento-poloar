import React from 'react';

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
};

interface DashboardTableProps {
  planningData: PlanningData[];
}

export default function DashboardTable({ planningData }: DashboardTableProps) {
  // Calcula os totais
  const totalCloseValue = planningData.reduce((total, item) => total + item.deal_value_close, 0);
  const totalFollowupValue = planningData.reduce((total, item) => total + item.deal_value_followup, 0);
  const totalPartnersCount = planningData.reduce((total, item) => total + item.partners_count, 0);

  // Formata valores monetários
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(value);
  };

  return (
    <div>
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
            {planningData.map((planning) => (
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
            
            {planningData.length === 0 && (
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
                {planningData.reduce((acc, item) => acc + item.deal_count_close, 0)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap font-bold">
                {formatCurrency(totalCloseValue)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap font-bold">
                {planningData.reduce((acc, item) => acc + item.deal_count_followup, 0)}
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