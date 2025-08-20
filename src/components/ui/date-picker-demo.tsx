import React, { useState } from "react";
import { DatePickerWithRange } from "./date-range-picker";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./card";
import { Button } from "./button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { Alert, AlertDescription, AlertTitle } from "./alert";
import { Badge } from "./badge";
import { ptBR } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { ArrowRight, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export function DatePickerDemo() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(),
    to: undefined,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleApply = (range: DateRange) => {
    toast.success("Período selecionado", {
      description: `${range.from?.toLocaleDateString("pt-BR")}${
        range.to ? ` até ${range.to.toLocaleDateString("pt-BR")}` : ""
      }`,
    });
  };

  const simulateLoading = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  const toggleError = () => {
    setHasError(!hasError);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Demonstração do DatePickerWithRange</CardTitle>
        <CardDescription>
          Componente de seleção de datas com suporte a intervalos e atalhos
          rápidos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="normal">
          <TabsList className="mb-4">
            <TabsTrigger value="normal">Normal</TabsTrigger>
            <TabsTrigger value="loading">Carregando</TabsTrigger>
            <TabsTrigger value="error">Erro</TabsTrigger>
            <TabsTrigger value="disabled">Desabilitado</TabsTrigger>
          </TabsList>

          <TabsContent value="normal" className="space-y-4">
            <DatePickerWithRange
              date={date}
              setDate={setDate}
              locale={ptBR}
              showShortcuts={true}
              onApply={handleApply}
              label="Período de análise"
              placeholder="Selecione um período para análise"
            />

            <div className="mt-4 p-4 bg-muted/50 rounded-md">
              <h3 className="text-sm font-medium mb-2">Estado atual:</h3>
              <pre className="text-xs">
                {JSON.stringify(
                  {
                    from: date?.from?.toLocaleDateString("pt-BR"),
                    to: date?.to?.toLocaleDateString("pt-BR"),
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          </TabsContent>

          <TabsContent value="loading">
            <DatePickerWithRange
              date={date}
              setDate={setDate}
              locale={ptBR}
              isLoading={isLoading}
              showShortcuts={true}
              label="Carregando dados..."
            />
            <Button onClick={simulateLoading} className="mt-4">
              Simular carregamento
            </Button>
          </TabsContent>

          <TabsContent value="error">
            <DatePickerWithRange
              date={date}
              setDate={setDate}
              locale={ptBR}
              error={hasError ? "Data inválida. Selecione um período válido." : undefined}
              showShortcuts={true}
              label="Período com erro"
            />
            <Button onClick={toggleError} variant="outline" className="mt-4">
              {hasError ? "Limpar erro" : "Mostrar erro"}
            </Button>
          </TabsContent>

          <TabsContent value="disabled">
            <DatePickerWithRange
              date={date}
              setDate={setDate}
              locale={ptBR}
              disabled={true}
              showShortcuts={true}
              label="Componente desabilitado"
            />
          </TabsContent>
        </Tabs>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Atenção</AlertTitle>
          <AlertDescription>
            Este componente está otimizado para o formato de data brasileiro (DD/MM/YYYY)
            e inclui atalhos contextuais.
          </AlertDescription>
        </Alert>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-2">
        <h3 className="text-sm font-medium">Intervalo selecionado:</h3>
        {date?.from ? (
          <Badge variant="secondary" className="text-sm px-3 py-1">
            {date.from.toLocaleDateString("pt-BR")}
            {date.to && (
              <>
                <ArrowRight className="mx-1 h-4 w-4 inline" />
                {date.to.toLocaleDateString("pt-BR")}
              </>
            )}
          </Badge>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhum período selecionado</p>
        )}
      </CardFooter>
    </Card>
  );
} 