import { useState, useEffect, FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { UserPlus, DollarSign, TrendingUp, Edit, Loader2, AlertCircle, Activity, Users2, Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
import { parseISO, format } from 'date-fns';
import { cn } from "@/lib/utils";
import { ptBR } from "date-fns/locale";
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

type Squad = { id: number; name: string; };
type MonthlyPerformance = { 
    revenue: string; 
    acos: string; 
    tacos: string;
    waiveCommission?: boolean;
    waiveMonthlyFee?: boolean;
};
type YearlyData = { [month: string]: MonthlyPerformance };
type MonthlyData = { [year: string]: YearlyData };

type ClientFormData = {
    id?: number; squad: number | null;
    sellerName: string; storeName: string; sellerId: string; sellerEmail: string;
    phoneNumber: string;
    contractedPlan: string; planValue: string; clientCommissionPercentage: string;
    hasSpecialCommission: boolean;
    specialCommissionThreshold: string;
    monthlyData: MonthlyData; status: string;
    createdAt: Date | null;
    statusChangedAt: Date | null;
};

const createEmptyMonthlyData = (): MonthlyData => ({});
const emptyFormState: ClientFormData = {
    squad: null, sellerName: '', storeName: '', sellerId: '', sellerEmail: '',
    phoneNumber: '',
    contractedPlan: '', planValue: '', clientCommissionPercentage: '',
    hasSpecialCommission: false,
    specialCommissionThreshold: '',
    status: 'Ativo', monthlyData: createEmptyMonthlyData(), createdAt: new Date(), statusChangedAt: null
};

const ClientRegistration = () => {
    const { user } = useAuth();
    const isSuperuser = user?.is_superuser;
    const userSquadId = user?.profile?.squad;

    const [formData, setFormData] = useState<ClientFormData>(emptyFormState);
    const [squads, setSquads] = useState<Squad[]>([]);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const idToEdit = searchParams.get('id');
        
        const fetchSquads = api.get('/squads/');
        const fetchClientData = idToEdit ? api.get(`/clients/${idToEdit}/`) : Promise.resolve(null);

        Promise.all([fetchSquads, fetchClientData])
            .then(([squadsRes, clientRes]) => {
                setSquads(squadsRes.data || []);
                if (clientRes) {
                    const clientData = clientRes.data;
                    setIsEditMode(true);
                    setFormData({
                        id: clientData.id, squad: clientData.squad,
                        sellerName: clientData.seller_name, storeName: clientData.store_name,
                        sellerId: clientData.seller_id, sellerEmail: clientData.seller_email,
                        phoneNumber: clientData.phone_number || '',
                        contractedPlan: clientData.contracted_plan, planValue: clientData.plan_value,
                        clientCommissionPercentage: clientData.client_commission_percentage,
                        hasSpecialCommission: clientData.has_special_commission || false,
                        specialCommissionThreshold: clientData.special_commission_threshold || '',
                        monthlyData: clientData.monthly_data || createEmptyMonthlyData(),
                        status: clientData.status, createdAt: clientData.created_at ? parseISO(clientData.created_at) : new Date(),
                        statusChangedAt: clientData.status_changed_at ? parseISO(clientData.status_changed_at) : null,
                    });
                } else {
                    const initialSquad = isSuperuser ? null : userSquadId || null;
                    setFormData({...emptyFormState, squad: initialSquad});
                }
            }).catch(err => setError(err.message)).finally(() => setIsLoading(false));
    }, [isSuperuser, userSquadId]);

    const handleDateChange = (field: 'createdAt' | 'statusChangedAt', date: Date | undefined) => {
        setFormData(prev => ({ ...prev, [field]: date || null }));
    };

    const handleInputChange = (field: keyof Omit<ClientFormData, 'monthlyData' | 'createdAt' | 'statusChangedAt' | 'hasSpecialCommission'>, value: string | number | null) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSwitchChange = (field: 'hasSpecialCommission', checked: boolean) => {
        setFormData(prev => ({ ...prev, [field]: checked }));
    };

    const handleMonthlyDataChange = (year: number, month: string, field: keyof Omit<MonthlyPerformance, 'waiveCommission' | 'waiveMonthlyFee'>, value: string) => {
        setFormData(prev => {
            const newMonthlyData = { ...prev.monthlyData };
            if (!newMonthlyData[year]) newMonthlyData[year] = {};
            if (!newMonthlyData[year][month]) newMonthlyData[year][month] = { revenue: '', acos: '', tacos: '' };
            newMonthlyData[year][month][field] = value;
            return { ...prev, monthlyData: newMonthlyData };
        });
    };

    const handleMonthlyCheckboxChange = (year: number, month: string, field: 'waiveCommission' | 'waiveMonthlyFee', checked: boolean) => {
        setFormData(prev => {
            const newMonthlyData = { ...prev.monthlyData };
            if (!newMonthlyData[year]) newMonthlyData[year] = {};
            if (!newMonthlyData[year][month]) newMonthlyData[year][month] = { revenue: '', acos: '', tacos: '' };
            newMonthlyData[year][month][field] = checked;
            return { ...prev, monthlyData: newMonthlyData };
        });
    };
    
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const payload = {
            squad: formData.squad,
            seller_name: formData.sellerName,
            store_name: formData.storeName,
            seller_id: formData.sellerId,
            seller_email: formData.sellerEmail,
            phone_number: formData.phoneNumber,
            contracted_plan: formData.contractedPlan,
            plan_value: formData.planValue,
            client_commission_percentage: formData.clientCommissionPercentage,
            has_special_commission: formData.hasSpecialCommission,
            special_commission_threshold: formData.hasSpecialCommission ? formData.specialCommissionThreshold : null,
            monthly_data: formData.monthlyData,
            status: formData.status,
            created_at: formData.createdAt?.toISOString(),
            status_changed_at: formData.statusChangedAt?.toISOString() || null
        };
        try {
            const response = isEditMode ? await api.put(`/clients/${formData.id}/`, payload) : await api.post('/clients/', payload);
            toast({ title: "Sucesso!", description: `Cliente ${response.data.store_name} salvo.` });
            window.location.assign('/lista-clientes');
        } catch (err: any) {
            const errorMessages = err.response?.data ? Object.entries(err.response.data).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join('\n') : "Erro desconhecido";
            toast({ title: "Erro ao Salvar", description: err.message || errorMessages, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const years = Array.from({ length: new Date().getFullYear() - 2009 }, (_, i) => new Date().getFullYear() - i);
    const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

    if (isLoading) return <div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin" /></div>;
    if (error) return <div className="flex justify-center items-center h-screen text-destructive"><AlertCircle className="h-12 w-12 mr-4"/>{error}</div>;

    return (
        // A ÚNICA MUDANÇA ESTÁ AQUI NESTA LINHA:
        <div className="min-h-screen p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8"><h1 className="text-3xl font-bold">{isEditMode ? `Editando: ${formData.storeName}` : 'Registro de Cliente'}</h1></div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {isSuperuser &&
                        <>
                            <Card>
                                <CardHeader><CardTitle className="flex items-center gap-2">{isEditMode ? <Edit className="text-blue-500"/> : <UserPlus className="text-blue-500"/>}Informações Básicas</CardTitle></CardHeader>
                                <CardContent className="grid md:grid-cols-2 gap-4">
                                    <div><Label>Nome do Cliente *</Label><Input value={formData.sellerName} onChange={e => handleInputChange('sellerName', e.target.value)} required /></div>
                                    <div><Label>Nome da Loja *</Label><Input value={formData.storeName} onChange={e => handleInputChange('storeName', e.target.value)} required /></div>
                                    <div><Label>ID do Cliente</Label><Input value={formData.sellerId} onChange={e => handleInputChange('sellerId', e.target.value)} /></div>
                                    <div><Label>Email</Label><Input type="email" value={formData.sellerEmail} onChange={e => handleInputChange('sellerEmail', e.target.value)}/></div>
                                    <div><Label>Telefone</Label><Input value={formData.phoneNumber} onChange={e => handleInputChange('phoneNumber', e.target.value)} placeholder="(11) 98765-4321" /></div>
                                    <div>
                                        <Label>Squad Responsável</Label>
                                        <Select
                                            value={formData.squad?.toString() || ''}
                                            onValueChange={(v) => { const numValue = parseInt(v, 10); handleInputChange('squad', isNaN(numValue) ? null : numValue); }}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder={squads.length ? "Selecione um squad" : "Nenhum squad cadastrado"} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {squads.map(s => (<SelectItem key={s.id} value={s.id.toString()}><span className="flex items-center"><Users2 className="w-4 h-4 mr-2" />{s.name}</span></SelectItem>))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div><Label>Status</Label><Select value={formData.status} onValueChange={(v) => handleInputChange('status', v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Ativo"><span className="flex items-center"><Activity className="text-green-500 w-4 h-4 mr-2"/>Ativo</span></SelectItem><SelectItem value="Inativo"><span className="flex items-center"><Activity className="text-red-500 w-4 h-4 mr-2"/>Inativo</span></SelectItem></SelectContent></Select></div>
                                    <div><Label>Registrado em</Label><Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !formData.createdAt && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{formData.createdAt ? format(formData.createdAt, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formData.createdAt ?? undefined} onSelect={(date) => handleDateChange('createdAt', date)} initialFocus /></PopoverContent></Popover></div>
                                    <div><Label>Contrato Rescindido em</Label><Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !formData.statusChangedAt && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{formData.statusChangedAt ? format(formData.statusChangedAt, "PPP", { locale: ptBR }) : <span>(Não rescindido)</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formData.statusChangedAt ?? undefined} onSelect={(date) => handleDateChange('statusChangedAt', date)} /></PopoverContent></Popover></div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="text-green-500"/>Contrato</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid md:grid-cols-3 gap-4">
                                        <div><Label>Plano *</Label><Select value={formData.contractedPlan} onValueChange={v => handleInputChange('contractedPlan', v)}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent><SelectItem value="Gestão Azazuu - Basic">Gestão Azazuu - Basic</SelectItem><SelectItem value="Gestão Azazuu - Pro">Gestão Azazuu - Pro</SelectItem><SelectItem value="Gestão Azazuu - Advanced">Gestão Azazuu - Advanced</SelectItem><SelectItem value="Gestão de ADS - Basic">Gestão de ADS - Basic</SelectItem><SelectItem value="Gestão de ADS - Pro">Gestão de ADS - Pro</SelectItem><SelectItem value="Gestão de ADS - Advanced">Gestão de ADS - Advanced</SelectItem></SelectContent></Select></div>
                                        <div><Label>Valor do Plano (R$)</Label><Input type="number" value={formData.planValue} onChange={e => handleInputChange('planValue', e.target.value)} /></div>
                                        <div><Label>Comissão (%)</Label><Input type="number" value={formData.clientCommissionPercentage} onChange={e => handleInputChange('clientCommissionPercentage', e.target.value)} /></div>
                                    </div>
                                    
                                    <div className="border-t pt-4 space-y-4">
                                        <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-0.5">
                                                <Label className="text-base">Comissão Especial</Label>
                                                <p className="text-sm text-muted-foreground">Ativar se o cliente paga comissão apenas após atingir um gatilho de faturamento.</p>
                                            </div>
                                            <Switch checked={formData.hasSpecialCommission} onCheckedChange={(checked) => handleSwitchChange('hasSpecialCommission', checked)} />
                                        </div>
                                        {formData.hasSpecialCommission && (
                                            <div>
                                                <Label>Gatilho de Faturamento para Comissão (R$)</Label>
                                                <Input 
                                                    type="number" 
                                                    value={formData.specialCommissionThreshold} 
                                                    onChange={e => handleInputChange('specialCommissionThreshold', e.target.value)} 
                                                    placeholder="50000.00"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    }


                    <Card>
                        <CardHeader><div className="flex justify-between items-center"><CardTitle className="flex items-center gap-2"><TrendingUp className="text-purple-500"/>Performance Mensal</CardTitle><Select value={selectedYear.toString()} onValueChange={v => setSelectedYear(parseInt(v))}><SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger><SelectContent>{years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent></Select></div></CardHeader>
                        <CardContent className="grid lg:grid-cols-2 gap-6">
                            {months.map(month => {
                                const monthData = formData.monthlyData?.[selectedYear]?.[month];
                                const revenue = parseFloat(monthData?.revenue || '0');
                                const commissionPct = parseFloat(formData.clientCommissionPercentage || '0');
                                let revenueComission = 0;

                                if (formData.hasSpecialCommission) {
                                    const threshold = parseFloat(formData.specialCommissionThreshold || '0');
                                    if (revenue >= threshold) {
                                        revenueComission = revenue - threshold;
                                    }
                                } else {
                                    revenueComission = revenue;
                                }

                                const calculatedCommission = (revenueComission * (commissionPct / 100));
                                return (
                                    <div key={month} className="border rounded-lg p-4 space-y-3">
                                        <h4 className="font-semibold capitalize">{new Date(2000, months.indexOf(month)).toLocaleString('pt-BR', { month: 'long' })}</h4>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div><Label className="text-xs">Receita (R$)</Label><Input type="number" value={monthData?.revenue || ''} onChange={e => handleMonthlyDataChange(selectedYear, month, 'revenue', e.target.value)} /></div>
                                            <div><Label className="text-xs">ACOS (%)</Label><Input type="number" value={monthData?.acos || ''} onChange={e => handleMonthlyDataChange(selectedYear, month, 'acos', e.target.value)} /></div>
                                            <div><Label className="text-xs">TACOS (%)</Label><Input type="number" value={monthData?.tacos || ''} onChange={e => handleMonthlyDataChange(selectedYear, month, 'tacos', e.target.value)} /></div>
                                        </div>
                                        {isSuperuser &&
                                            <>
                                                <p className="text-xs text-muted-foreground">Comissão sobre receita: R$ {calculatedCommission.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                                                <div className="flex items-center space-x-4 pt-2">
                                                    <div className="flex items-center space-x-2"><Checkbox id={`waiveFee-${selectedYear}-${month}`} checked={monthData?.waiveMonthlyFee} onCheckedChange={(checked) => handleMonthlyCheckboxChange(selectedYear, month, 'waiveMonthlyFee', !!checked)} /><Label htmlFor={`waiveFee-${selectedYear}-${month}`} className="text-xs font-normal">Isentar Mensalidade</Label></div>
                                                    <div className="flex items-center space-x-2"><Checkbox id={`waiveComm-${selectedYear}-${month}`} checked={monthData?.waiveCommission} onCheckedChange={(checked) => handleMonthlyCheckboxChange(selectedYear, month, 'waiveCommission', !!checked)} /><Label htmlFor={`waiveComm-${selectedYear}-${month}`} className="text-xs font-normal">Isentar Comissão</Label></div>
                                                </div>
                                            </>
                                        }
                                    </div>
                                )
                            })}
                        </CardContent>
                    </Card>
                    <div className="flex justify-end"><Button type="submit" size="lg" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} {isEditMode ? 'Salvar Alterações' : 'Registrar Cliente'}</Button></div>
                </form>
            </div>
        </div>
    );
};

export default ClientRegistration;