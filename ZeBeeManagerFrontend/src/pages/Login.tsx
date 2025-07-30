import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from 'lucide-react';
import api from '@/lib/api'; // Importar a instância do axios configurada

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Usar o novo endpoint de login do dj-rest-auth que retorna JWT
            const response = await api.post('/auth/login/', {
                username,
                password,
            });

            // A resposta do JWT contém 'access_token' ou 'access'
            const accessToken = response.data.access_token || response.data.access;

            if (!accessToken) {
                throw new Error('Token de acesso não recebido. Tente novamente.');
            }

            // Armazena o novo token JWT no localStorage
            localStorage.setItem('authToken', accessToken);
            
            // Redireciona para o dashboard após o login
            navigate('/dashboard');

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
        <div className="relative flex items-center justify-center min-h-screen w-full bg-[#020817] overflow-hidden">
            {/* Focos de luz no fundo */}
            <div className="absolute top-[-10%] right-[0%] w-96 h-96 bg-blue-500/50 rounded-full filter blur-3xl opacity-30 animate-blob"></div>
            <div className="absolute bottom-[-10%] left-[5%] w-96 h-96 bg-purple-500/50 rounded-full filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

            <Card className="relative z-10 w-[380px] bg-gray-400/10 backdrop-blur-lg border-white/20 text-white">
                <CardHeader className="items-center text-center">
                    <img src='/ZeBeeManager.png' className="h-16 w-16 mb-4" alt="ZeBee.Manager Logo" style={{ filter: 'brightness(0) saturate(100%) invert(29%) sepia(90%) saturate(1470%) hue-rotate(200deg) brightness(96%) contrast(93%)' }} />
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
                                className="bg-transparent text-white placeholder:text-gray-400"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Senha</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="********"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="bg-transparent text-white placeholder:text-gray-400"
                            />
                        </div>
                        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Entrar
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default Login;
