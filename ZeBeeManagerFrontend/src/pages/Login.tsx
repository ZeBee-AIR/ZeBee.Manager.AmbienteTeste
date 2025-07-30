import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from 'lucide-react';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.non_field_errors?.[0] || 'Falha no login. Verifique suas credenciais.');
            }

            // Armazena o token de autenticação no localStorage
            localStorage.setItem('authToken', data.key);
            
            // Redireciona para o dashboard após o login
            navigate('/dashboard');

        } catch (err) {
            toast({
                title: "Erro de Login",
                description: err instanceof Error ? err.message : "Ocorreu um erro desconhecido.",
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
                    <CardDescription className="text-gray-300">Faça login para acessar seu painel.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="username">Usuário</Label>
                            <Input
                                id="username"
                                type="text"
                                placeholder="seu.usuario"
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