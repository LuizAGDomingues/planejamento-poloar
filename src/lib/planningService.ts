import { Deal } from './pipedrive';

export type PlanningData = {
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

export type DetailedPlanningsByUser = Record<string, {
  userName: string;
  deals: {
    deal: Deal;
    type: 'close' | 'followup';
  }[];
}>;

/**
 * Processa os dados de planejamento para a visualização detalhada
 * Organiza os negócios por usuário
 */
export function processDetailedPlanningData(
  planningData: PlanningData[], 
  dealsMap: Record<number, Deal>
): DetailedPlanningsByUser {
  const result: DetailedPlanningsByUser = {};

  // Processa cada planejamento
  planningData.forEach(planning => {
    // Inicializa o objeto de usuário se não existir
    if (!result[planning.user_id]) {
      result[planning.user_id] = {
        userName: planning.nome,
        deals: []
      };
    }

    // Adiciona os negócios de fechamento
    planning.deal_ids_close.forEach(dealId => {
      const deal = dealsMap[dealId];
      if (deal) {
        result[planning.user_id].deals.push({
          deal,
          type: 'close'
        });
      }
    });

    // Adiciona os negócios de acompanhamento
    planning.deal_ids_followup.forEach(dealId => {
      const deal = dealsMap[dealId];
      if (deal) {
        result[planning.user_id].deals.push({
          deal,
          type: 'followup'
        });
      }
    });
  });

  return result;
} 