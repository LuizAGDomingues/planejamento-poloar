const PIPEDRIVE_BASE_URL = process.env.PIPEDRIVE_BASE_URL || 'https://poloarbauru2.pipedrive.com/';
const PIPEDRIVE_API_TOKEN = process.env.PIPEDRIVE_API_TOKEN || '';

export type Deal = {
  id: number;
  title: string;
  value: number;
  status: string;
  [key: string]: any;
};

export async function verifyDeals(dealIds: number[]): Promise<Deal[]> {
  if (!dealIds.length) return [];
  
  const idsParam = dealIds.join(',');
  const url = `${PIPEDRIVE_BASE_URL}/api/v2/deals?ids=${idsParam}&api_token=${PIPEDRIVE_API_TOKEN}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error('Falha ao verificar negócios no Pipedrive');
    }
    
    return data.data;
  } catch (error) {
    console.error('Erro ao verificar negócios:', error);
    throw error;
  }
}

export function calculateTotalValue(deals: Deal[]): number {
  return deals.reduce((total, deal) => total + (deal.value || 0), 0);
} 