import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { BarChart3, UserPlus, Building2, Search, LogOut, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

const Navigation = () => {
    const { user } = useAuth();
    const isSuperuser = user?.is_superuser;
    const username = user?.username;

    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
    const [expandedItem, setExpandedItem] = useState<string | null>(null);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const navigationItems = [
        { id: 'dashboard', icon: BarChart3, label: 'Dashboard', path: '/dashboard', requiresSuperuser: true },
        { id: 'registrar', icon: UserPlus, label: 'Registrar', path: '/registrar', requiresSuperuser: true },
        { id: 'clientes', icon: Building2, label: 'Clientes', path: '/lista-clientes', requiresSuperuser: false },
    ];
    
    const userMenuItem = { id: 'user-menu', icon: User, label: username || 'Usuário' };

    const handleItemClick = (itemId: string, path?: string) => {
        setExpandedItem(prev => (prev === itemId ? null : itemId));
        if (path) {
            setTimeout(() => navigate(path), 150);
        }
    };

    useEffect(() => {
        setSearchTerm(searchParams.get('q') || '');
    }, [searchParams]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const term = searchTerm.trim();
        const newSearchParams = new URLSearchParams(searchParams);

        if (term) {
            newSearchParams.set('q', term);
        } else {
            newSearchParams.delete('q');
        }
        
        if (location.pathname !== '/lista-clientes') {
            navigate(`/lista-clientes?${newSearchParams.toString()}`);
        } else {
            setSearchParams(newSearchParams);
        }
    };

    const handleLogout = async () => {
        try {
            await api.post('/auth/logout/');
        } catch (error) {
            console.error("Erro no logout da API, mas deslogando localmente:", error);
        } finally {
            localStorage.removeItem('authToken');
            window.location.href = '/';
        }
    };

    return (
        <nav className={`fixed ${isMobile ? 'bottom-0' : 'top-0'} left-0 right-0 z-50 bg-white/5 backdrop-blur-2xl border-${isMobile ? 't' : 'b'} border-white/10 shadow-2xl`}>
            {/* MUDANÇA 1: Adicionamos 'relative' aqui para posicionar a busca em relação a este container */}
            <div className="relative max-w-7xl mx-auto h-20 flex items-center justify-between">
                
                {/* GRUPO DA ESQUERDA: LOGO */}
                <div className="flex items-center">
                    {/* MUDANÇA 2: Aumentamos a logo para h-12 */}
                    {user?.squad_name == "Pégaso" && (
                        <img src='/azazuucentral_pegaso.png' className="h-14 w-auto object-contain" alt="Azazuu central Logo" />
                    ) || user?.squad_name == "Fênix" && (
                        <img src='/azazuucentral_fenix.png' className="h-14 w-auto object-contain" alt="Azazuu central Logo" />
                    ) || user?.squad_name == "Grifo" && (
                        <img src='/azazuucentral_grifo.png' className="h-14 w-auto object-contain" alt="Azazuu central Logo" />
                    ) || (
                        <img src='/azazuucentral.png' className="h-14 w-auto object-contain" alt="Azazuu central Logo" />
                    )}
                </div>

                {/* MUDANÇA 3: BARRA DE BUSCA ABSOLUTAMENTE CENTRALIZADA */}
                {/* Ela agora "flutua" no centro, ignorando o tamanho dos outros elementos */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                    <form onSubmit={handleSearchSubmit} className="w-80">
                        <div className="relative group">
                            <Input
                                type="search"
                                placeholder="Pesquisar..."
                                className="pl-12 pr-4 py-2.5 w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-xl shadow-lg focus:border-secondary/50 focus:shadow-xl focus:shadow-secondary/20 transition-all duration-300 text-white placeholder:text-gray-400 focus:bg-white/10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <Button type="submit" variant="ghost" size="icon" className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg hover:bg-secondary/20 transition-all duration-300">
                                <Search className="h-4 w-4 text-gray-400 group-focus-within:text-secondary transition-colors duration-300" />
                            </Button>
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-secondary/0 via-secondary/5 to-secondary/0 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                        </div>
                    </form>
                </div>
                
                {/* GRUPO DA DIREITA: NAVEGAÇÃO E ÍCONES */}
                <div className={`flex items-center gap-4`}>
                    {navigationItems.map((item) => {
                        if (item.requiresSuperuser && !isSuperuser) return null;
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        const isExpanded = expandedItem === item.id;
                        
                        return (
                            <div key={item.id} className="relative">
                                <button
                                    onClick={() => handleItemClick(item.id, item.path)}
                                    className={`group relative inline-flex items-center justify-start transition-all duration-300 ease-in-out hover:scale-105 ${
                                        isActive
                                            ? 'bg-white/10 border border-secondary/50 shadow-lg shadow-secondary/25'
                                            : 'bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/25'
                                    } rounded-full h-12 ${isExpanded ? 'px-5' : 'w-12 justify-center'}`}
                                    style={{
                                        width: isExpanded ? 'auto' : '3rem',
                                        minWidth: '3rem'
                                    }}
                                >
                                    <Icon className={`transition-colors duration-300 ${isActive ? 'text-secondary' : 'text-white'} h-4 w-4 flex-shrink-0`} />
                                    <span 
                                        className={`whitespace-nowrap font-medium text-white transition-all duration-300 ease-out overflow-hidden ${
                                            isExpanded ? 'opacity-100 ml-3' : 'opacity-0 w-0 ml-0'
                                        }`}
                                    >
                                        {item.label}
                                    </span>
                                    {isActive && (
                                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-secondary/0 via-secondary/5 to-secondary/0 opacity-60"></div>
                                    )}
                                </button>
                            </div>
                        );
                    })}
                    
                    {!isMobile && (
                        <div className="relative">
                            <button
                                onClick={() => handleItemClick(userMenuItem.id)}
                                className={`group relative flex items-center justify-start overflow-hidden transition-all duration-300 ease-in-out hover:scale-105 ${
                                    expandedItem === userMenuItem.id
                                        ? 'bg-white/10 border border-white/20 shadow-lg'
                                        : 'bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/25'
                                } rounded-full h-12 ${expandedItem === userMenuItem.id ? 'pl-2 pr-3' : 'w-12 justify-center'}`}
                                style={{
                                    width: expandedItem === userMenuItem.id ? 'auto' : '3rem',
                                    minWidth: '3rem'
                                }}
                            >
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-secondary/30 to-secondary/10 flex items-center justify-center">
                                    <User className="h-4 w-4 text-secondary" />
                                </div>
                                <div className={`flex items-center whitespace-nowrap transition-all duration-300 ease-out overflow-hidden ${
                                        expandedItem === userMenuItem.id
                                            ? 'w-auto opacity-100 ml-2'
                                            : 'w-0 opacity-0 ml-0'
                                    }`}
                                >
                                    <span className="text-sm font-medium text-white">{userMenuItem.label}</span>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={(e) => { e.stopPropagation(); handleLogout(); }}
                                        title="Sair" 
                                        className="group/logout relative h-8 w-8 rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 transition-all duration-300 ease-out hover:scale-105 flex items-center justify-center ml-2"
                                    >
                                        <LogOut className="h-3 w-3 text-red-400 group-hover/logout:text-red-300 transition-colors duration-300" />
                                    </Button>
                                </div>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navigation;