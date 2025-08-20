import React, { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Upload, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  Download, 
  Info, 
  X, 
  ArrowRight,
  ChevronRight
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Customer } from "@/types";
import { getContacts } from "@/lib/services/contactService";
import { 
  FieldMapping, 
  ImportResult, 
  importContacts, 
  validateFieldMappings 
} from "@/lib/services/importService";

// Propriedades do componente
interface ImportContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImportContactsModal({ isOpen, onClose }: ImportContactsModalProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estados para controlar o fluxo de importação
  const [activeTab, setActiveTab] = useState("upload");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<Array<Record<string, any>>>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [existingContacts, setExistingContacts] = useState<Customer[]>([]);
  const [mappingErrors, setMappingErrors] = useState<string[]>([]);
  
  // Campos disponíveis no sistema para mapeamento
  const availableFields = [
    { id: "name", label: "Nome", required: true },
    { id: "email", label: "E-mail", required: true },
    { id: "phone", label: "Telefone", required: false },
    { id: "company", label: "Empresa", required: false },
    { id: "personType", label: "Tipo de Pessoa", required: false },
    { id: "document", label: "CPF/CNPJ", required: false },
    { id: "zipCode", label: "CEP", required: false },
    { id: "city", label: "Cidade", required: false },
    { id: "state", label: "Estado", required: false },
    { id: "address", label: "Endereço", required: false },
    { id: "neighborhood", label: "Bairro", required: false },
    { id: "number", label: "Número", required: false },
  ];

  // Carregar contatos existentes ao abrir o modal
  useEffect(() => {
    if (isOpen) {
      loadExistingContacts();
    }
  }, [isOpen]);

  // Atualizar erros de mapeamento quando os mapeamentos mudarem
  useEffect(() => {
    if (fieldMappings.length > 0 && activeTab === "mapping") {
      const validation = validateFieldMappings(fieldMappings);
      setMappingErrors(validation.isValid ? [] : validation.errors);
    }
  }, [fieldMappings, activeTab]);

  // Função para carregar contatos existentes
  const loadExistingContacts = async () => {
    try {
      const contacts = await getContacts();
      setExistingContacts(contacts);
    } catch (error) {
      console.error("Erro ao carregar contatos existentes:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os contatos existentes.",
        variant: "destructive",
      });
    }
  };

  // Função para lidar com o upload de arquivo
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validar o tipo de arquivo
    const validTypes = [
      "text/csv", 
      "application/vnd.ms-excel", 
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ];
    
    if (!validTypes.includes(selectedFile.type)) {
      setFileError("Formato de arquivo inválido. Por favor, use CSV, XLS ou XLSX.");
      setFile(null);
      return;
    }

    // Validar o tamanho do arquivo (máximo 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setFileError("Arquivo muito grande. O tamanho máximo é 5MB.");
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setFileError(null);
    
    // Ler o arquivo para preview
    readFilePreview(selectedFile);
  };

  // Função para ler o arquivo e mostrar preview
  const readFilePreview = (file: File) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        
        // Processar CSV (simplificado)
        const lines = content.split('\n');
        const headers = lines[0].split(',').map(header => header.trim());
        
        // Extrair primeiras 5 linhas para preview
        const previewRows = [];
        for (let i = 1; i < Math.min(lines.length, 6); i++) {
          if (lines[i].trim()) {
            const values = lines[i].split(',').map(value => value.trim());
            const row: Record<string, any> = {};
            
            headers.forEach((header, index) => {
              row[header] = values[index] || '';
            });
            
            previewRows.push(row);
          }
        }
        
        setHeaders(headers);
        setPreviewData(previewRows);
        
        // Criar mapeamento inicial de campos
        const initialMappings: FieldMapping[] = headers.map(header => {
          // Tentar encontrar um campo correspondente
          const matchedField = availableFields.find(field => 
            field.label.toLowerCase() === header.toLowerCase() ||
            field.id.toLowerCase() === header.toLowerCase()
          );
          
          return {
            sourceField: header,
            targetField: matchedField ? matchedField.id : ""
          };
        });
        
        setFieldMappings(initialMappings);
        setActiveTab("mapping");
      } catch (error) {
        console.error("Erro ao processar arquivo:", error);
        setFileError("Não foi possível ler o arquivo. Verifique se o formato está correto.");
      }
    };
    
    reader.onerror = () => {
      setFileError("Erro ao ler o arquivo. Tente novamente.");
    };
    
    if (file.type === "text/csv") {
      reader.readAsText(file);
    } else {
      // Para arquivos Excel, precisaríamos de uma biblioteca como xlsx
      // Esta é uma implementação simplificada
      setFileError("Arquivos Excel serão suportados em breve. Por favor, use CSV por enquanto.");
    }
  };

  // Função para atualizar o mapeamento de campos
  const updateFieldMapping = (sourceField: string, targetField: string) => {
    setFieldMappings(prevMappings => {
      // Verificar se o mapeamento já está com o valor correto
      const existingMapping = prevMappings.find(m => m.sourceField === sourceField);
      if (existingMapping && existingMapping.targetField === targetField) {
        return prevMappings; // Não atualizar se o valor for o mesmo
      }
      
      // Caso contrário, atualizar o mapeamento
      return prevMappings.map(mapping => 
        mapping.sourceField === sourceField 
          ? { ...mapping, targetField } 
          : mapping
      );
    });
  };

  // Verificar se o mapeamento é válido
  const isMappingValid = () => {
    const validation = validateFieldMappings(fieldMappings);
    return validation.isValid;
  };

  // Função separada para validar e atualizar erros
  const validateAndUpdateErrors = () => {
    const validation = validateFieldMappings(fieldMappings);
    setMappingErrors(validation.isValid ? [] : validation.errors);
    return validation.isValid;
  };

  // Função para iniciar a importação
  const startImport = async () => {
    if (!file || !fieldMappings.length) return;
    
    // Validar o mapeamento de campos
    if (!validateAndUpdateErrors()) {
      return;
    }
    
    setIsProcessing(true);
    setProgress(0);
    setActiveTab("processing");
    
    try {
      // Simular progresso enquanto processa
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + 5;
          return newProgress >= 90 ? 90 : newProgress;
        });
      }, 300);
      
      // Processar a importação usando o serviço
      const result = await importContacts(file, fieldMappings, existingContacts);
      
      clearInterval(progressInterval);
      setProgress(100);
      setImportResult(result);
      setActiveTab("result");
      
      // Notificar o usuário
      if (result.imported > 0) {
        toast({
          title: "Importação concluída",
          description: `${result.imported} contatos foram importados com sucesso.`,
        });
      } else {
        toast({
          title: "Importação concluída",
          description: "Nenhum contato foi importado. Verifique os erros.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro na importação:", error);
      setFileError("Ocorreu um erro durante a importação. Tente novamente.");
      setActiveTab("upload");
      
      toast({
        title: "Erro na importação",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Função para baixar o modelo de planilha
  const downloadTemplate = () => {
    // Criar conteúdo CSV
    const headers = availableFields.map(field => field.label).join(',');
    const content = `${headers}\nJoão Silva,joao@exemplo.com,(11) 98765-4321,Empresa ABC,Física,123.456.789-00,01234-567,São Paulo,SP,Rua Exemplo,Centro,123`;
    
    // Criar blob e link para download
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modelo_importacao_contatos.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Função para baixar relatório de erros
  const downloadErrorReport = () => {
    if (!importResult || !importResult.errors.length) return;
    
    // Criar conteúdo CSV com erros
    const headers = Object.keys(importResult.errors[0].data).join(',') + ',Erro';
    const rows = importResult.errors.map(error => {
      const values = Object.values(error.data).join(',');
      return `${values},"${error.message}"`;
    }).join('\n');
    
    const content = `${headers}\n${rows}`;
    
    // Criar blob e link para download
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'erros_importacao_contatos.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Função para reiniciar o processo
  const resetImport = () => {
    setFile(null);
    setFileError(null);
    setPreviewData([]);
    setHeaders([]);
    setFieldMappings([]);
    setImportResult(null);
    setProgress(0);
    setMappingErrors([]);
    setActiveTab("upload");
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Função para fechar o modal
  const handleClose = () => {
    if (isProcessing) {
      // Confirmar se o usuário realmente quer cancelar
      if (window.confirm("A importação está em andamento. Deseja realmente cancelar?")) {
        resetImport();
        onClose();
      }
    } else {
      resetImport();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#0b4269]">Importar Contatos</DialogTitle>
          <DialogDescription>
            Importe seus contatos a partir de arquivos CSV ou Excel.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="upload" disabled={isProcessing}>
              1. Upload
            </TabsTrigger>
            <TabsTrigger 
              value="mapping" 
              disabled={!file || isProcessing}
            >
              2. Mapeamento
            </TabsTrigger>
            <TabsTrigger 
              value="processing" 
              disabled={!file || !isMappingValid() || isProcessing}
            >
              3. Processamento
            </TabsTrigger>
            <TabsTrigger 
              value="result" 
              disabled={!importResult}
            >
              4. Resultado
            </TabsTrigger>
          </TabsList>

          {/* Tab de Upload */}
          <TabsContent value="upload" className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div 
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors ${
                    fileError ? 'border-red-300' : 'border-gray-300'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".csv,.xls,.xlsx"
                    onChange={handleFileUpload}
                  />
                  
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    {file ? file.name : "Clique para selecionar um arquivo"}
                  </h3>
                  
                  <p className="mt-1 text-xs text-gray-500">
                    CSV, XLS ou XLSX até 5MB
                  </p>
                  
                  {file && (
                    <Badge variant="outline" className="mt-2">
                      {(file.size / 1024).toFixed(2)} KB
                    </Badge>
                  )}
                </div>
                
                {fileError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erro</AlertTitle>
                    <AlertDescription>{fileError}</AlertDescription>
                  </Alert>
                )}
              </div>
              
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-800 flex items-center">
                    <Info className="h-4 w-4 mr-2" />
                    Guia de Importação
                  </h3>
                  
                  <ol className="mt-2 text-sm text-blue-700 space-y-2 pl-5 list-decimal">
                    <li>Baixe o modelo de planilha para facilitar a importação</li>
                    <li>Preencha os dados dos seus contatos na planilha</li>
                    <li>Salve o arquivo em formato CSV ou Excel</li>
                    <li>Faça o upload do arquivo e mapeie os campos</li>
                    <li>Confirme a importação e aguarde o processamento</li>
                  </ol>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3 bg-white"
                    onClick={downloadTemplate}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Baixar Modelo de Planilha
                  </Button>
                </div>
                
                <div className="bg-amber-50 p-4 rounded-lg">
                  <h3 className="font-medium text-amber-800 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Dicas Importantes
                  </h3>
                  
                  <ul className="mt-2 text-sm text-amber-700 space-y-2 pl-5 list-disc">
                    <li>Remova linhas duplicadas antes de importar</li>
                    <li>Verifique se os e-mails estão no formato correto</li>
                    <li>Para telefones, use o formato (XX) XXXXX-XXXX</li>
                    <li>CPF/CNPJ podem conter pontuação</li>
                    <li>Não altere o cabeçalho da planilha modelo</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button 
                onClick={() => setActiveTab("mapping")} 
                disabled={!file}
                className="bg-[#21add6] hover:bg-[#1c9abf]"
              >
                Continuar
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          {/* Tab de Mapeamento */}
          <TabsContent value="mapping" className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Mapeamento de Campos</AlertTitle>
              <AlertDescription>
                Associe as colunas do seu arquivo aos campos do sistema. Campos obrigatórios: Nome e E-mail.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-4">
              <h3 className="font-medium">Pré-visualização dos Dados</h3>
              
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {headers.map((header, index) => (
                        <TableHead key={index}>{header}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {headers.map((header, colIndex) => (
                          <TableCell key={colIndex}>{row[header]}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <Separator />
              
              <h3 className="font-medium">Mapeamento de Campos</h3>
              
              <div className="grid grid-cols-2 gap-4">
                {fieldMappings.map((mapping, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-1/2">
                      <Label>Coluna do Arquivo</Label>
                      <Input value={mapping.sourceField} disabled />
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                    <div className="w-1/2">
                      <Label>Campo no Sistema</Label>
                      <Select
                        value={mapping.targetField}
                        onValueChange={(value) => updateFieldMapping(mapping.sourceField, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um campo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Ignorar este campo</SelectItem>
                          {availableFields.map((field) => (
                            <SelectItem key={field.id} value={field.id}>
                              {field.label} {field.required && <span className="text-red-500">*</span>}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
              
              <Alert variant={isMappingValid() ? "default" : "destructive"}>
                {isMappingValid() ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertTitle>Validação</AlertTitle>
                <AlertDescription>
                  {isMappingValid() 
                    ? "Mapeamento válido. Você pode prosseguir com a importação."
                    : mappingErrors.join(", ")}
                </AlertDescription>
              </Alert>
            </div>
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab("upload")}>
                Voltar
              </Button>
              <Button 
                onClick={startImport} 
                disabled={!isMappingValid()}
                className="bg-[#21add6] hover:bg-[#1c9abf]"
              >
                Iniciar Importação
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          {/* Tab de Processamento */}
          <TabsContent value="processing" className="space-y-4">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#21add6] mx-auto mb-4"></div>
              <h3 className="text-lg font-medium">Processando Importação</h3>
              <p className="text-sm text-gray-500 mt-2">
                Por favor, aguarde enquanto processamos seus contatos.
              </p>
              
              <div className="mt-6 space-y-2">
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-gray-500">{progress}% concluído</p>
              </div>
              
              <p className="mt-6 text-sm text-gray-500">
                Não feche esta janela até que o processo seja concluído.
              </p>
            </div>
          </TabsContent>

          {/* Tab de Resultado */}
          <TabsContent value="result" className="space-y-4">
            {importResult && (
              <div className="space-y-4">
                <Alert variant={importResult.imported > 0 ? "default" : "destructive"}>
                  {importResult.imported > 0 ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertTitle>Resultado da Importação</AlertTitle>
                  <AlertDescription>
                    {importResult.imported > 0 
                      ? `${importResult.imported} contatos foram importados com sucesso.`
                      : "Nenhum contato foi importado. Verifique os erros abaixo."}
                  </AlertDescription>
                </Alert>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <h4 className="text-green-800 font-medium">Importados</h4>
                    <p className="text-2xl font-bold text-green-700">{importResult.imported}</p>
                  </div>
                  
                  <div className="bg-amber-50 p-4 rounded-lg text-center">
                    <h4 className="text-amber-800 font-medium">Ignorados</h4>
                    <p className="text-2xl font-bold text-amber-700">{importResult.skipped}</p>
                  </div>
                  
                  <div className="bg-red-50 p-4 rounded-lg text-center">
                    <h4 className="text-red-800 font-medium">Erros</h4>
                    <p className="text-2xl font-bold text-red-700">{importResult.errors.length}</p>
                  </div>
                </div>
                
                {importResult.errors.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-medium">Detalhes dos Erros</h3>
                    
                    <div className="border rounded-lg overflow-x-auto max-h-60">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Linha</TableHead>
                            <TableHead>Erro</TableHead>
                            <TableHead>Dados</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {importResult.errors.map((error, index) => (
                            <TableRow key={index}>
                              <TableCell>{error.row}</TableCell>
                              <TableCell>{error.message}</TableCell>
                              <TableCell>
                                {Object.entries(error.data).map(([key, value]) => (
                                  <div key={key}>
                                    <span className="font-medium">{key}:</span> {value}
                                  </div>
                                ))}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={downloadErrorReport}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Baixar Relatório de Erros
                    </Button>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={resetImport}>
                Nova Importação
              </Button>
              <Button 
                onClick={handleClose}
                className="bg-[#21add6] hover:bg-[#1c9abf]"
              >
                Concluir
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          {activeTab !== "result" && activeTab !== "processing" && (
            <Button variant="outline" onClick={handleClose}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 