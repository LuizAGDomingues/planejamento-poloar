import { useState } from 'react';
import * as XLSX from 'xlsx';
import Button from '@/components/ui/Button';

export default function ImportPlanning() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Por favor, selecione um arquivo Excel para importar.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Ler o arquivo Excel
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 'A' });

      // Verificar se o formato da planilha é válido
      if (!jsonData || jsonData.length < 2) {
        throw new Error('Formato de planilha inválido. Verifique o modelo.');
      }

      // Extrair dados
      const planningData = jsonData.slice(1).map((row: any) => ({
        consultor: row.A,
        ftas: String(row.B || '').split(/[,\s]+/).filter(Boolean),
        acompanhamento: String(row.C || '').split(/[,\s]+/).filter(Boolean),
      })).filter(item => item.consultor);

      // Enviar para a API
      const response = await fetch('/api/admin/import-planning', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planning: planningData }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Erro ao importar planilha');
      }

      setSuccess(`Importação concluída com sucesso! ${result.imported} registros importados.`);
      setFile(null);
      
      // Resetar o input de arquivo
      const fileInput = document.getElementById('planning-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
    } catch (err: any) {
      setError(err.message || 'Erro ao processar o arquivo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow mb-6">
      <h2 className="text-xl font-semibold mb-4">Importar Planejamento</h2>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
          <p className="text-green-700">{success}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Arquivo Excel (.xlsx)
          </label>
          <input
            id="planning-file"
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
            disabled={loading}
          />
          <p className="mt-1 text-sm text-gray-500">
            Formato esperado: Colunas Consultor, FTAs, Acompanhamento
          </p>
        </div>
        
        <div className="flex justify-end">
          <Button 
            type="submit"
            disabled={loading || !file}
          >
            {loading ? 'Processando...' : 'Importar Planilha'}
          </Button>
        </div>
      </form>
    </div>
  );
} 