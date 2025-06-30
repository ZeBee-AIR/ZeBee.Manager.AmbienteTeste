import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, UserPlus, Building2, Search } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle'; // Caminho corrigido
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/lista-clientes?q=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm(''); // Opcional: limpa o campo após a busca
    }
  };

  return (
    <nav className="bg-background border-b sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <img src='/ZeBeeManager.png' className="h-10 w-10 sm:h-8 sm:w-8 md:h-10 md:w-10 lg:h-14 lg:w-14" alt="ZeBee.Manager Logo" style={{ filter: 'brightness(0) saturate(100%) invert(29%) sepia(90%) saturate(1470%) hue-rotate(200deg) brightness(96%) contrast(93%)' }} />
            <span className="text-base md:text-lg lg:text-xl font-bold text-foreground">ZeBee.Manager</span>
          </div>
          
          <div className="flex-1 flex justify-center px-8">
            <form onSubmit={handleSearchSubmit} className="w-full max-w-lg">
                <div className="relative">
                    <Input
                        type="search"
                        placeholder="Pesquisar empresa pelo nome..."
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

          <div className="flex items-center space-x-4">
            <div className="flex space-x-1">
              <Link
                to="/"
                className={`flex items-center gap-2 sm:px-2 sm:py-1 md:px-4 md:py-2 lg:px-4 lg:py-2 rounded-lg font-medium transition-colors ${
                  isActive('/') 
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
                    : 'text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                Dashboard
              </Link>
              <Link
                to="/registrar"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActive('/registrar') 
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
                    : 'text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                }`}
              >
                <UserPlus className="h-4 w-4" />
                Registrar
              </Link>
              {/* NOVO LINK ADICIONADO */}
              <Link
                to="/lista-clientes"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActive('/lista-clientes') 
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
                    : 'text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                }`}
              >
                <Building2 className="h-4 w-4" />
                Clientes
              </Link>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
