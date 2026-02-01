"use client";

import { useState, useEffect } from "react";
import { tinyApi } from "@/lib/api";
import type { TinyContact, TinyProduct } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ExternalLink,
  RefreshCw,
  Search,
  Users,
  Package,
  CheckCircle,
  XCircle,
  Settings,
  Loader2,
  Save,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function TinyPage() {
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<{ apiToken: string; enabled: boolean; lastSync?: string } | null>(null);
  const [tokenInput, setTokenInput] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [savingToken, setSavingToken] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"unknown" | "connected" | "error">("unknown");

  const [contacts, setContacts] = useState<TinyContact[]>([]);
  const [products, setProducts] = useState<TinyProduct[]>([]);
  const [contactSearch, setContactSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Load config
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const data = await tinyApi.getConfig();
        setConfig(data);
        setTokenInput(data.apiToken || "");
      } catch (error) {
        console.error("Error loading config:", error);
      } finally {
        setLoading(false);
      }
    };
    loadConfig();
  }, []);

  // Save token
  const handleSaveToken = async () => {
    if (!tokenInput.trim()) {
      toast.error("Informe o token da API");
      return;
    }

    setSavingToken(true);
    try {
      await tinyApi.updateConfig(tokenInput);
      setConfig((prev) => prev ? { ...prev, apiToken: tokenInput } : { apiToken: tokenInput, enabled: true });
      toast.success("Token salvo com sucesso");
    } catch (error) {
      toast.error("Erro ao salvar token");
    } finally {
      setSavingToken(false);
    }
  };

  // Test connection
  const handleTestConnection = async () => {
    setTestingConnection(true);
    try {
      const result = await tinyApi.testConnection();
      if (result.data?.connected) {
        setConnectionStatus("connected");
        toast.success("Conexao estabelecida com sucesso!");
      } else {
        setConnectionStatus("error");
        toast.error("Falha na conexao com a Tiny");
      }
    } catch (error) {
      setConnectionStatus("error");
      toast.error("Erro ao testar conexao");
    } finally {
      setTestingConnection(false);
    }
  };

  // Load contacts
  const handleLoadContacts = async () => {
    setLoadingContacts(true);
    try {
      const result = await tinyApi.getContacts(contactSearch || undefined);
      setContacts(result.contatos || []);
    } catch (error) {
      toast.error("Erro ao carregar contatos");
    } finally {
      setLoadingContacts(false);
    }
  };

  // Load products
  const handleLoadProducts = async () => {
    setLoadingProducts(true);
    try {
      const result = await tinyApi.getProducts(productSearch || undefined);
      setProducts(result.produtos || []);
    } catch (error) {
      toast.error("Erro ao carregar produtos");
    } finally {
      setLoadingProducts(false);
    }
  };

  // Sync contacts
  const handleSyncContacts = async () => {
    setSyncing(true);
    try {
      const result = await tinyApi.syncContacts();
      toast.success(`${result.data?.synced || 0} contatos sincronizados`);
      handleLoadContacts();
    } catch (error) {
      toast.error("Erro ao sincronizar contatos");
    } finally {
      setSyncing(false);
    }
  };

  // Sync products
  const handleSyncProducts = async () => {
    setSyncing(true);
    try {
      const result = await tinyApi.syncProducts();
      toast.success(`${result.data?.synced || 0} produtos sincronizados`);
      handleLoadProducts();
    } catch (error) {
      toast.error("Erro ao sincronizar produtos");
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Integracao Tiny ERP</h1>
          <p className="text-muted-foreground">
            Gerencie a conexao com o Tiny ERP e sincronize dados
          </p>
        </div>
        <Badge
          variant={connectionStatus === "connected" ? "default" : connectionStatus === "error" ? "destructive" : "secondary"}
          className="gap-1"
        >
          {connectionStatus === "connected" ? (
            <>
              <CheckCircle className="h-3 w-3" />
              Conectado
            </>
          ) : connectionStatus === "error" ? (
            <>
              <XCircle className="h-3 w-3" />
              Erro
            </>
          ) : (
            "Nao testado"
          )}
        </Badge>
      </div>

      {/* Config Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuracao
          </CardTitle>
          <CardDescription>
            Configure o token de acesso a API do Tiny
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="token">Token da API</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="token"
                  type={showToken ? "text" : "password"}
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Cole seu token aqui..."
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Button onClick={handleSaveToken} disabled={savingToken}>
                {savingToken ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span className="ml-2">Salvar</span>
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={testingConnection || !tokenInput}
            >
              {testingConnection ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="mr-2 h-4 w-4" />
              )}
              Testar Conexao
            </Button>
            {config?.lastSync && (
              <span className="text-sm text-muted-foreground">
                Ultima sincronizacao: {new Date(config.lastSync).toLocaleString("pt-BR")}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Data Tabs */}
      <Tabs defaultValue="contacts">
        <TabsList>
          <TabsTrigger value="contacts" className="gap-2">
            <Users className="h-4 w-4" />
            Contatos
          </TabsTrigger>
          <TabsTrigger value="products" className="gap-2">
            <Package className="h-4 w-4" />
            Produtos
          </TabsTrigger>
        </TabsList>

        {/* Contacts Tab */}
        <TabsContent value="contacts" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Contatos do Tiny</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleSyncContacts} disabled={syncing}>
                    <RefreshCw className={cn("mr-2 h-4 w-4", syncing && "animate-spin")} />
                    Sincronizar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar contatos..."
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button onClick={handleLoadContacts} disabled={loadingContacts}>
                  {loadingContacts ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
                </Button>
              </div>

              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>CPF/CNPJ</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Cidade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingContacts ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        </TableRow>
                      ))
                    ) : contacts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          Nenhum contato encontrado. Clique em "Buscar" para carregar.
                        </TableCell>
                      </TableRow>
                    ) : (
                      contacts.map((contact) => (
                        <TableRow key={contact.id}>
                          <TableCell className="font-medium">
                            {contact.nome}
                            {contact.fantasia && (
                              <span className="text-xs text-muted-foreground block">
                                {contact.fantasia}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>{contact.cpf_cnpj || "-"}</TableCell>
                          <TableCell>{contact.email || "-"}</TableCell>
                          <TableCell>{contact.fone || contact.celular || "-"}</TableCell>
                          <TableCell>
                            {contact.cidade ? `${contact.cidade}/${contact.uf}` : "-"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Produtos do Tiny</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleSyncProducts} disabled={syncing}>
                    <RefreshCw className={cn("mr-2 h-4 w-4", syncing && "animate-spin")} />
                    Sincronizar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar produtos..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button onClick={handleLoadProducts} disabled={loadingProducts}>
                  {loadingProducts ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
                </Button>
              </div>

              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Codigo</TableHead>
                      <TableHead>Preco</TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead>Situacao</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingProducts ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        </TableRow>
                      ))
                    ) : products.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          Nenhum produto encontrado. Clique em "Buscar" para carregar.
                        </TableCell>
                      </TableRow>
                    ) : (
                      products.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.nome}</TableCell>
                          <TableCell>{product.codigo || "-"}</TableCell>
                          <TableCell>
                            {product.preco
                              ? new Intl.NumberFormat("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                }).format(Number(product.preco))
                              : "-"}
                          </TableCell>
                          <TableCell>{product.unidade || "-"}</TableCell>
                          <TableCell>
                            <Badge variant={product.situacao === "A" ? "default" : "secondary"}>
                              {product.situacao === "A" ? "Ativo" : "Inativo"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
