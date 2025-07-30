import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import api from '@/lib/api';
import { Loader2 } from 'lucide-react';

interface UserProfile {
    squad: number | null;
}

interface User {
    id: number;
    username: string;
    is_superuser: boolean;
    profile: UserProfile;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    // Começa como 'true' para mostrar o loader por padrão
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuthStatus = async () => {
            const token = localStorage.getItem('authToken');
            
            // Se não há token, sabemos que o usuário não está logado.
            // Paramos de carregar e deixamos a aplicação renderizar as rotas públicas.
            if (!token) {
                setUser(null);
                setIsLoading(false);
                return; // Finaliza a função aqui
            }

            // Se há um token, tentamos validá-lo buscando os dados do usuário
            try {
                const response = await api.get('/auth/user/');
                setUser(response.data);
            } catch (error) {
                console.error("Token inválido ou expirado. Deslogando.", error);
                // Se o token for inválido, limpa o storage e define o usuário como nulo
                localStorage.removeItem('authToken');
                setUser(null);
            } finally {
                // Em qualquer caso (sucesso ou falha da busca), terminamos de carregar
                setIsLoading(false);
            }
        };

        checkAuthStatus();
    }, []);

    // Enquanto o status de autenticação está sendo verificado, mostra uma tela de carregamento
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    // Após a verificação, fornece o contexto para o resto da aplicação
    return (
        <AuthContext.Provider value={{ user, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
