import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { UserPlus, DollarSign, TrendingUp, Edit, Loader2, AlertCircle, Activity, Users2,  Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
import { parseISO } from 'date-fns';
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ptBR } from "date-fns/locale";

// --- Tipos ---
type Squad = { id: number; name: string; };
type MonthlyPerformance = { revenue: string; acos: string; tacos: string; };
type YearlyData = { [month: string]: MonthlyPerformance };
type MonthlyData = { [year: string]: YearlyData };
type ClientFormData = {
    id?: number; squad: number | null;
    sellerName: string; storeName: string; sellerId: string; sellerEmail: string;
    contractedPlan: string; planValue: string; clientCommissionPercentage: string;
    monthlyData: MonthlyData; status: string;
    createdAt: Date | null;
    statusChangedAt: Date | null;
};

const createEmptyMonthlyData = (): MonthlyData => ({});
const emptyFormState: ClientFormData = {
    squad: null, sellerName: '', storeName: '', sellerId: '', sellerEmail: '',
    contractedPlan: '', planValue: '', clientCommissionPercentage: '',
    status: 'Ativo', monthlyData: createEmptyMonthlyData(), createdAt: new Date(), statusChangedAt: null
};

const ClientRegistration = () => {
    const [formData, setFormData] = useState<ClientFormData>(emptyFormState);
    const [squads, setSquads] = useState<Squad[]>([]);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const idToEdit = searchParams.get('id');
        const fetchSquads = fetch(`${import.meta.env.VITE_API_URL}/squads/`).then(res => res.json());
        const fetchClientData = idToEdit ? fetch(`${import.meta.env.VITE_API_URL}/clients/${idToEdit}/`).then(res => res.ok ? res.json() : Promise.reject('Cliente não encontrado')) : Promise.resolve(null);

        Promise.all([fetchSquads, fetchClientData])
            .then(([squadsData, clientData]) => {
                setSquads(squadsData || []);
                if (clientData) {
                    setIsEditMode(true);
                    setFormData({
                        id: clientData.id, squad: clientData.squad,
                        sellerName: clientData.seller_name, storeName: clientData.store_name,
                        sellerId: clientData.seller_id, sellerEmail: clientData.seller_email,
                        contractedPlan: clientData.contracted_plan, planValue: clientData.plan_value,
                        clientCommissionPercentage: clientData.client_commission_percentage,
                        monthlyData: clientData.monthly_data || createEmptyMonthlyData(),
                        status: clientData.status, createdAt: clientData.created_at ? parseISO(clientData.created_at) : new Date(),
                        statusChangedAt: clientData.status_changed_at ? parseISO(clientData.status_changed_at) : null,
                    });
                } else {
                    setFormData(emptyFormState);
                }
            }).catch(err => setError(err.message)).finally(() => setIsLoading(false));
    }, []);

    const handleDateChange = (field: 'createdAt' | 'statusChangedAt', date: Date | undefined) => {
        if (date) {
            setFormData(prev => ({ ...prev, [field]: date }));
        }
    };

    const handleInputChange = (field: keyof Omit<ClientFormData, 'monthlyData'>, value: string | number | null) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleMonthlyDataChange = (year: number, month: string, field: keyof MonthlyPerformance, value: string) => {
        setFormData(prev => ({
            ...prev,
            monthlyData: {
                ...prev.monthlyData,
                [year]: {
                    ...prev.monthlyData[year],
                    [month]: {
                        ...(prev.monthlyData[year]?.[month] || { revenue: '', acos: '', tacos: '' }),
                        [field]: value
                    }
                }
            }
        }));
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const url = isEditMode ? `${import.meta.env.VITE_API_URL}/clients/${formData.id}/` : `${import.meta.env.VITE_API_URL}/clients/`;
        const method = isEditMode ? 'PUT' : 'POST';

        const payload = {
            squad: formData.squad,
            seller_name: formData.sellerName,
            store_name: formData.storeName,
            seller_id: formData.sellerId,
            seller_email: formData.sellerEmail,
            contracted_plan: formData.contractedPlan,
            plan_value: formData.planValue,
            client_commission_percentage: formData.clientCommissionPercentage,
            monthly_data: formData.monthlyData,
            status: formData.status,
            created_at: formData.createdAt?.toISOString(),
            status_changed_at: formData.statusChangedAt?.toISOString() || null
        };

        try {
            const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!response.ok) {
                const errData = await response.json();
                const errorMessages = Object.entries(errData).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join('\n');
                throw new Error(errorMessages || 'Erro ao salvar.');
            }
            const result = await response.json();
            toast({ title: "Sucesso!", description: `Cliente ${result.store_name} salvo.` });
            window.location.assign('/lista-clientes');
        } catch (err) {
            toast({ title: "Erro ao Salvar", description: err instanceof Error ? err.message : "Erro desconhecido", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };
    
    const years = Array.from({ length: new Date().getFullYear() - 2009 }, (_, i) => new Date().getFullYear() - i);
    const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

    if (isLoading) return <div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin" /></div>;
    if (error) return <div className="flex justify-center items-center h-screen text-destructive"><AlertCircle className="h-12 w-12 mr-4"/>{error}</div>;

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8"><h1 className="text-3xl font-bold">{isEditMode ? `Editando: ${formData.storeName}` : 'Registro de Cliente'}</h1></div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card><CardHeader><CardTitle className="flex items-center gap-2">{isEditMode ? <Edit className="text-blue-500"/> : <UserPlus className="text-blue-500"/>}Informações Básicas</CardTitle></CardHeader><CardContent className="grid md:grid-cols-2 gap-4">
                        <div><Label>Nome do Cliente *</Label><Input value={formData.sellerName} onChange={e => handleInputChange('sellerName', e.target.value)} required /></div>
                        <div><Label>Nome da Loja *</Label><Input value={formData.storeName} onChange={e => handleInputChange('storeName', e.target.value)} required /></div>
                        <div><Label>ID do Cliente *</Label><Input value={formData.sellerId} onChange={e => handleInputChange('sellerId', e.target.value)} required /></div>
                        <div><Label>Email *</Label><Input type="email" value={formData.sellerEmail} onChange={e => handleInputChange('sellerEmail', e.target.value)} required /></div>
                        <div><Label>Squad Responsável</Label><Select value={formData.squad?.toString() || ''} onValueChange={(v) => handleInputChange('squad', v ? parseInt(v) : null)} disabled={!squads.length}><SelectTrigger><SelectValue placeholder={squads.length ? "Selecione um squad" : "Nenhum squad cadastrado"} /></SelectTrigger><SelectContent>{squads.map(s => (<SelectItem key={s.id} value={s.id.toString()}><span className="flex items-center"><Users2 className="w-4 h-4 mr-2" />{s.name}</span></SelectItem>))}</SelectContent></Select></div>
                        <div><Label>Status</Label><Select value={formData.status} onValueChange={(v) => handleInputChange('status', v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Ativo"><span className="flex items-center"><Activity className="text-green-500 w-4 h-4 mr-2"/>Ativo</span></SelectItem><SelectItem value="Inativo"><span className="flex items-center"><Activity className="text-red-500 w-4 h-4 mr-2"/>Inativo</span></SelectItem></SelectContent></Select></div>
                        <div>
                            <Label>Registrado em</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !formData.createdAt && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {formData.createdAt ? format(formData.createdAt, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar mode="single" selected={formData.createdAt ?? undefined} onSelect={(date) => handleDateChange('createdAt', date ?? undefined)} initialFocus />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div>
                            <Label>Contrato Rescindido em</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !formData.statusChangedAt && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {formData.statusChangedAt ? format(formData.statusChangedAt, "PPP", { locale: ptBR }) : <span>(Não rescindido)</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar mode="single" selected={formData.statusChangedAt ?? undefined} onSelect={(date) => handleDateChange('statusChangedAt', date ?? undefined)} />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </CardContent></Card>
                    <Card><CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="text-green-500"/>Contrato</CardTitle></CardHeader><CardContent className="grid md:grid-cols-3 gap-4">
                         <div><Label>Plano *</Label><Select value={formData.contractedPlan} onValueChange={v => handleInputChange('contractedPlan', v)}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent><SelectItem value="Basic">Basic</SelectItem><SelectItem value="Standard">Standard</SelectItem><SelectItem value="Premium">Premium</SelectItem><SelectItem value="Enterprise">Enterprise</SelectItem></SelectContent></Select></div>
                        <div><Label>Valor do Plano (R$)</Label><Input type="number" value={formData.planValue} onChange={e => handleInputChange('planValue', e.target.value)} /></div>
                        <div><Label>Comissão (%)</Label><Input type="number" value={formData.clientCommissionPercentage} onChange={e => handleInputChange('clientCommissionPercentage', e.target.value)} /></div>
                    </CardContent></Card>
                    <Card><CardHeader><div className="flex justify-between items-center"><CardTitle className="flex items-center gap-2"><TrendingUp className="text-purple-500"/>Performance Mensal</CardTitle><Select value={selectedYear.toString()} onValueChange={v => setSelectedYear(parseInt(v))}><SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger><SelectContent>{years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent></Select></div></CardHeader><CardContent className="grid lg:grid-cols-2 gap-6">
                        {months.map(month => {
                            const revenue = parseFloat(formData.monthlyData?.[selectedYear]?.[month]?.revenue || '0');
                            const commissionPct = parseFloat(formData.clientCommissionPercentage || '0');
                            const calculatedCommission = (revenue * (commissionPct / 100));
                            return (
                                <div key={month} className="border rounded-lg p-4">
                                    <h4 className="font-semibold capitalize mb-3">{new Date(2000, months.indexOf(month)).toLocaleString('pt-BR', { month: 'long' })}</h4>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div><Label className="text-xs">Receita (R$)</Label><Input type="number" value={formData.monthlyData?.[selectedYear]?.[month]?.revenue || ''} onChange={e => handleMonthlyDataChange(selectedYear, month, 'revenue', e.target.value)} /></div>
                                        <div><Label className="text-xs">ACOS (%)</Label><Input type="number" value={formData.monthlyData?.[selectedYear]?.[month]?.acos || ''} onChange={e => handleMonthlyDataChange(selectedYear, month, 'acos', e.target.value)} /></div>
                                        <div><Label className="text-xs">TACOS (%)</Label><Input type="number" value={formData.monthlyData?.[selectedYear]?.[month]?.tacos || ''} onChange={e => handleMonthlyDataChange(selectedYear, month, 'tacos', e.target.value)} /></div>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">Aplicado Comissão de {commissionPct}% a Receita: R$ {calculatedCommission.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                                </div>)
                        })}
                    </CardContent></Card>
                    <div className="flex justify-end"><Button type="submit" size="lg" disabled={isLoading}>{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} {isEditMode ? 'Salvar Alterações' : 'Registrar Cliente'}</Button></div>
                </form>
            </div>
        </div>
    );
};

export default ClientRegistration;