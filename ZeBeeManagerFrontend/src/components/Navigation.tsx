import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { BarChart3, UserPlus, Building2, Search, Menu, LogOut, User } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from '@/context/AuthContext'; // Importar o hook de autenticação
import api from '@/lib/api';

const Navigation = () => {
  const { user } = useAuth(); // Usar o hook para obter dados do usuário
  const isSuperuser = user?.is_superuser;
  const username = user?.username;

  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setSearchTerm(searchParams.get('q') || '');
  }, [searchParams]);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

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

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
        await api.post('/auth/logout/');
    } catch (error) {
        console.error("Erro no logout da API, mas deslogando localmente:", error);
    } finally {
        localStorage.removeItem('authToken');
        window.location.href = '/'; // Força o recarregamento para limpar o estado
    }
  };

  return (
    <nav className="bg-background border-b sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <img src='/ZeBeeManager.png' className="h-10 w-10 md:h-12 md:w-12" alt="ZeBee.Manager Logo" style={{ filter: 'brightness(0) saturate(100%) invert(29%) sepia(90%) saturate(1470%) hue-rotate(200deg) brightness(96%) contrast(93%)' }} />
            <span className="hidden sm:block text-lg lg:text-xl font-bold text-foreground">ZeBee.Manager</span>
          </div>
          
          <div className="flex-1 flex justify-center px-4 sm:px-8">
            <form onSubmit={handleSearchSubmit} className="w-full max-w-lg">
                <div className="relative">
                    <Input
                        type="search"
                        placeholder="Pesquisar..."
                        className="pl-10 w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Button type="submit" variant="ghost" size="icon" className="absolute left-1 top-1/2 -translate-y-1/2 h-8 w-8">
                        <Search className="h-4 w-4 text-muted-foreground" />
                    </Button>
                </div>
            </form>
          </div>

          <div className="hidden md:flex items-center space-x-2">
            {/* Link do Dashboard condicional */}
            {isSuperuser && (
              <Link to="/dashboard" className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors ${ isActive('/dashboard') ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'}`}>
                <BarChart3 className="h-4 w-4" />
                Dashboard
              </Link>
            )}
            <Link to="/registrar" className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors ${ isActive('/registrar') ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'}`}>
              <UserPlus className="h-4 w-4" />
              Registrar
            </Link>
            <Link to="/lista-clientes" className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors ${ isActive('/lista-clientes') ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'}`}>
              <Building2 className="h-4 w-4" />
              Clientes
            </Link>
            <ThemeToggle />
            {username && (
                <div className="flex items-center gap-2 border-l pl-2 ml-2">
                    <Avatar className="h-8 w-8">
                        <AvatarFallback>
                            <User className="h-4 w-4" />
                        </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-foreground">{username}</span>
                </div>
            )}
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Sair">
                <LogOut className="h-4 w-4 text-red-500"/>
            </Button>
          </div>

          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Abrir menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] flex flex-col p-0">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle className="text-left text-lg">Menu</SheetTitle>
                </SheetHeader>
                
                <div className="flex-1 overflow-y-auto">
                  <nav className="p-4 space-y-2">
                    {isSuperuser && (
                      <Link to="/dashboard" onClick={handleLinkClick} className={`flex items-center gap-3 p-3 rounded-lg font-medium transition-colors text-base ${ isActive('/dashboard') ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'text-muted-foreground hover:bg-muted'}`}>
                        <BarChart3 className="h-5 w-5" />
                        Dashboard
                      </Link>
                    )}
                    <Link to="/registrar" onClick={handleLinkClick} className={`flex items-center gap-3 p-3 rounded-lg font-medium transition-colors text-base ${ isActive('/registrar') ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'text-muted-foreground hover:bg-muted'}`}>
                      <UserPlus className="h-5 w-5" />
                      Registrar
                    </Link>
                    <Link to="/lista-clientes" onClick={handleLinkClick} className={`flex items-center gap-3 p-3 rounded-lg font-medium transition-colors text-base ${ isActive('/lista-clientes') ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'text-muted-foreground hover:bg-muted'}`}>
                      <Building2 className="h-5 w-5" />
                      Clientes
                    </Link>
                  </nav>
                </div>

                <div className="p-4 border-t mt-auto">
                    {username && (
                        <div className="flex items-center gap-3 mb-4">
                            <Avatar className="h-9 w-9">
                                <AvatarFallback>
                                    <User className="h-5 w-5" />
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-semibold text-foreground">{username}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center">
                        <ThemeToggle />
                        <Button variant="ghost" onClick={handleLogout} className="text-red-500 hover:text-red-500 hover:bg-red-500/10">
                            Sair
                            <LogOut className="ml-2 h-5 w-5"/>
                        </Button>
                    </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Navigation;
