"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { GitBranch, CheckCircle } from "lucide-react"
import { useHiperfocos } from "@/hooks/use-hiperfocos"

export function VisualizadorProjetos() {
  const { getProjectsWithTasks, updateTask } = useHiperfocos()
  const projectsWithTasks = getProjectsWithTasks()

  const handleTaskToggle = async (taskId: string, completed: boolean) => {
    await updateTask(taskId, { completed })
  }

  const getProjectProgress = (tasks: any[]) => {
    if (tasks.length === 0) return 0
    const completedTasks = tasks.filter((task) => task.completed).length
    return Math.round((completedTasks / tasks.length) * 100)
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <GitBranch className="w-5 h-5 mr-2 text-green-400" />
          Visualização em Árvore de Projetos
        </CardTitle>
      </CardHeader>
      <CardContent>
        {projectsWithTasks.length === 0 ? (
          <div className="p-8 border border-dashed border-slate-600 rounded-lg text-center">
            <p className="text-slate-400">
              Nenhum hiperfoco encontrado. Crie seu primeiro hiperfoco na guia "Conversor de Interesses".
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {projectsWithTasks.map((project) => {
              const progress = getProjectProgress(project.tasks || [])
              const completedTasks = project.tasks?.filter((task) => task.completed).length || 0
              const totalTasks = project.tasks?.length || 0

              return (
                <div key={project.id} className="space-y-3">
                  {/* Project Header */}
                  <div className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: project.color }} />
                      <div>
                        <h3 className="text-white font-medium">{project.title}</h3>
                        {project.description && <p className="text-slate-400 text-sm">{project.description}</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-medium">{progress}%</div>
                      <div className="text-slate-400 text-xs">
                        {completedTasks}/{totalTasks} tarefas
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <Progress value={progress} className="w-full" />

                  {/* Tasks List */}
                  {project.tasks && project.tasks.length > 0 && (
                    <div className="ml-6 space-y-2">
                      {project.tasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center space-x-3 p-3 bg-slate-750 rounded border-l-2"
                          style={{ borderLeftColor: project.color }}
                        >
                          <Checkbox
                            checked={task.completed}
                            onCheckedChange={(checked) => handleTaskToggle(task.id!, !!checked)}
                          />
                          <div className="flex-1">
                            <span
                              className={`text-sm ${task.completed ? "text-slate-400 line-through" : "text-white"}`}
                            >
                              {task.title}
                            </span>
                            {task.description && <p className="text-slate-500 text-xs mt-1">{task.description}</p>}
                          </div>
                          {task.completed && <CheckCircle className="w-4 h-4 text-green-400" />}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Time Limit Info */}
                  {project.time_limit && (
                    <div className="ml-6 text-slate-400 text-xs">⏱️ Tempo limite: {project.time_limit} minutos</div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
