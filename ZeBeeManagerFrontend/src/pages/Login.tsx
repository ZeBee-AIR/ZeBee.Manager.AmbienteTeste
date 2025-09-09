import { useState, FormEvent } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff } from 'lucide-react';
import api from '@/lib/api';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await api.post('/auth/login/', {
                username,
                password,
            });

            const accessToken = response.data.access_token || response.data.access;

            if (!accessToken) {
                throw new Error('Token de acesso não recebido. Tente novamente.');
            }

            localStorage.setItem('authToken', accessToken);

            window.location.reload();
        } catch (err) {
            toast({
                title: "Erro de Login",
                description: err instanceof Error ? err.message : "Credenciais inválidas. Por favor, verifique o seu utilizador e senha.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative flex items-center justify-center min-h-screen w-full bg-[#121212] overflow-hidden">
            {/* Efeitos de gradiente com motion grain personalizados */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[10%] right-[10%] w-96 h-96 bg-[--primary]/15 rounded-full filter blur-3xl" style={{animation: 'floatSmoothX 12s ease-in-out infinite'}}></div>
                <div className="absolute bottom-[15%] left-[15%] w-80 h-80 bg-[--primary]/10 rounded-full filter blur-2xl" style={{animation: 'floatSmoothY 15s ease-in-out infinite'}}></div>
                <div className="absolute top-[60%] right-[70%] w-64 h-64 bg-primary/8 rounded-full filter blur-xl" style={{animation: 'floatSmoothZ 18s ease-in-out infinite'}}></div>
            </div>
            
            {/* Efeito grain/noise específico para login com animação suave */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
                <div className="w-full h-full bg-[radial-gradient(circle,rgba(0,242,255,0.02)_1px,transparent_1px bg-[length:15px_15px]" style={{animation: 'gentleFloat 8s ease-in-out infinite'}}></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(0,242,255,0.05)_0%,transparent_50%" style={{animation: 'softBackgroundPulse 12s ease-in-out infinite'}}></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(0,242,255,0.03)_0%,transparent_60%" style={{animation: 'softBackgroundPulse 15s ease-in-out infinite reverse'}}></div>
            </div>

            <Card className="relative z-10 w-[380px] bg-[#161616]/20 backdrop-blur-xl border-2 border-primary/30 text-white shadow-2xl shadow-primary/20 rounded-2xl overflow-hidden" style={{animation: 'borderGlow 4s ease-in-out infinite'}}>
                {/* Glass effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none"></div>
                <div className="relative z-10">
                <CardHeader className="items-center text-center">
                    <img src='/logo Z azazuu.png' className="h-12 w-auto mb-4 object-contain" alt="Azazuu central Logo" />
                    <CardTitle className="text-2xl font-bold">Bem-vindo de volta</CardTitle>
                    <CardDescription className="text-gray-300">Faça login para aceder ao seu painel.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="username">Utilizador</Label>
                            <Input
                                id="username"
                                type="text"
                                placeholder="seu.utilizador"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                className="bg-[#1c1c1c]/30 backdrop-blur-sm border border-primary/20 text-white placeholder:text-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/30 focus:bg-[#1c1c1c]/50 transition-all duration-300 rounded-lg h-12 px-4 shadow-inner shadow-primary/5"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Senha</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="********"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="bg-[#1c1c1c]/30 backdrop-blur-sm border border-primary/20 text-white placeholder:text-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/30 focus:bg-[#1c1c1c]/50 transition-all duration-300 rounded-lg h-12 px-4 pr-12 shadow-inner shadow-primary/5"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary transition-colors duration-200 focus:outline-none focus:text-primary"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>
                        <Button type="submit" className="relative w-full bg-gradient-to-r from-primary to-secondary-foreground hover:from-primary hover:to-secondary-foreground text-[#121212] font-bold transition-all duration-500 hover:shadow-2xl hover:shadow-primary/60 hover:scale-[1.03] active:scale-[0.97] rounded-lg h-12 backdrop-blur-sm border-2 border-primary/70 hover:border-primary overflow-hidden group" disabled={loading}>
                            {/* Background animado */}
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-secondary-foreground/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,242,255,0.3)_0%,transparent_70% opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                            
                            {/* Efeito de brilho que se move */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
                            
                            {/* Conteúdo do botão */}
                            <span className="relative z-10 flex items-center justify-center">
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Entrar
                            </span>
                        </Button>
                    </form>
                </CardContent>
                </div>
            </Card>
        </div>
    );
};

export default Login;
