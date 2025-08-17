export const DEFAULT_EXPENSE_CATEGORIES = [
  {
    name: "Alimentação",
    color: "#f59e0b", // amber-500
    icon: "🍽️"
  },
  {
    name: "Transporte",
    color: "#3b82f6", // blue-500
    icon: "🚗"
  },
  {
    name: "Moradia",
    color: "#10b981", // emerald-500
    icon: "🏠"
  },
  {
    name: "Saúde",
    color: "#ef4444", // red-500
    icon: "⚕️"
  },
  {
    name: "Educação",
    color: "#8b5cf6", // violet-500
    icon: "📚"
  },
  {
    name: "Lazer",
    color: "#f97316", // orange-500
    icon: "🎯"
  },
  {
    name: "Compras",
    color: "#ec4899", // pink-500
    icon: "🛍️"
  },
  {
    name: "Outros",
    color: "#6b7280", // gray-500
    icon: "📋"
  }
]

export const criarCategoriasDefault = async (supabase: any, userId: string) => {
  try {
    const categoriasData = DEFAULT_EXPENSE_CATEGORIES.map(categoria => ({
      ...categoria,
      user_id: userId
    }))

    const { error } = await supabase
      .from("expense_categories")
      .insert(categoriasData)

    if (error) throw error
    return true
  } catch (error) {
    console.error("Error creating default categories:", error)
    return false
  }
}
