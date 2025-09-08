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
    squad_name: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuthStatus = async () => {
            const token = localStorage.getItem('authToken');
            
            if (!token) {
                setUser(null);
                setIsLoading(false);
                return;
            }

            try {
                const response = await api.get('/auth/user/');
                setUser(response.data);
            } catch (error) {
                console.error("Token inválido ou expirado. Deslogando.", error);
                localStorage.removeItem('authToken');
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuthStatus();
    }, []);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

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
