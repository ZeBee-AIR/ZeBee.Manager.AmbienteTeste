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
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem('authToken');
            if (token) {
                try {
                    const response = await api.get('/auth/user/');
                    setUser(response.data);
                } catch (error) {
                    console.error("Falha ao buscar usuário, deslogando.", error);
                    localStorage.removeItem('authToken');
                }
            }
            setIsLoading(false);
        };
        fetchUser();
    }, []);

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin" /></div>;
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
