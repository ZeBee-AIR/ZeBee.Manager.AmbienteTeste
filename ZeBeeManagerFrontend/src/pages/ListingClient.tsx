import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, AlertCircle, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Filter, X, Trash2 } from 'lucide-react';
import { format, parseISO, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';
import api from '@/lib/api';

type ClientData = {
    id: number;
    seller_id: string;
    store_name: string;
    seller_email: string;
    status: 'Ativo' | 'Inativo';
    created_at: string; 
    monthly_data: { [year: string]: { [month: string]: { acos: string, tacos: string } } };
};

const ListingClient = () => {
    const [clients, setClients] = useState<ClientData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState('');
    
    const [statusFilter, setStatusFilter] = useState('todos');
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(20);

    const [clientToDelete, setClientToDelete] = useState<ClientData | null>(null);

    const fetchClients = async () => {
        setLoading(true);
        try {
            const response = await api.get('/clients/');
            setClients(response.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ocorreu um erro.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
        const searchParams = new URLSearchParams(window.location.search);
        setQuery(searchParams.get('q') || '');
    }, []);

    const handleClearFilters = () => {
        setStatusFilter('todos');
        setDateRange(undefined);
        setQuery('');
        window.history.pushState({}, '', window.location.pathname);
    };

    const handleDeleteClient = async () => {
        if (!clientToDelete) return;

        try {
            await api.delete(`/clients/${clientToDelete.id}/`);

            toast({
                title: "Sucesso!",
                description: `Cliente "${clientToDelete.store_name}" foi excluído.`,
            });
            
            setClients(prevClients => prevClients.filter(client => client.id !== clientToDelete.id));

        } catch (err) {
            toast({
                title: "Erro",
                description: err instanceof Error ? err.message : "Não foi possível excluir o cliente.",
                variant: "destructive",
            });
        } finally {
            setClientToDelete(null);
        }
    };

    const filteredClients = useMemo(() => {
        let processedClients = [...clients];
        if (query) {
            processedClients = processedClients.filter(c => c.store_name.toLowerCase().includes(query.toLowerCase()));
        }
        if (statusFilter !== 'todos') {
            processedClients = processedClients.filter(c => c.status === statusFilter);
        }
        if (dateRange?.from) {
            processedClients = processedClients.filter(c => parseISO(c.created_at) >= startOfDay(dateRange.from));
        }
        if (dateRange?.to) {
            processedClients = processedClients.filter(c => parseISO(c.created_at) <= endOfDay(dateRange.to));
        }
        processedClients.sort((a, b) => a.seller_id.localeCompare(b.seller_id));
        return processedClients;
    }, [query, clients, statusFilter, dateRange]);
    
    const pageCount = Math.ceil(filteredClients.length / pageSize);
    const paginatedClients = useMemo(() => {
        const start = pageIndex * pageSize;
        const end = start + pageSize;
        return filteredClients.slice(start, end);
    }, [filteredClients, pageIndex, pageSize]);

    const getLatestMetrics = (monthlyData: ClientData['monthly_data']) => {
        if (!monthlyData) return { acos: 'N/A', tacos: 'N/A' };
        const years = Object.keys(monthlyData).sort((a, b) => parseInt(b) - parseInt(a));
        for (const year of years) {
            const months = Object.keys(monthlyData[year]).sort((a,b) => new Date(`1 ${b} 2000`).getMonth() - new Date(`1 ${a} 2000`).getMonth());
            for (const month of months) {
                const data = monthlyData[year][month];
                if(data.acos || data.tacos) return { acos: data.acos || 'N/A', tacos: data.tacos || 'N/A'};
            }
        }
        return { acos: 'N/A', tacos: 'N/A' };
    }

    if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    if (error) return <div className="flex justify-center items-center h-screen text-destructive"><AlertCircle className="h-12 w-12 mr-4"/>{error}</div>;

    const filtersApplied = statusFilter !== 'todos' || dateRange?.from || query;

    return (
        <div className="min-h-screen bg-background p-4 sm:p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">{query ? `Resultados para "${query}"` : 'Lista de Clientes'}</h1>
                        <p className="text-sm text-muted-foreground">{filteredClients.length} cliente(s) encontrado(s).</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full sm:w-auto">
                                    <Filter className="mr-2 h-4 w-4" />
                                    Filtrar
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-100" align="end">
                                <div className="grid gap-4">
                                    <div className="space-y-2">
                                        <h4 className="font-medium leading-none">Filtros</h4>
                                        <p className="text-sm text-muted-foreground">Ajuste os filtros para a lista de clientes.</p>
                                    </div>
                                    <div className="grid gap-2">
                                        <div className="grid grid-cols-3 items-center gap-4">
                                            <Label htmlFor="status">Status</Label>
                                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                                <SelectTrigger id="status" className="col-span-2 h-8"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="todos">Todos</SelectItem>
                                                    <SelectItem value="Ativo">Ativo</SelectItem>
                                                    <SelectItem value="Inativo">Inativo</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid grid-cols-3 items-center gap-4">
                                            <Label htmlFor="date-range">Cadastrados:</Label>
                                            <div className="col-span-2">
                                                <Calendar id="date-range" mode="range" selected={dateRange} onSelect={setDateRange} locale={ptBR} className="p-0" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                        {filtersApplied && (
                            <Button variant="ghost" onClick={handleClearFilters} className="w-full sm:w-auto"><X className="mr-2 h-4 w-4" />Limpar</Button>
                        )}
                    </div>
                </div>

                <div className="hidden md:block rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">ID</TableHead>
                                <TableHead>Nome da Loja</TableHead>
                                <TableHead>E-mail</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right w-[100px]">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedClients.map(client => (
                                <TableRow key={client.id} className="hover:bg-muted/50">
                                    <TableCell className="font-medium">
                                        <Link to={`/registrar?id=${client.id}`} className="text-blue-500 hover:underline">{client.id}</Link>
                                    </TableCell>
                                    <TableCell>{client.store_name}</TableCell>
                                    <TableCell>{client.seller_email}</TableCell>
                                    <TableCell>
                                        <Badge variant={client.status === 'Ativo' ? 'default' : 'destructive'} className={cn(client.status === 'Ativo' ? 'bg-green-600' : 'bg-red-600', 'text-white')}>{client.status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => setClientToDelete(client)}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <div className="md:hidden grid grid-cols-1 gap-4">
                    {paginatedClients.map(client => (
                        <Card key={client.id} className="w-full">
                            <CardHeader>
                                <CardTitle className="flex justify-between items-start text-base">
                                    <Link to={`/registrar?id=${client.id}`} className="text-blue-500 hover:underline break-all pr-2">{client.store_name}</Link>
                                    <Badge variant={client.status === 'Ativo' ? 'default' : 'destructive'} className={cn(client.status === 'Ativo' ? 'bg-green-600' : 'bg-red-600', 'text-white flex-shrink-0')}>{client.status}</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <p><strong className="text-muted-foreground">ID:</strong> {client.seller_id}</p>
                                <p className="break-all"><strong className="text-muted-foreground">Email:</strong> {client.seller_email}</p>
                            </CardContent>
                            <CardFooter className="justify-end">
                                <Button variant="ghost" size="icon" onClick={() => setClientToDelete(client)}>
                                    <Trash2 className="h-5 w-5 text-red-500" />
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>

                {paginatedClients.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        Nenhum cliente corresponde aos filtros selecionados.
                    </div>
                )}

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
                    <div className="text-sm text-muted-foreground">
                        Exibindo {paginatedClients.length} de {filteredClients.length} cliente(s).
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">Itens por página</p>
                            <Select value={`${pageSize}`} onValueChange={(value) => { setPageSize(Number(value)); setPageIndex(0); }}>
                                <SelectTrigger className="h-8 w-[70px]"><SelectValue placeholder={`${pageSize}`} /></SelectTrigger>
                                <SelectContent side="top">
                                    {[20, 50, 100].map(size => (<SelectItem key={size} value={`${size}`}>{size}</SelectItem>))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" className="h-8 w-8 p-0" onClick={() => setPageIndex(0)} disabled={pageIndex === 0}><ChevronsLeft className="h-4 w-4" /></Button>
                            <Button variant="outline" className="h-8 w-8 p-0" onClick={() => setPageIndex(pageIndex - 1)} disabled={pageIndex === 0}><ChevronLeft className="h-4 w-4" /></Button>
                            <span className="text-sm font-medium">
                                Página {pageCount > 0 ? pageIndex + 1 : 0} de {pageCount}
                            </span>
                            <Button variant="outline" className="h-8 w-8 p-0" onClick={() => setPageIndex(pageIndex + 1)} disabled={pageIndex >= pageCount - 1}><ChevronRight className="h-4 w-4" /></Button>
                            <Button variant="outline" className="h-8 w-8 p-0" onClick={() => setPageIndex(pageCount - 1)} disabled={pageIndex >= pageCount - 1}><ChevronsRight className="h-4 w-4" /></Button>
                        </div>
                    </div>
                </div>

                <AlertDialog open={!!clientToDelete} onOpenChange={() => setClientToDelete(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                                Você confirma a exclusão do seguinte cliente: <strong className="text-foreground">{clientToDelete?.store_name}</strong>? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setClientToDelete(null)}>Não</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteClient} className={cn("bg-red-600 hover:bg-red-700")}>Sim</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

            </div>
        </div>
    );
};

export default ListingClient;
