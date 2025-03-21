export const PIPEDRIVE_STAGES = {
  POTENCIAL: 1,
  POTENCIAL_ATIVO: 74,
  FECHAMENTO: 5,
  PEDIDO_PARA_INSERIR: 126,
  PROPOSTA: 3,
  NEGOCIACAO: 4,
  PRE_PROPOSTA: 2,
} as const;

export const PIPEDRIVE_LABELS = {
  AGUARDANDO_APOIO: 369,
  SEGURAR_MAQUINA: 370,
  CANCELAR: 22,
  SEM_CONTATO_3: 270,
  SEM_CONTATO_2: 227,
  SEM_CONTATO_1: 89,
} as const;

// Tipos para facilitar o uso com TypeScript
export type PipedriveStage = typeof PIPEDRIVE_STAGES[keyof typeof PIPEDRIVE_STAGES];
export type PipedriveLabel = typeof PIPEDRIVE_LABELS[keyof typeof PIPEDRIVE_LABELS];

// Funções auxiliares para validação
export function isValidPipedriveStage(stage: number): boolean {
  return Object.values(PIPEDRIVE_STAGES).includes(stage as PipedriveStage);
}

export function isValidPipedriveLabel(label: number): boolean {
  return Object.values(PIPEDRIVE_LABELS).includes(label as PipedriveLabel);
}

// Funções para obter nomes das etapas e etiquetas
export function getPipedriveStageName(stage: PipedriveStage): string {
  const stageEntry = Object.entries(PIPEDRIVE_STAGES).find(([_, value]) => value === stage);
  return stageEntry ? formatConstantName(stageEntry[0]) : 'Desconhecido';
}

export function getPipedriveLabelName(label: PipedriveLabel): string {
  const labelEntry = Object.entries(PIPEDRIVE_LABELS).find(([_, value]) => value === label);
  return labelEntry ? formatConstantName(labelEntry[0]) : 'Desconhecido';
}

// Função auxiliar para formatar nomes das constantes
function formatConstantName(name: string): string {
  return name
    .toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
} 