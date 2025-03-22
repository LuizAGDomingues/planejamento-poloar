import { PIPEDRIVE_STAGES, PIPEDRIVE_LABELS, PipedriveStage, PipedriveLabel, 
  isValidPipedriveStage, isValidPipedriveLabel, getPipedriveStageName, getPipedriveLabelName } from './constants';

const PIPEDRIVE_BASE_URL = process.env.PIPEDRIVE_BASE_URL || 'https://poloarbauru2.pipedrive.com/';
const PIPEDRIVE_API_TOKEN = process.env.PIPEDRIVE_API_TOKEN || '';

export type Deal = {
  id: number;
  title: string;
  value: number;
  status: string;
  stage_id?: number;
  label?: number;
  [key: string]: any;
};

export async function verifyDeals(dealIds: number[]): Promise<Deal[]> {
  if (!dealIds.length) return [];
  
  // Remover duplicatas
  const uniqueIds = [...new Set(dealIds)];
  let allDeals: Deal[] = [];
  
  // Dividir os IDs em lotes de no máximo 100 (limite da API do Pipedrive)
  const batchSize = 100;
  const batches = [];
  
  for (let i = 0; i < uniqueIds.length; i += batchSize) {
    batches.push(uniqueIds.slice(i, i + batchSize));
  }
  
  try {
    // Processar cada lote sequencialmente
    for (const batch of batches) {
      const idsParam = batch.join(',');
      const url = `${PIPEDRIVE_BASE_URL}/api/v2/deals?ids=${idsParam}&limit=500&api_token=${PIPEDRIVE_API_TOKEN}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (!data.success) {
        console.error('Falha ao verificar lote de negócios no Pipedrive:', data);
        continue; // Continuar para o próximo lote mesmo se houver falha
      }
      
      // Adicionar os deals deste lote ao resultado
      if (data.data && Array.isArray(data.data)) {
        allDeals = [...allDeals, ...data.data];
      }
    }
    
    return allDeals;
  } catch (error) {
    console.error('Erro ao verificar negócios:', error);
    throw error;
  }
}

export function calculateTotalValue(deals: Deal[]): number {
  return deals.reduce((total, deal) => total + (deal.value || 0), 0);
}

// Funções de verificação para etapas e etiquetas
export function getDealStageName(deal: Deal): string {
  return deal.stage_id && isValidPipedriveStage(deal.stage_id)
    ? getPipedriveStageName(deal.stage_id as PipedriveStage)
    : 'Etapa Desconhecida';
}

export function getDealLabelName(deal: Deal): string {
  return deal.label && isValidPipedriveLabel(deal.label)
    ? getPipedriveLabelName(deal.label as PipedriveLabel)
    : 'Sem Etiqueta';
}

// Funções de filtragem por etapa e etiqueta
export function filterDealsByStage(deals: Deal[], stageId: PipedriveStage): Deal[] {
  return deals.filter(deal => deal.stage_id === stageId);
}

export function filterDealsByLabel(deals: Deal[], labelId: PipedriveLabel): Deal[] {
  return deals.filter(deal => deal.label === labelId);
}

// Função para agrupar negócios por etapa
export function groupDealsByStage(deals: Deal[]): Record<string, Deal[]> {
  const result: Record<string, Deal[]> = {};
  
  // Inicializar todas as categorias com arrays vazios
  Object.entries(PIPEDRIVE_STAGES).forEach(([key, value]) => {
    result[getPipedriveStageName(value as PipedriveStage)] = [];
  });
  
  // Agrupar negócios por etapa
  deals.forEach(deal => {
    if (deal.stage_id && isValidPipedriveStage(deal.stage_id)) {
      const stageName = getPipedriveStageName(deal.stage_id as PipedriveStage);
      result[stageName].push(deal);
    }
  });
  
  return result;
}

// Função para agrupar negócios por etiqueta
export function groupDealsByLabel(deals: Deal[]): Record<string, Deal[]> {
  const result: Record<string, Deal[]> = {};
  
  // Inicializar todas as categorias com arrays vazios
  Object.entries(PIPEDRIVE_LABELS).forEach(([key, value]) => {
    result[getPipedriveLabelName(value as PipedriveLabel)] = [];
  });
  
  // Adicionar uma categoria "Sem Etiqueta"
  result['Sem Etiqueta'] = [];
  
  // Agrupar negócios por etiqueta
  deals.forEach(deal => {
    if (deal.label && isValidPipedriveLabel(deal.label)) {
      const labelName = getPipedriveLabelName(deal.label as PipedriveLabel);
      result[labelName].push(deal);
    } else {
      result['Sem Etiqueta'].push(deal);
    }
  });
  
  return result;
}

// Função para análise agregada de valores por etapa
export function analyzeValuesByStage(deals: Deal[]): Record<string, number> {
  const groupedDeals = groupDealsByStage(deals);
  const result: Record<string, number> = {};
  
  Object.entries(groupedDeals).forEach(([stageName, stageDeals]) => {
    result[stageName] = calculateTotalValue(stageDeals);
  });
  
  return result;
}

// Função para análise agregada de valores por etiqueta
export function analyzeValuesByLabel(deals: Deal[]): Record<string, number> {
  const groupedDeals = groupDealsByLabel(deals);
  const result: Record<string, number> = {};
  
  Object.entries(groupedDeals).forEach(([labelName, labelDeals]) => {
    result[labelName] = calculateTotalValue(labelDeals);
  });
  
  return result;
} 