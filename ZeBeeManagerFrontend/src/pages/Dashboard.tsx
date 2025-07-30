import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Users, TrendingDown, DollarSign, Target, CalendarIcon, Loader2, AlertCircle, TrendingUp, UserPlus } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { format, getYear, isWithinInterval, startOfMonth, endOfMonth, eachMonthOfInterval, parseISO, subMonths } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
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
    plan_value: string;
    client_commission_percentage: string;
    monthly_data: { [year: string]: { [month: string]: MonthlyPerformanceData } };
    status: 'Ativo' | 'Inativo';
    created_at: string;
    status_changed_at: string | null;
}

const Dashboard = () => {
    const [clients, setClients] = useState<ClientData[]>([]);
    const [squads, setSquads] = useState<Squad[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfMonth(subMonths(new Date(), 1)),
        to: endOfMonth(new Date()),
    });

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
                totalChurnRevenueLoss: 0, totalRevenue: 0, totalCommission: 0,
                companyHistoryData: [], squadRevenueData: [], activeClientsBySquadData: [], squadAcquisitionChurnData: []
            };
        }
    
        const interval = { start: dateRange.from, end: dateRange.to || dateRange.from };
        const monthsInInterval = eachMonthOfInterval(interval);
        
        const activeClientsNow = clients.filter(c => c.status === 'Ativo');
        const newClientsInPeriod = clients.filter(c => isWithinInterval(parseISO(c.created_at), interval)).length;
        const clientsCancelledInPeriod = clients.filter(c => c.status === 'Inativo' && c.status_changed_at && isWithinInterval(parseISO(c.status_changed_at), interval));
        const totalChurnRevenueLoss = clientsCancelledInPeriod.reduce((sum, c) => sum + parseFloat(c.plan_value || '0'), 0);
        
        const squadNameMap = new Map(squads.map(s => [s.id, s.name]));
        
        let totalRevenueInPeriod = 0;
        let totalCommissionInPeriod = 0;
        const companyHistoryData: { month: string; revenue: number; commission: number }[] = [];
        const squadMetrics = new Map(squads.map(s => [s.id, { revenue: 0, activeClients: 0, newClients: 0, churns: 0 }]));

        monthsInInterval.forEach(monthDate => {
            let monthlyRevenue = 0;
            let monthlyCommission = 0;
            const startOfMonthDate = startOfMonth(monthDate);
            const endOfMonthDate = endOfMonth(monthDate);
            const yearKey = getYear(monthDate).toString();
            const monthKey = format(monthDate, 'MMMM', { locale: enUS }).toLowerCase();
    
            clients.forEach(client => {
                const createdAt = parseISO(client.created_at);
                const statusChangedAt = client.status_changed_at ? parseISO(client.status_changed_at) : null;
                const planValue = parseFloat(client.plan_value || '0');
                const commissionPercentage = parseFloat(client.client_commission_percentage || '0') / 100;
                
                const monthData = client.monthly_data?.[yearKey]?.[monthKey];
    
                const wasActiveInMonth = createdAt <= endOfMonthDate && (client.status === 'Ativo' || (statusChangedAt && statusChangedAt > startOfMonthDate));
    
                if (wasActiveInMonth) {
                    if (!monthData?.waiveMonthlyFee) {
                        monthlyRevenue += planValue;
                    }
                    
                    if (!monthData?.waiveCommission) {
                        const revenueFromMonthlyData = monthData?.revenue;
                        if (revenueFromMonthlyData && parseFloat(revenueFromMonthlyData) > 0) {
                            const specificRevenue = parseFloat(revenueFromMonthlyData);
                            monthlyCommission += specificRevenue * commissionPercentage;
                        }
                    }
                    
                    if (client.squad) {
                        const squadPerf = squadMetrics.get(client.squad);
                        if (squadPerf && !monthData?.waiveMonthlyFee) {
                            squadPerf.revenue += planValue;
                        }
                    }
                }
            });
            
            totalRevenueInPeriod += monthlyRevenue;
            totalCommissionInPeriod += monthlyCommission;
            companyHistoryData.push({ month: format(monthDate, 'MMM', { locale: ptBR }), revenue: monthlyRevenue, commission: monthlyCommission });
        });

        clients.forEach(client => {
            if (!client.squad) return;
            const squadPerf = squadMetrics.get(client.squad);
            if (squadPerf) {
                if(client.status === 'Ativo') squadPerf.activeClients += 1;
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
            totalRevenue: totalRevenueInPeriod,
            totalCommission: totalCommissionInPeriod,
            companyHistoryData,
            squadRevenueData,
            activeClientsBySquadData,
            squadAcquisitionChurnData
        };
    }, [clients, squads, dateRange]);


    if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    if (error) return <div className="flex justify-center items-center h-screen text-destructive"><AlertCircle className="h-12 w-12 mr-4"/> {error}</div>;

    const COLORS = ['#10B981', '#F59E0B', '#3B82F6', '#EF4444', '#8B5CF6'];

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard de Gerenciamento</h1>
                        <p className="text-muted-foreground">Monitore o desempenho de seus contratos e squads.</p>
                    </div>
                    <Popover>
                        <PopoverTrigger asChild><Button variant={"outline"} className={cn("w-[280px] justify-start text-left font-normal", !dateRange && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{dateRange?.from ? (dateRange.to ? <>{format(dateRange.from, "LLL dd, y", { locale: ptBR })} - {format(dateRange.to, "LLL dd, y", { locale: ptBR })}</> : format(dateRange.from, "LLL dd, y", { locale: ptBR })) : (<span>Selecione um período</span>)}</Button></PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end"><Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2} locale={ptBR} /></PopoverContent>
                    </Popover>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
                    <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle><Users className="h-4 w-4 text-blue-500" /></CardHeader><CardContent><div className="text-2xl font-bold">{businessLogic.totalActiveClients}</div><p className="text-xs text-muted-foreground text-green-500">+{businessLogic.newClientsInPeriod} novos no período</p></CardContent></Card>
                    <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Cancelamentos</CardTitle><TrendingDown className="h-4 w-4 text-red-500" /></CardHeader><CardContent><div className="text-2xl font-bold">{businessLogic.cancelledClientsInPeriod}</div><p className="text-xs text-muted-foreground text-red-500">No período selecionado</p></CardContent></Card>
                    <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Perdas (Churn)</CardTitle><DollarSign className="h-4 w-4 text-red-500" /></CardHeader><CardContent><div className="text-2xl font-bold">R$ {businessLogic.totalChurnRevenueLoss.toLocaleString('pt-BR')}</div><p className="text-xs text-muted-foreground text-red-500">Com base no plano</p></CardContent></Card>
                    <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Receita Total</CardTitle><DollarSign className="h-4 w-4 text-green-500" /></CardHeader><CardContent><div className="text-2xl font-bold">R$ {businessLogic.totalRevenue.toLocaleString('pt-BR')}</div><p className="text-xs text-muted-foreground">Com base no plano</p></CardContent></Card>
                    <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Comissão Total</CardTitle><Target className="h-4 w-4 text-yellow-500" /></CardHeader><CardContent><div className="text-2xl font-bold">R$ {businessLogic.totalCommission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div><p className="text-xs text-muted-foreground">Com base na performance</p></CardContent></Card>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader><CardTitle className="text-lg font-semibold flex items-center gap-2"><DollarSign className="text-yellow-500" />Histórico de Receita e Comissão</CardTitle></CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}><LineChart data={businessLogic.companyHistoryData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis /><Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} /><Legend /><Line type="monotone" dataKey="revenue" stroke="#3B82F6" name="Receita" /><Line type="monotone" dataKey="commission" stroke="#10B981" name="Comissão" /></LineChart></ResponsiveContainer>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle className="text-lg font-semibold flex items-center gap-2"><TrendingUp className="text-blue-500" />Desempenho de Receita por Squad</CardTitle></CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}><BarChart data={businessLogic.squadRevenueData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`} /><Bar dataKey="revenue" fill="#3B82F6" name="Receita" /></BarChart></ResponsiveContainer>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle className="text-lg font-semibold flex items-center gap-2"><Users className="text-indigo-500" />Clientes Ativos por Squad</CardTitle></CardHeader>
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
                    </Card>
                    <Card>
                        <CardHeader><CardTitle className="text-lg font-semibold flex items-center gap-2"><UserPlus className="text-green-500" />Novos Clientes vs. Cancelamentos<TrendingDown className="text-red-500" /></CardTitle></CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}><BarChart data={businessLogic.squadAcquisitionChurnData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Legend /><Bar dataKey="newClients" fill="#10B981" name="Novos Clientes" /><Bar dataKey="churns" fill="#EF4444" name="Cancelamentos" /></BarChart></ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
