import { DatePickerDemo } from "@/components/ui/date-picker-demo";

export default function DatePickerDemoPage() {
  return (
    <div className="container py-10">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Demonstração do DatePickerWithRange</h1>
        <p className="text-center text-muted-foreground mb-8">
          Uma implementação avançada de seletor de intervalo de datas otimizado para o formato brasileiro
        </p>
        
        <DatePickerDemo />
        
        <div className="mt-12 bg-muted p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Documentação do Componente</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Propriedades</h3>
              <div className="mt-2 border rounded-md overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted-foreground/10">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">Propriedade</th>
                      <th className="px-4 py-2 text-left font-medium">Tipo</th>
                      <th className="px-4 py-2 text-left font-medium">Padrão</th>
                      <th className="px-4 py-2 text-left font-medium">Descrição</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr>
                      <td className="px-4 py-2 font-mono text-sm">date</td>
                      <td className="px-4 py-2 text-sm">DateRange | undefined</td>
                      <td className="px-4 py-2 text-sm">undefined</td>
                      <td className="px-4 py-2 text-sm">Objeto de intervalo de datas selecionado</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-mono text-sm">setDate</td>
                      <td className="px-4 py-2 text-sm">(date: DateRange) =&gt; void</td>
                      <td className="px-4 py-2 text-sm">-</td>
                      <td className="px-4 py-2 text-sm">Função para atualizar a data selecionada</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-mono text-sm">locale</td>
                      <td className="px-4 py-2 text-sm">Locale</td>
                      <td className="px-4 py-2 text-sm">ptBR</td>
                      <td className="px-4 py-2 text-sm">Configurações de localização</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-mono text-sm">disabled</td>
                      <td className="px-4 py-2 text-sm">boolean</td>
                      <td className="px-4 py-2 text-sm">false</td>
                      <td className="px-4 py-2 text-sm">Desativa o componente</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-mono text-sm">isLoading</td>
                      <td className="px-4 py-2 text-sm">boolean</td>
                      <td className="px-4 py-2 text-sm">false</td>
                      <td className="px-4 py-2 text-sm">Exibe estado de carregamento</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-mono text-sm">error</td>
                      <td className="px-4 py-2 text-sm">string</td>
                      <td className="px-4 py-2 text-sm">undefined</td>
                      <td className="px-4 py-2 text-sm">Mensagem de erro a ser exibida</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-mono text-sm">allowClear</td>
                      <td className="px-4 py-2 text-sm">boolean</td>
                      <td className="px-4 py-2 text-sm">true</td>
                      <td className="px-4 py-2 text-sm">Permite limpar a seleção</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-mono text-sm">showShortcuts</td>
                      <td className="px-4 py-2 text-sm">boolean</td>
                      <td className="px-4 py-2 text-sm">true</td>
                      <td className="px-4 py-2 text-sm">Mostra atalhos rápidos de datas</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-mono text-sm">onApply</td>
                      <td className="px-4 py-2 text-sm">(date: DateRange) =&gt; void</td>
                      <td className="px-4 py-2 text-sm">undefined</td>
                      <td className="px-4 py-2 text-sm">Callback quando aplicar a data</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-mono text-sm">label</td>
                      <td className="px-4 py-2 text-sm">string</td>
                      <td className="px-4 py-2 text-sm">"Selecionar período"</td>
                      <td className="px-4 py-2 text-sm">Texto do rótulo do campo</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-mono text-sm">placeholder</td>
                      <td className="px-4 py-2 text-sm">string</td>
                      <td className="px-4 py-2 text-sm">"Selecione um período"</td>
                      <td className="px-4 py-2 text-sm">Texto do placeholder</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 