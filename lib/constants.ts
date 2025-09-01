import {
  Home,
  Utensils,
  ChefHat,
  BookOpen,
  Heart,
  Gamepad2,
  DollarSign,
  Zap,
  Moon,
  User,
  Map,
  Trophy,
  Brain,
  Target,
  History,
} from "lucide-react"

export const NAVIGATION_ITEMS = [
  {
    title: "Início",
    url: "/",
    icon: Home,
    description: "Dashboard principal",
  },
  {
    title: "Alimentação",
    url: "/alimentacao",
    icon: Utensils,
    description: "Planejamento de refeições e hidratação",
  },
  {
    title: "Receitas",
    url: "/receitas",
    icon: ChefHat,
    description: "Suas receitas e lista de compras",
  },
  {
    title: "Estudos",
    url: "/estudos",
    icon: BookOpen,
    description: "Pomodoro, simulados e materiais",
  },
  {
    title: "Concursos",
    url: "/concursos",
    icon: Trophy,
    description: "Gerenciamento de concursos",
  },
  {
    title: "Autoconhecimento",
    url: "/autoconhecimento",
    icon: Target,
    description: "Notas pessoais e reflexões",
  },
  {
    title: "Saúde",
    url: "/saude",
    icon: Heart,
    description: "Medicamentos e monitoramento",
  },
  {
    title: "Sono",
    url: "/sono",
    icon: Moon,
    description: "Registro e análise do sono",
  },
  {
    title: "Lazer",
    url: "/lazer",
    icon: Gamepad2,
    description: "Atividades de descanso",
  },
  {
    title: "Finanças",
    url: "/financas",
    icon: DollarSign,
    description: "Controle financeiro",
  },
  {
    title: "Hiperfocos",
    url: "/hiperfocos",
    icon: Zap,
    description: "Gestão de interesses intensos",
  },
] as const

export const SECONDARY_NAVIGATION_ITEMS = [
  {
    title: "Histórico",
    url: "/historico",
    icon: History,
    description: "Histórico completo de atividades",
  },
  {
    title: "Perfil",
    url: "/perfil",
    icon: User,
    description: "Configurações pessoais",
  },
  {
    title: "Roadmap",
    url: "/roadmap",
    icon: Map,
    description: "Desenvolvimento da aplicação",
  },
] as const

export const DASHBOARD_MODULES = [
  {
    titulo: "Alimentação",
    descricao: "Gerencie receitas e planejamento alimentar",
    icone: Utensils,
    href: "/alimentacao",
    cor: "bg-orange-600",
  },
  {
    titulo: "Saúde",
    descricao: "Monitore medicamentos e bem-estar",
    icone: Heart,
    href: "/saude",
    cor: "bg-red-600",
  },
  {
    titulo: "Finanças",
    descricao: "Controle gastos e orçamento",
    icone: DollarSign,
    href: "/financas",
    cor: "bg-green-600",
  },
  {
    titulo: "Estudos",
    descricao: "Organize estudos e simulados",
    icone: BookOpen,
    href: "/estudos",
    cor: "bg-blue-600",
  },
  {
    titulo: "Concursos",
    descricao: "Gerencie concursos e provas",
    icone: Trophy,
    href: "/concursos",
    cor: "bg-purple-600",
  },
  {
    titulo: "Hiperfocos",
    descricao: "Gerencie interesses intensos",
    icone: Brain,
    href: "/hiperfocos",
    cor: "bg-indigo-600",
  },
  {
    titulo: "Lazer",
    descricao: "Planeje atividades de descanso",
    icone: Gamepad2,
    href: "/lazer",
    cor: "bg-pink-600",
  },
  {
    titulo: "Autoconhecimento",
    descricao: "Reflexões e desenvolvimento pessoal",
    icone: Target,
    href: "/autoconhecimento",
    cor: "bg-yellow-600",
  },
] as const

export const COLOR_OPTIONS = [
  { valor: "#3b82f6", nome: "Azul" },
  { valor: "#ef4444", nome: "Vermelho" },
  { valor: "#10b981", nome: "Verde" },
  { valor: "#f59e0b", nome: "Amarelo" },
  { valor: "#8b5cf6", nome: "Roxo" },
  { valor: "#ec4899", nome: "Rosa" },
] as const