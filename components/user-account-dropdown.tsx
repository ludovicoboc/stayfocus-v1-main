"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Settings,
  Target,
  Eye,
  Download,
  HelpCircle,
  LogOut,
  Loader2,
  ChevronRight,
  Shield,
  Bell,
  Palette,
  Calendar,
  BarChart3,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface UserAccountDropdownProps {
  children: React.ReactNode;
}

// Export default para lazy loading
export default UserAccountDropdown;

export function UserAccountDropdown({ children }: UserAccountDropdownProps) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
      router.push("/");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      toast({
        title: "Erro ao sair",
        description: "Ocorreu um erro ao tentar fazer logout. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleNavigateToProfile = () => {
    router.push("/perfil");
  };

  const handleNavigateToHelp = () => {
    router.push("/perfil/ajuda");
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "notifications":
        // In a real app, this would toggle notifications or navigate to notification settings
        toast({
          title: "Notificações",
          description: "Configurações de notificação em desenvolvimento.",
        });
        break;
      case "theme":
        // In a real app, this would toggle theme or navigate to theme settings
        toast({
          title: "Tema",
          description: "Configurações de tema em desenvolvimento.",
        });
        break;
      case "privacy":
        // Navigate to privacy settings
        router.push("/perfil#privacidade");
        break;
      default:
        break;
    }
  };

  const getUserInitials = (email: string) => {
    return email
      .split("@")[0]
      .split(".")
      .map((name) => name.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2);
  };

  const getUserDisplayName = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    if (user?.email) {
      return user.email.split("@")[0];
    }
    return "Usuário";
  };

  const getAccountStatus = () => {
    // In a real app, this would come from user metadata or subscription info
    return "Ativo";
  };

  const getJoinDate = () => {
    if (user?.created_at) {
      return new Date(user.created_at).toLocaleDateString("pt-BR", {
        month: "short",
        year: "numeric",
      });
    }
    return "Recente";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-2">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-59 sm:w-67 max-w-[calc(100vw-2rem)]"
          sideOffset={8}
        >
          <DropdownMenuLabel>
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  Não conectado
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  Faça login para acessar configurações
                </p>
              </div>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-67 sm:w-75 md:w-91 max-w-[calc(100vw-2rem)]"
        sideOffset={8}
      >
        <DropdownMenuLabel className="font-normal p-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12 ring-2 ring-primary/10">
              <AvatarImage src={user.user_metadata?.avatar_url} />
              <AvatarFallback className="text-sm font-semibold bg-primary/10">
                {user.email ? getUserInitials(user.email) : "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold leading-none">
                  {getUserDisplayName()}
                </p>
                <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                  {getAccountStatus()}
                </Badge>
              </div>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                Membro desde {getJoinDate()}
              </p>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Profile and Account Management */}
        <DropdownMenuItem onClick={handleNavigateToProfile} className="p-3">
          <User className="mr-3 h-4 w-4 text-blue-600" />
          <div className="flex flex-col">
            <span className="text-sm font-medium">Meu Perfil</span>
            <span className="text-xs text-muted-foreground">
              Informações pessoais e configurações
            </span>
          </div>
          <ChevronRight className="ml-auto h-4 w-4" />
        </DropdownMenuItem>

        {/* Account Settings */}
        <DropdownMenuItem
          onClick={() => router.push("/perfil#configuracoes")}
          className="p-3"
        >
          <Settings className="mr-3 h-4 w-4 text-gray-600" />
          <div className="flex flex-col">
            <span className="text-sm font-medium">Configurações da Conta</span>
            <span className="text-xs text-muted-foreground">
              Segurança, privacidade e notificações
            </span>
          </div>
          <ChevronRight className="ml-auto h-4 w-4" />
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleQuickAction("privacy")}
          className="p-3"
        >
          <Shield className="mr-3 h-4 w-4 text-red-600" />
          <div className="flex flex-col">
            <span className="text-sm font-medium">Privacidade e Segurança</span>
            <span className="text-xs text-muted-foreground">
              Controle de dados e segurança
            </span>
          </div>
          <ChevronRight className="ml-auto h-4 w-4" />
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Quick Settings Access */}
        <DropdownMenuItem
          onClick={() => router.push("/perfil#metas")}
          className="p-3"
        >
          <Target className="mr-3 h-4 w-4 text-green-600" />
          <div className="flex flex-col">
            <span className="text-sm font-medium">Metas Diárias</span>
            <span className="text-xs text-muted-foreground">
              Configurar objetivos pessoais
            </span>
          </div>
          <ChevronRight className="ml-auto h-4 w-4" />
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => router.push("/perfil#preferencias")}
          className="p-3"
        >
          <Eye className="mr-3 h-4 w-4 text-purple-600" />
          <div className="flex flex-col">
            <span className="text-sm font-medium">Preferências Visuais</span>
            <span className="text-xs text-muted-foreground">
              Alto contraste, texto grande
            </span>
          </div>
          <ChevronRight className="ml-auto h-4 w-4" />
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => router.push("/")} className="p-3">
          <BarChart3 className="mr-3 h-4 w-4 text-orange-600" />
          <div className="flex flex-col">
            <span className="text-sm font-medium">Estatísticas</span>
            <span className="text-xs text-muted-foreground">
              Progresso e relatórios
            </span>
          </div>
          <ChevronRight className="ml-auto h-4 w-4" />
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Data Management */}
        <DropdownMenuItem
          onClick={() => router.push("/perfil#backup")}
          className="p-3"
        >
          <Download className="mr-3 h-4 w-4 text-indigo-600" />
          <div className="flex flex-col">
            <span className="text-sm font-medium">Backup e Dados</span>
            <span className="text-xs text-muted-foreground">
              Exportar/importar configurações
            </span>
          </div>
          <ChevronRight className="ml-auto h-4 w-4" />
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Help and Support */}
        <DropdownMenuItem onClick={handleNavigateToHelp} className="p-3">
          <HelpCircle className="mr-3 h-4 w-4 text-amber-600" />
          <div className="flex flex-col">
            <span className="text-sm font-medium">Ajuda e Suporte</span>
            <span className="text-xs text-muted-foreground">
              Documentação e contato
            </span>
          </div>
          <ChevronRight className="ml-auto h-4 w-4" />
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Logout */}
        <DropdownMenuItem
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950 p-3"
        >
          {isSigningOut ? (
            <Loader2 className="mr-3 h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="mr-3 h-4 w-4" />
          )}
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {isSigningOut ? "Saindo..." : "Sair da Conta"}
            </span>
            <span className="text-xs text-muted-foreground">
              Encerrar sessão atual
            </span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
