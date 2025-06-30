import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Filter, X } from 'lucide-react';
import { format, parseISO, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';

// --- Tipos de Dados ---
type ClientData = {
    id: number;
    store_name: string;
    seller_email: string;
    status: 'Ativo' | 'Inativo';
    created_at: string; 
    monthly_data: { [year: string]: { [month: string]: { acos: string, tacos: string } } };
};

// Componente principal
const ListingClient = () => {
    const [clients, setClients] = useState<ClientData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState('');
    
    // --- Novos Estados de Filtro ---
    const [statusFilter, setStatusFilter] = useState('todos'); // 'todos', 'Ativo', 'Inativo'
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

    // --- Estados de Paginação ---
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(20);

    useEffect(() => {
        const fetchClients = async () => {
            try {
                const response = await fetch('http://127.0.0.1:8000/api/clients/');
                if (!response.ok) throw new Error('Falha ao buscar clientes.');
                setClients(await response.json());
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Ocorreu um erro.');
            } finally {
                setLoading(false);
            }
        };
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

    // --- Lógica de Filtro e Ordenação ---
    const filteredClients = useMemo(() => {
        let processedClients = [...clients];

        if (query) {
            processedClients = processedClients.filter(c => 
                c.store_name.toLowerCase().includes(query.toLowerCase())
            );
        }
        
        if (statusFilter !== 'todos') {
            processedClients = processedClients.filter(c => c.status === statusFilter);
        }

        if (dateRange?.from) {
            const startDate = startOfDay(dateRange.from);
            processedClients = processedClients.filter(c => parseISO(c.created_at) >= startDate);
        }
        if (dateRange?.to) {
            const endDate = endOfDay(dateRange.to);
            processedClients = processedClients.filter(c => parseISO(c.created_at) <= endDate);
        }
        
        processedClients.sort((a, b) => a.id - b.id);

        return processedClients;
    }, [query, clients, statusFilter, dateRange]);
    
    // --- Lógica de Paginação ---
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
    if (error) return <div className="flex justify-center items-center h-screen text-destructive"><AlertCircle className="h-12 w-12 mr-4"/> {error}</div>;

    const filtersApplied = statusFilter !== 'todos' || dateRange?.from || query;

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground mb-2">{query ? `Resultados para "${query}"` : 'Lista de Clientes'}</h1>
                        <p className="text-muted-foreground">{filteredClients.length} cliente(s) encontrado(s).</p>
                    </div>
                    
                    {/* --- BOTÃO DE FILTRO COM POPOVER --- */}
                    <div className="flex items-center gap-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline">
                                    <Filter className="mr-2 h-4 w-4" />
                                    Filtrar
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-100" align="end">
                                <div className="grid gap-4">
                                    <div className="space-y-2">
                                        <h4 className="font-medium leading-none">Filtros</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Ajuste os filtros para a lista de clientes.
                                        </p>
                                    </div>
                                    <div className="grid gap-2">
                                        <div className="grid grid-cols-3 items-center gap-4">
                                            <Label htmlFor="status">Status</Label>
                                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                                <SelectTrigger id="status" className="col-span-2 h-8">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="todos">Todos</SelectItem>
                                                    <SelectItem value="Ativo">Ativo</SelectItem>
                                                    <SelectItem value="Inativo">Inativo</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid grid-cols-3 items-center gap-4">
                                            <Label htmlFor="date-range">Cadastrados entre:</Label>
                                            <div className="col-span-2">
                                                <Calendar
                                                    id="date-range"
                                                    mode="range"
                                                    selected={dateRange}
                                                    onSelect={setDateRange}
                                                    locale={ptBR}
                                                    className="p-0"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                        {filtersApplied && (
                            <Button variant="ghost" onClick={handleClearFilters}>
                                <X className="mr-2 h-4 w-4" />
                                Limpar
                            </Button>
                        )}
                    </div>
                </div>

                <div className="rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px] border-r">ID</TableHead>
                                <TableHead>Nome da Loja</TableHead>
                                <TableHead>E-mail</TableHead>
                                <TableHead>ACOS (%)</TableHead>
                                <TableHead>TACOS (%)</TableHead>
                                <TableHead className="text-right border-l">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedClients.length > 0 ? (
                                paginatedClients.map(client => {
                                    const metrics = getLatestMetrics(client.monthly_data);
                                    return (
                                        <TableRow key={client.id} className="hover:bg-muted/50">
                                            <TableCell className="font-medium border-r">
                                                <Link to={`/registrar?id=${client.id}`} className="text-blue-500 hover:underline">{String(client.id).padStart(4, '0')}</Link>
                                            </TableCell>
                                            <TableCell>{client.store_name}</TableCell>
                                            <TableCell>{client.seller_email}</TableCell>
                                            <TableCell>{metrics.acos}</TableCell>
                                            <TableCell>{metrics.tacos}</TableCell>
                                            <TableCell className="text-right border-l">
                                                <Badge variant={client.status === 'Ativo' ? 'default' : 'destructive'} className={cn(client.status === 'Ativo' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700', 'text-white border-transparent')}>{client.status}</Badge>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            ) : (
                                <TableRow><TableCell colSpan={6} className="h-24 text-center">Nenhum cliente corresponde aos filtros selecionados.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                {/* Controles de Paginação */}
                <div className="flex items-center justify-between space-x-2 py-4">
                    <div className="flex-1 text-sm text-muted-foreground">
                        Exibindo {paginatedClients.length} de {filteredClients.length} cliente(s).
                    </div>
                    <div className="flex items-center space-x-6 lg:space-x-8">
                        <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium">Itens por página</p>
                            <Select value={`${pageSize}`} onValueChange={(value) => { setPageSize(Number(value)); setPageIndex(0); }}>
                                <SelectTrigger className="h-8 w-[70px]"><SelectValue placeholder={`${pageSize}`} /></SelectTrigger>
                                <SelectContent side="top">
                                    {[20, 50, 100].map(size => (<SelectItem key={size} value={`${size}`}>{size}</SelectItem>))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                            Página {pageCount > 0 ? pageIndex + 1 : 0} de {pageCount}
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button variant="outline" className="h-8 w-8 p-0" onClick={() => setPageIndex(0)} disabled={pageIndex === 0}><ChevronsLeft className="h-4 w-4" /></Button>
                            <Button variant="outline" className="h-8 w-8 p-0" onClick={() => setPageIndex(pageIndex - 1)} disabled={pageIndex === 0}><ChevronLeft className="h-4 w-4" /></Button>
                            <Button variant="outline" className="h-8 w-8 p-0" onClick={() => setPageIndex(pageIndex + 1)} disabled={pageIndex >= pageCount - 1}><ChevronRight className="h-4 w-4" /></Button>
                            <Button variant="outline" className="h-8 w-8 p-0" onClick={() => setPageIndex(pageCount - 1)} disabled={pageIndex >= pageCount - 1}><ChevronsRight className="h-4 w-4" /></Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ListingClient;
