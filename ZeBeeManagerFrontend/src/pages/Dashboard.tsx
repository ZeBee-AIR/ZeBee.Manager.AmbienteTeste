import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Users, TrendingDown, DollarSign, Target, CalendarIcon, Loader2, AlertCircle, TrendingUp, UserPlus, HelpCircle, X, Award } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format, getYear, isWithinInterval, startOfMonth, endOfMonth, eachMonthOfInterval, parseISO, subMonths, startOfYear, endOfYear, differenceInMonths } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { Tooltip as ShadTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import api from '@/lib/api';

interface Squad {
    id: number;
    name: string;
}

interface MonthlyPerformanceData {
    revenue?: string;
    acos?: string;
    tacos?: string;
    waiveCommission?: boolean;
    waiveMonthlyFee?: boolean;
}

interface ClientData {
    id: number;
    squad: number;
    seller_id: string;
    store_name: string;
    seller_email: string;
    phone_number: string | null;
    plan_value: string;
    client_commission_percentage: string;
    has_special_commission: boolean;
    special_commission_threshold: string | null;
    monthly_data: { [year: string]: { [month: string]: MonthlyPerformanceData } };
    status: 'Ativo' | 'Inativo';
    created_at: string;
    status_changed_at: string | null;
}

const ChurnDetailsModal = ({ clients, onClose }: { clients: ClientData[], onClose: () => void }) => (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
        <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col bg-card">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Clientes em Churn no Período</CardTitle>
                <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="h-6 w-6" />
                </Button>
            </CardHeader>
            <CardContent className="flex-grow overflow-y-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Nome da Loja</TableHead>
                            <TableHead>E-mail</TableHead>
                            <TableHead>Telefone</TableHead>
                            <TableHead>Data do Churn</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {clients.map(client => (
                            <TableRow key={client.id}>
                                <TableCell>{client.seller_id}</TableCell>
                                <TableCell>{client.store_name}</TableCell>
                                <TableCell>{client.seller_email}</TableCell>
                                <TableCell>{client.phone_number || 'N/A'}</TableCell>
                                <TableCell>{client.status_changed_at ? format(parseISO(client.status_changed_at), 'dd/MM/yyyy') : 'N/A'}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
);


const Dashboard = () => {
    const [clients, setClients] = useState<ClientData[]>([]);
    const [squads, setSquads] = useState<Squad[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfMonth(new Date()),
        to: (new Date()),
    });

    const [selectedYearInitial, setSelectedYearInitial] = useState(new Date().getFullYear());
    const [selectedYearEnd, setSelectedYearEnd] = useState(new Date().getFullYear());
    const availableYearsInitial = Array.from({ length: new Date().getFullYear() - 2009 }, (_, i) => new Date().getFullYear() - i);
    const availableYearsEnd = availableYearsInitial.filter(y => y >= selectedYearInitial);

    useEffect(() => {
        if (selectedYearEnd < selectedYearInitial) {
            setSelectedYearEnd(selectedYearInitial);
        }
    }, [selectedYearInitial, selectedYearEnd]);


    const [isChurnModalOpen, setIsChurnModalOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [clientsRes, squadsRes] = await Promise.all([
                    api.get('/clients/'),
                    api.get('/squads/')
                ]);
                setClients(clientsRes.data);
                setSquads(squadsRes.data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const businessLogic = useMemo(() => {
        if (!clients.length || !squads.length || !dateRange?.from) {
            return {
                totalActiveClients: 0, newClientsInPeriod: 0, cancelledClientsInPeriod: 0,
                totalChurnRevenueLoss: 0, totalRevenue: 0, totalCommission: 0, totalRevenueComission: 0,
                squadRevenueData: [], activeClientsBySquadData: [], squadAcquisitionChurnData: [],
                churnRate: 0, lifetimeValue: 0,
                churnedClientsDetails: []
            };
        }

        const interval = { start: dateRange.from, end: dateRange.to || dateRange.from };

        const activeClientsNow = clients.filter(c => c.status === 'Ativo');
        const newClientsInPeriodArray = clients.filter(c => isWithinInterval(parseISO(c.created_at), interval));
        const newClientsInPeriod = newClientsInPeriodArray.length;
        const clientsCancelledInPeriod = clients.filter(c => c.status === 'Inativo' && c.status_changed_at && isWithinInterval(parseISO(c.status_changed_at), interval));
        const totalChurnRevenueLoss = clientsCancelledInPeriod.reduce((sum, c) => sum + parseFloat(c.plan_value || '0'), 0);

        const churnRate = activeClientsNow.length > 0 ? (clientsCancelledInPeriod.length / activeClientsNow.length) * 100 : 0;

        const totalLifespanInMonths = clients.reduce((total, client) => {
            const startDate = parseISO(client.created_at);
            const endDate = client.status === 'Inativo' && client.status_changed_at
                ? parseISO(client.status_changed_at)
                : new Date();
            return total + differenceInMonths(endDate, startDate);
        }, 0);
        const averageClientLifespan = clients.length > 0 ? totalLifespanInMonths / clients.length : 0;
        const totalActiveRecurrenceValue = activeClientsNow.reduce((sum, c) => sum + parseFloat(c.plan_value || '0'), 0);
        const averageRecurrenceValue = activeClientsNow.length > 0 ? totalActiveRecurrenceValue / activeClientsNow.length : 0;
        const monthsInRange = differenceInMonths(interval.end, interval.start) + 1;
        const averageNewClientsFrequency = monthsInRange > 0 ? newClientsInPeriod / monthsInRange : 0;
        const lifetimeValue = averageRecurrenceValue * averageNewClientsFrequency * averageClientLifespan;

        const entries = newClientsInPeriodArray.reduce((sum, c) => sum + parseFloat(c.plan_value || '0'), 0);

        const squadNameMap = new Map(squads.map(s => [s.id, s.name]));

        const monthsInInterval = eachMonthOfInterval(interval);
        let totalRecurrenceForPeriod = 0;
        let totalCommissionForPeriod = 0;
        
        monthsInInterval.forEach(monthDate => {
            clients.forEach(client => {
                const createdAt = parseISO(client.created_at);
                const statusChangedAt = client.status_changed_at ? parseISO(client.status_changed_at) : null;
                const wasActiveInMonth = createdAt <= endOfMonth(monthDate) && (!statusChangedAt || statusChangedAt > startOfMonth(monthDate));
                
                const yearKey = getYear(monthDate).toString();
                const monthKey = format(monthDate, 'MMMM', { locale: enUS }).toLowerCase();
                const monthData = client.monthly_data?.[yearKey]?.[monthKey];

                if (wasActiveInMonth && !monthData?.waiveMonthlyFee) {
                    totalRecurrenceForPeriod += parseFloat(client.plan_value || '0');
                }

                if (monthData && !monthData.waiveCommission) {
                    const revenue = parseFloat(monthData.revenue || '0');
                    if (revenue > 0) {
                        const commissionPercentage = parseFloat(client.client_commission_percentage || '0') / 100;
                        const hasSpecial = client.has_special_commission;
                        const threshold = parseFloat(client.special_commission_threshold || '0');
                        let revenueComission = 0;
                        let isCommissionable = false;

                        if (hasSpecial && revenue > threshold) {
                            revenueComission = revenue - threshold; 
                            isCommissionable = true;
                        } else if (!hasSpecial) {
                            revenueComission = revenue;
                            isCommissionable = true;
                        }

                        if (isCommissionable) {
                            totalCommissionForPeriod += revenueComission * commissionPercentage || 0;
                        }
                    }
                }
            });
        });

        const squadMetrics = new Map(squads.map(s => [s.id, { revenue: 0, activeClients: 0, newClients: 0, churns: 0 }]));
        clients.forEach(client => {
            if (!client.squad) return;
            const squadPerf = squadMetrics.get(client.squad);
            if (squadPerf) {
                if (client.status === 'Ativo') {
                    squadPerf.activeClients += 1;
                    squadPerf.revenue += parseFloat(client.plan_value || '0');
                }
                if (isWithinInterval(parseISO(client.created_at), interval)) squadPerf.newClients += 1;
                if (client.status === 'Inativo' && client.status_changed_at && isWithinInterval(parseISO(client.status_changed_at), interval)) squadPerf.churns += 1;
            }
        });
    
        const squadRevenueData = Array.from(squadMetrics.entries()).map(([id, data]) => ({ name: squadNameMap.get(id) || 'N/A', revenue: data.revenue }));
        const activeClientsBySquadData = Array.from(squadMetrics.entries()).map(([id, data]) => ({ name: squadNameMap.get(id) || 'N/A', value: data.activeClients }));
        const squadAcquisitionChurnData = Array.from(squadMetrics.entries()).map(([id, data]) => ({ name: squadNameMap.get(id) || 'N/A', newClients: data.newClients, churns: data.churns }));

        return {
            totalActiveClients: activeClientsNow.length,
            newClientsInPeriod,
            cancelledClientsInPeriod: clientsCancelledInPeriod.length,
            totalChurnRevenueLoss,
            totalRevenue: totalRecurrenceForPeriod,
            totalRevenueComission: totalRecurrenceForPeriod + totalCommissionForPeriod,
            totalCommission: totalCommissionForPeriod,
            squadRevenueData,
            activeClientsBySquadData,
            squadAcquisitionChurnData,
            churnRate,
            lifetimeValue,
            entries,
            churnedClientsDetails: clientsCancelledInPeriod
        };
    }, [clients, squads, dateRange]);

    const historicalChartData = useMemo(() => {
        if (!clients.length) return [];

        const startDate = startOfYear(new Date(selectedYearInitial, 0, 1));
        const endDate = endOfYear(new Date(selectedYearEnd, 11, 31));
        const monthsInInterval = eachMonthOfInterval({ start: startDate, end: endDate });

        const data: { month: string; revenue: number; commission: number; churn: number }[] = [];

        monthsInInterval.forEach(monthDate => {
            let recurrenceForThisMonth = 0;
            let commissionForThisMonth = 0;
            let churnForThisMonth = 0;
            const yearKey = getYear(monthDate).toString();
            const monthKey = format(monthDate, 'MMMM', { locale: enUS }).toLowerCase();
    
            clients.forEach(client => {
                const createdAt = parseISO(client.created_at);
                const statusChangedAt = client.status_changed_at ? parseISO(client.status_changed_at) : null;
                const wasActiveInMonth = createdAt <= endOfMonth(monthDate) && (!statusChangedAt || statusChangedAt > startOfMonth(monthDate));

                const monthData = client.monthly_data?.[yearKey]?.[monthKey];

                if (client.status === 'Inativo' && client.status_changed_at && isWithinInterval(parseISO(client.status_changed_at), { start: startOfMonth(monthDate), end: endOfMonth(monthDate) })) {
                    churnForThisMonth += parseFloat(client.plan_value || '0');
                }

                if (wasActiveInMonth && !monthData?.waiveMonthlyFee) {
                    recurrenceForThisMonth += parseFloat(client.plan_value || '0');
                }

                if (monthData && !monthData.waiveCommission) {
                    const revenue = parseFloat(monthData.revenue || '0');
                    if (revenue > 0) {
                        const commissionPercentage = parseFloat(client.client_commission_percentage || '0') / 100;
                        const hasSpecial = client.has_special_commission;
                        const threshold = parseFloat(client.special_commission_threshold || '0');
                        let revenueComission = 0;
                        let isCommissionable = false;

                        if (hasSpecial) {
                            if (revenue > threshold) {
                                revenueComission = revenue - threshold; 
                                isCommissionable = true;
                            }
                        } else {
                            revenueComission = revenue;
                            isCommissionable = true;
                        }

                        if (isCommissionable) {
                            commissionForThisMonth += revenueComission * commissionPercentage || 0;
                        }
                    }
                }
            });

            data.push({
                month: format(monthDate, 'MMM/yy', { locale: ptBR }),
                revenue: recurrenceForThisMonth,
                commission: commissionForThisMonth,
                churn: churnForThisMonth
            });
        });

        return data;

    }, [clients, selectedYearInitial, selectedYearEnd]);


    if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    if (error) return <div className="flex justify-center items-center h-screen text-destructive"><AlertCircle className="h-12 w-12 mr-4"/> {error}</div>;

    const COLORS = ['#10B981', '#F59E0B', '#3B82F6', '#EF4444', '#8B5CF6'];

    return (
        <div className="min-h-screen p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary via-secondary-foreground to-primary hover:from-tertiary hover:via-primary hover:to-tertiary bg-clip-text text-transparent bg-[length:400%_100%] transition-all duration-500 cursor-pointer" style={{animation: 'cyanDrift 4s ease-in-out infinite'}} onMouseEnter={(e) => {e.target.style.animation = 'cyanHoverWave 1.5s ease-in-out infinite';}} onMouseLeave={(e) => {e.target.style.animation = 'cyanDrift 4s ease-in-out infinite';}}>Dashboard de Gerenciamento</h1>
                        <p className="text-[#AAA]">Monitore o desempenho de seus contratos e squads.</p>
                    </div>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant={"outline"} className={cn("w-[280px] justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateRange?.from ? (dateRange.to ? <>{format(dateRange.from, "LLL dd, y", { locale: ptBR })} - {format(dateRange.to, "LLL dd, y", { locale: ptBR })}</> : format(dateRange.from, "LLL dd, y", { locale: ptBR })) : (<span>Selecione um período</span>)}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2} locale={ptBR} />
                        </PopoverContent>
                    </Popover>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6 mb-8">
                    <Card className="relative bg-white/5 hover:bg-white/8 backdrop-blur-md border border-white/10 hover:border-secondary shadow-lg hover:shadow-2xl hover:shadow-secondary/30 rounded-2xl overflow-hidden transition-all duration-500 group">
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-transparent group-hover:from-secondary/8 group-hover:via-transparent group-hover:to-secondary/12 pointer-events-none transition-all duration-500"></div>
                        <div className="relative z-10">
                            <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-white">Clientes Ativos</CardTitle><Users className="h-4 w-4 text-secondary" /></CardHeader>
                            <CardContent><div className="text-2xl font-bold text-white">{businessLogic.totalActiveClients}</div><p className="text-xs text-[#AAA] text-green-400">+{businessLogic.newClientsInPeriod} novos no período</p></CardContent>
                        </div>
                    </Card>
                    <Card className="relative bg-white/5 hover:bg-white/8 backdrop-blur-md border border-white/10 hover:border-secondary shadow-lg hover:shadow-2xl hover:shadow-secondary/30 rounded-2xl overflow-hidden transition-all duration-500 group">
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-transparent group-hover:from-secondary/8 group-hover:via-transparent group-hover:to-secondary/12 pointer-events-none transition-all duration-500"></div>
                        <div className="relative z-10">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-white">Cancelamentos</CardTitle>
                                <div className="flex items-center gap-2">
                                    <TrendingDown className="h-4 w-4 text-red-400" />
                                    <TooltipProvider>
                                        <ShadTooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-secondary/20 transition-all duration-300" onClick={() => setIsChurnModalOpen(true)}>
                                                    <HelpCircle className="h-4 w-4 text-secondary" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent><p>Clique aqui para receber os detalhes.</p></TooltipContent>
                                        </ShadTooltip>
                                    </TooltipProvider>
                                </div>
                            </CardHeader>
                            <CardContent><div className="text-2xl font-bold text-white">{businessLogic.cancelledClientsInPeriod}</div><p className="text-xs text-[#AAA] text-red-400">No período selecionado</p></CardContent>
                        </div>
                    </Card>
                    <Card className="relative bg-white/5 hover:bg-white/8 backdrop-blur-md border border-white/10 hover:border-secondary shadow-lg hover:shadow-2xl hover:shadow-secondary/30 rounded-2xl overflow-hidden transition-all duration-500 group">
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-transparent group-hover:from-secondary/8 group-hover:via-transparent group-hover:to-secondary/12 pointer-events-none transition-all duration-500"></div>
                        <div className="relative z-10">
                            <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-white">Perdas (Churn)</CardTitle><DollarSign className="h-4 w-4 text-red-400" /></CardHeader>
                            <CardContent><div className="text-2xl font-bold text-white">R$ {businessLogic.totalChurnRevenueLoss.toLocaleString('pt-BR')}</div><p className="text-xs text-[#AAA] text-red-400">Com base no plano</p></CardContent>
                        </div>
                    </Card>
                    <Card className="relative bg-white/5 hover:bg-white/8 backdrop-blur-md border border-white/10 hover:border-secondary shadow-lg hover:shadow-2xl hover:shadow-secondary/30 rounded-2xl overflow-hidden transition-all duration-500 group">
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-transparent group-hover:from-secondary/8 group-hover:via-transparent group-hover:to-secondary/12 pointer-events-none transition-all duration-500">
                        </div>
                        <div className="relative z-10">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-white">
                                    Churn Rate
                                </CardTitle>
                                <TrendingDown className="h-4 w-4 text-red-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-white">
                                    {businessLogic.churnRate.toFixed(2).replace('.', ',')}%
                                </div>
                                <p className="text-xs text-[#AAA] text-red-400">
                                    Proporcional aos ativos
                                </p>
                            </CardContent>
                        </div>
                    </Card>
                    <Card className="relative bg-white/5 hover:bg-white/8 backdrop-blur-md border border-white/10 hover:border-secondary shadow-lg hover:shadow-2xl hover:shadow-secondary/30 rounded-2xl overflow-hidden transition-all duration-500 group">
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-transparent group-hover:from-secondary/8 group-hover:via-transparent group-hover:to-secondary/12 pointer-events-none transition-all duration-500">
                        </div>
                        <div className="relative z-10">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-white">Entradas no Período</CardTitle>
                                <DollarSign className="h-4 w-4 text-secondary" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-white">
                                    R$ {businessLogic.entries.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </div>
                                <p className="text-xs text-[#AAA]">Soma dos novos planos</p>
                            </CardContent>
                        </div>
                    </Card>
                    <Card className="relative bg-white/5 hover:bg-white/8 backdrop-blur-md border border-white/10 hover:border-secondary shadow-lg hover:shadow-2xl hover:shadow-secondary/30 rounded-2xl overflow-hidden transition-all duration-500 group"><div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-transparent group-hover:from-secondary/8 group-hover:via-transparent group-hover:to-secondary/12 pointer-events-none transition-all duration-500"></div><div className="relative z-10"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-white">Lifetime Value (LTV)</CardTitle><Award className="h-4 w-4 text-[#eab308]" /></CardHeader><CardContent><div className="text-2xl font-bold text-white">R$ {businessLogic.lifetimeValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div><p className="text-xs text-[#AAA]">Valor projetado por cliente</p></CardContent></div></Card>
                    <Card className="relative bg-white/5 hover:bg-white/8 backdrop-blur-md border border-white/10 hover:border-secondary shadow-lg hover:shadow-2xl hover:shadow-secondary/30 rounded-2xl overflow-hidden transition-all duration-500 group">
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-transparent group-hover:from-secondary/8 group-hover:via-transparent group-hover:to-secondary/12 pointer-events-none transition-all duration-500"></div>
                        <div className="relative z-10">
                            <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-white">Recorrência + Comissão Total</CardTitle><DollarSign className="h-4 w-4 text-secondary" /></CardHeader>
                            <CardContent><div className="text-2xl font-bold text-white">R$ {businessLogic.totalRevenueComission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div><p className="text-xs text-[#AAA]">Recorrência + Comissão</p></CardContent>
                        </div>
                    </Card>
                    <Card className="relative bg-white/5 hover:bg-white/8 backdrop-blur-md border border-white/10 hover:border-secondary shadow-lg hover:shadow-2xl hover:shadow-secondary/30 rounded-2xl overflow-hidden transition-all duration-500 group">
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-transparent group-hover:from-secondary/8 group-hover:via-transparent group-hover:to-secondary/12 pointer-events-none transition-all duration-500"></div>
                        <div className="relative z-10">
                            <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-white">Comissão Total</CardTitle><Target className="h-4 w-4 text-secondary" /></CardHeader>
                            <CardContent><div className="text-2xl font-bold text-white">R$ {businessLogic.totalCommission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div><p className="text-xs text-[#AAA]">Com base na performance</p></CardContent>
                        </div>
                    </Card>
                    <Card className="relative bg-white/5 hover:bg-white/8 backdrop-blur-md border border-white/10 hover:border-secondary shadow-lg hover:shadow-2xl hover:shadow-secondary/30 rounded-2xl overflow-hidden transition-all duration-500 group">
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-transparent group-hover:from-secondary/8 group-hover:via-transparent group-hover:to-secondary/12 pointer-events-none transition-all duration-500"></div>
                        <div className="relative z-10">
                            <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-white">Recorrência Total</CardTitle><DollarSign className="h-4 w-4 text-secondary" /></CardHeader>
                            <CardContent><div className="text-2xl font-bold text-white">R$ {businessLogic.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div><p className="text-xs text-[#AAA]">Com base no plano</p></CardContent>
                        </div>
                    </Card>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="relative bg-white/5 hover:bg-white/8 backdrop-blur-md border border-white/10 hover:border-secondary shadow-lg hover:shadow-2xl hover:shadow-secondary/30 rounded-2xl overflow-hidden transition-all duration-500 group">
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-transparent group-hover:from-secondary/8 group-hover:via-transparent group-hover:to-secondary/12 pointer-events-none transition-all duration-500"></div>
                        <div className="relative z-10">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold flex items-center gap-2 text-white">
                                    <DollarSign className="text-secondary" />
                                    Histórico de Recorrência e Comissão
                                </CardTitle>
                            <CardTitle className="text-sm font-medium flex items-center gap-2 justify-items-end">
                                <Select value={selectedYearInitial.toString()} onValueChange={v => setSelectedYearInitial(parseInt(v))}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableYearsInitial.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                                    </SelectContent>
                                </Select>

                                Até:
                                <Select value={selectedYearEnd.toString()} onValueChange={v => setSelectedYearEnd(parseInt(v))}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableYearsEnd.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={historicalChartData}>
                                <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                                <Legend />
                                <Line type="monotone" dataKey="revenue" stroke="#3B82F6" name="Recorrência" />
                                <Line type="monotone" dataKey="churn" stroke="#b91b48" name="Perdas (Churn)" />
                                <Line type="monotone" dataKey="commission" stroke="#10B981" name="Comissão" />
                                </LineChart>
                            </ResponsiveContainer>
                            </CardContent>
                        </div>
                    </Card>
                    <Card className="relative bg-white/5 hover:bg-white/8 backdrop-blur-md border border-white/10 hover:border-secondary shadow-lg hover:shadow-2xl hover:shadow-secondary/30 rounded-2xl overflow-hidden transition-all duration-500 group">
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-transparent group-hover:from-secondary/8 group-hover:via-transparent group-hover:to-secondary/12 pointer-events-none transition-all duration-500"></div>
                        <div className="relative z-10">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold flex items-center gap-2 text-white">
                                    <TrendingUp className="text-secondary" />
                                    Desempenho de Recorrência por Squad
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={businessLogic.squadRevenueData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`} />
                                    <Bar dataKey="revenue">
                                        {
                                            businessLogic.squadRevenueData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                                            ))
                                        }
                                    </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </div>
                    </Card>
                    <Card className="relative bg-white/5 hover:bg-white/8 backdrop-blur-md border border-white/10 hover:border-secondary shadow-lg hover:shadow-2xl hover:shadow-secondary/30 rounded-2xl overflow-hidden transition-all duration-500 group">
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-transparent group-hover:from-secondary/8 group-hover:via-transparent group-hover:to-secondary/12 pointer-events-none transition-all duration-500"></div>
                        <div className="relative z-10">
                            <CardHeader><CardTitle className="text-lg font-semibold flex items-center gap-2 text-white"><Users className="text-secondary" />Clientes Ativos por Squad</CardTitle></CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie data={businessLogic.activeClientsBySquadData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={80} fill="#8884d8" dataKey="value" >
                                        {businessLogic.activeClientsBySquadData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => `${value} cliente(s)`} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                            </CardContent>
                        </div>
                    </Card>
                    <Card className="relative bg-white/5 hover:bg-white/8 backdrop-blur-md border border-white/10 hover:border-secondary shadow-lg hover:shadow-2xl hover:shadow-secondary/30 rounded-2xl overflow-hidden transition-all duration-500 group">
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-transparent group-hover:from-secondary/8 group-hover:via-transparent group-hover:to-secondary/12 pointer-events-none transition-all duration-500"></div>
                        <div className="relative z-10">
                            <CardHeader><CardTitle className="text-lg font-semibold flex items-center gap-2 text-white"><UserPlus className="text-secondary" />Novos Clientes vs. Cancelamentos<TrendingDown className="text-red-400" /></CardTitle></CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}><BarChart data={businessLogic.squadAcquisitionChurnData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Legend /><Bar dataKey="newClients" fill="#10B981" name="Novos Clientes" /><Bar dataKey="churns" fill="#EF4444" name="Cancelamentos" /></BarChart></ResponsiveContainer>
                            </CardContent>
                        </div>
                    </Card>
                </div>
            </div>
            {isChurnModalOpen && <ChurnDetailsModal clients={businessLogic.churnedClientsDetails} onClose={() => setIsChurnModalOpen(false)} />}
        </div>
    );
};

export default Dashboard;