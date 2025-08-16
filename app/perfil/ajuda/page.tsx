"use client"

import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { HelpCircle, Download, Brain, Code, AlertCircle } from "lucide-react"

export default function AjudaPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <PageHeader
        title="Ajuda e Tutoriais"
        breadcrumbs={[{ title: "Dashboard", href: "/" }, { title: "Perfil", href: "/perfil" }, { title: "Ajuda" }]}
      />

      <div className="space-y-6">
        {/* Backup e Restauração */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Backup e Restauração de Dados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <h4 className="font-semibold">Como fazer backup dos seus dados:</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Vá para a seção "Perfil" no menu lateral</li>
                <li>Clique em "Exportar Dados (JSON)" no card "Backup e Dados"</li>
                <li>O arquivo será baixado automaticamente com todos os seus dados</li>
                <li>Guarde este arquivo em local seguro (Google Drive, Dropbox, etc.)</li>
              </ol>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="font-semibold">Como restaurar seus dados:</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Clique em "Importar Dados" no card "Backup e Dados"</li>
                <li>Selecione o arquivo JSON que você exportou anteriormente</li>
                <li>Confirme a importação (isso substituirá todos os dados atuais)</li>
                <li>A aplicação será recarregada com seus dados restaurados</li>
              </ol>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-950 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div className="text-sm text-yellow-700 dark:text-yellow-300">
                  <strong>Importante:</strong> A importação substitui todos os dados atuais. Faça backup antes de
                  importar novos dados.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Criação de Simulados com IA */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Criando Simulados com IA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Use estes templates com ChatGPT, Claude ou Gemini para gerar simulados personalizados:
            </p>

            <div className="space-y-4">
              <div>
                <Badge variant="outline" className="mb-2">
                  Template para ChatGPT/Claude
                </Badge>
                <Card className="bg-muted">
                  <CardContent className="p-3">
                    <pre className="text-xs whitespace-pre-wrap font-mono">
                      {`Crie um simulado de [MATÉRIA] com [NÚMERO] questões sobre [TÓPICO ESPECÍFICO].

Formato JSON exato:
{
  "titulo": "Simulado de [MATÉRIA] - [TÓPICO]",
  "descricao": "Descrição do simulado",
  "questoes": [
    {
      "enunciado": "Texto da questão",
      "alternativas": [
        { "letra": "A", "texto": "Alternativa A", "correta": false },
        { "letra": "B", "texto": "Alternativa B", "correta": true },
        { "letra": "C", "texto": "Alternativa C", "correta": false },
        { "letra": "D", "texto": "Alternativa D", "correta": false },
        { "letra": "E", "texto": "Alternativa E", "correta": false }
      ],
      "explicacao": "Explicação detalhada da resposta correta"
    }
  ]
}`}
                    </pre>
                  </CardContent>
                </Card>
              </div>

              <div>
                <Badge variant="outline" className="mb-2">
                  Exemplo de Prompt Completo
                </Badge>
                <Card className="bg-muted">
                  <CardContent className="p-3">
                    <pre className="text-xs whitespace-pre-wrap">
                      {`Crie um simulado de Direito Constitucional com 10 questões sobre Direitos Fundamentais.

Requisitos:
- Questões de nível médio/difícil
- Baseadas na Constituição Federal de 1988
- Foco em direitos individuais e coletivos
- Inclua jurisprudência do STF quando relevante

Use EXATAMENTE o formato JSON que forneci acima.`}
                    </pre>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estruturas JSON */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Estruturas JSON Aceitas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Formato de Simulado:</h4>
                <Card className="bg-muted">
                  <CardContent className="p-3">
                    <pre className="text-xs whitespace-pre-wrap font-mono">
                      {`{
  "titulo": "Nome do Simulado",
  "descricao": "Descrição opcional",
  "questoes": [
    {
      "enunciado": "Pergunta da questão",
      "alternativas": [
        { "letra": "A", "texto": "Opção A", "correta": false },
        { "letra": "B", "texto": "Opção B", "correta": true }
      ],
      "explicacao": "Por que a resposta está correta"
    }
  ]
}`}
                    </pre>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Formato de Receitas:</h4>
                <Card className="bg-muted">
                  <CardContent className="p-3">
                    <pre className="text-xs whitespace-pre-wrap font-mono">
                      {`{
  "receitas": [
    {
      "titulo": "Nome da Receita",
      "categoria": "categoria",
      "tempoPreparo": 30,
      "porcoes": 4,
      "ingredientes": [
        { "nome": "Ingrediente", "quantidade": "1", "unidade": "xícara" }
      ],
      "modoPreparo": [
        "Passo 1",
        "Passo 2"
      ]
    }
  ]
}`}
                    </pre>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Perguntas Frequentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold">Como importar simulados criados com IA?</h4>
                <p className="text-sm text-muted-foreground">
                  Vá para Estudos → Simulado, clique em "Carregar Simulado" e cole o JSON gerado pela IA.
                </p>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold">Posso editar simulados depois de importar?</h4>
                <p className="text-sm text-muted-foreground">
                  Atualmente não há editor integrado. Recomendamos editar o JSON antes de importar.
                </p>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold">Como salvar simulados favoritos?</h4>
                <p className="text-sm text-muted-foreground">
                  Use o botão "Salvar nos Favoritos" após carregar um simulado. Eles ficam salvos localmente.
                </p>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold">Os dados ficam salvos na nuvem?</h4>
                <p className="text-sm text-muted-foreground">
                  Atualmente os dados ficam salvos localmente no seu navegador. Use a função de backup para não perder
                  dados.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
