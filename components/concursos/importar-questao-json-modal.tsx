"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Upload,
  Download,
  Save,
  FileText,
  CheckCircle,
  AlertCircle,
  Eye,
  X,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

interface ImportarQuestaoJsonModalProps {
  isOpen: boolean;
  onClose: () => void;
  competitionId: string;
  subjects: Subject[];
  onSuccess: () => void;
}

interface Subject {
  id: string;
  name: string;
  progress: number;
}

interface ImportedQuestion {
  question_text: string;
  question_type: "multiple_choice" | "true_false" | "essay" | "fill_blank";
  options?: any[];
  correct_answer?: string;
  correct_options?: number[];
  explanation?: string;
  difficulty: "facil" | "medio" | "dificil";
  points?: number;
  time_limit_seconds?: number;
  tags?: string[];
  source?: string;
  year?: number;
  subject_name?: string;
  topic_name?: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  question: ImportedQuestion;
  index: number;
}

export function ImportarQuestaoJsonModal({
  isOpen,
  onClose,
  competitionId,
  subjects,
  onSuccess,
}: ImportarQuestaoJsonModalProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [validationResults, setValidationResults] = useState<
    ValidationResult[]
  >([]);
  const [importPreview, setImportPreview] = useState<ImportedQuestion[]>([]);
  const [activeTab, setActiveTab] = useState("upload");

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/json" && !file.name.endsWith(".json")) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione um arquivo JSON válido.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setJsonText(content);
      validateAndPreview(content);
    };
    reader.readAsText(file);
  };

  const validateAndPreview = (jsonContent: string) => {
    try {
      const parsed = JSON.parse(jsonContent);
      const questions = Array.isArray(parsed) ? parsed : [parsed];

      const results: ValidationResult[] = [];
      const validQuestions: ImportedQuestion[] = [];

      questions.forEach((question: any, index: number) => {
        const validation = validateQuestion(question, index);
        results.push(validation);

        if (validation.isValid) {
          validQuestions.push(validation.question);
        }
      });

      setValidationResults(results);
      setImportPreview(validQuestions);
      setActiveTab("preview");
    } catch (error) {
      toast({
        title: "JSON inválido",
        description:
          "O arquivo JSON não pôde ser lido. Verifique a formatação.",
        variant: "destructive",
      });
    }
  };

  const validateQuestion = (question: any, index: number): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validações obrigatórias
    if (!question.question_text || typeof question.question_text !== "string") {
      errors.push("Texto da questão é obrigatório");
    }

    if (
      !["multiple_choice", "true_false", "essay", "fill_blank"].includes(
        question.question_type,
      )
    ) {
      errors.push("Tipo de questão inválido");
    }

    if (!["facil", "medio", "dificil"].includes(question.difficulty)) {
      errors.push("Dificuldade deve ser: facil, medio ou dificil");
    }

    // Validações específicas por tipo
    if (question.question_type === "multiple_choice") {
      if (
        !question.options ||
        !Array.isArray(question.options) ||
        question.options.length < 2
      ) {
        errors.push(
          "Questões de múltipla escolha precisam de pelo menos 2 opções",
        );
      } else {
        const hasCorrectOption = question.options.some(
          (opt: any) => opt.isCorrect === true,
        );
        if (!hasCorrectOption) {
          errors.push("Pelo menos uma opção deve estar marcada como correta");
        }
      }
    }

    if (question.question_type === "true_false") {
      if (
        !question.correct_answer ||
        !["Verdadeiro", "Falso", "True", "False"].includes(
          question.correct_answer,
        )
      ) {
        errors.push(
          'Questões verdadeiro/falso precisam de correct_answer: "Verdadeiro" ou "Falso"',
        );
      }
    }

    if (["essay", "fill_blank"].includes(question.question_type)) {
      if (
        !question.correct_answer ||
        typeof question.correct_answer !== "string"
      ) {
        errors.push(
          "Questões dissertativas e de preenchimento precisam de correct_answer",
        );
      }
    }

    // Validações opcionais com warnings
    if (question.points && (question.points < 1 || question.points > 10)) {
      warnings.push("Pontuação recomendada entre 1 e 10");
    }

    if (question.year && (question.year < 1900 || question.year > 2100)) {
      warnings.push("Ano deve estar entre 1900 e 2100");
    }

    if (
      question.subject_name &&
      !subjects.find((s) => s.name === question.subject_name)
    ) {
      warnings.push(
        `Matéria "${question.subject_name}" não encontrada no concurso`,
      );
    }

    // Questão processada
    const processedQuestion: ImportedQuestion = {
      question_text: question.question_text,
      question_type: question.question_type,
      difficulty: question.difficulty,
      options: question.options || [],
      correct_answer: question.correct_answer || "",
      correct_options: question.correct_options || [],
      explanation: question.explanation || "",
      points: question.points || 1,
      time_limit_seconds: question.time_limit_seconds || 120,
      tags: Array.isArray(question.tags) ? question.tags : [],
      source: question.source || "",
      year: question.year || new Date().getFullYear(),
      subject_name: question.subject_name || "",
      topic_name: question.topic_name || "",
    };

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      question: processedQuestion,
      index,
    };
  };

  const handleImport = async () => {
    if (importPreview.length === 0) {
      toast({
        title: "Nenhuma questão válida",
        description: "Não há questões válidas para importar.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const questionsToInsert = await Promise.all(
        importPreview.map(async (question) => {
          let subjectId = null;
          let topicId = null;

          // Tentar encontrar a matéria
          if (question.subject_name) {
            const subject = subjects.find(
              (s) => s.name === question.subject_name,
            );
            if (subject) {
              subjectId = subject.id;

              // Se há tópico especificado, criar se não existir
              if (question.topic_name) {
                const { data: existingTopic } = await supabase
                  .from("competition_topics")
                  .select("id")
                  .eq("subject_id", subject.id)
                  .eq("name", question.topic_name)
                  .single();

                if (existingTopic) {
                  topicId = existingTopic.id;
                } else {
                  // Criar novo tópico
                  const { data: newTopic, error: topicError } = await supabase
                    .from("competition_topics")
                    .insert([
                      {
                        subject_id: subject.id,
                        name: question.topic_name,
                        completed: false,
                      },
                    ])
                    .select()
                    .single();

                  if (!topicError && newTopic) {
                    topicId = newTopic.id;
                  }
                }
              }
            }
          }

          return {
            competition_id: competitionId,
            subject_id: subjectId,
            topic_id: topicId,
            question_text: question.question_text,
            question_type: question.question_type,
            options: question.options,
            correct_answer: question.correct_answer,
            correct_options: question.correct_options,
            explanation: question.explanation || null,
            difficulty: question.difficulty,
            points: question.points,
            time_limit_seconds:
              question.time_limit_seconds && question.time_limit_seconds > 0
                ? question.time_limit_seconds
                : null,
            tags: question.tags,
            source: question.source || null,
            year: question.year,
            is_ai_generated: false,
            is_active: true,
            usage_count: 0,
          };
        }),
      );

      const { error } = await supabase
        .from("competition_questions")
        .insert(questionsToInsert);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: `${questionsToInsert.length} questões importadas com sucesso!`,
      });

      onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      console.error("Erro ao importar questões:", error);
      toast({
        title: "Erro",
        description: "Não foi possível importar as questões. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setJsonText("");
    setValidationResults([]);
    setImportPreview([]);
    setActiveTab("upload");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        question_text: "Qual é a capital do Brasil?",
        question_type: "multiple_choice",
        options: [
          { text: "São Paulo", isCorrect: false },
          { text: "Rio de Janeiro", isCorrect: false },
          { text: "Brasília", isCorrect: true },
          { text: "Belo Horizonte", isCorrect: false },
        ],
        correct_answer: "Brasília",
        explanation: "Brasília é a capital federal do Brasil desde 1960.",
        difficulty: "facil",
        points: 1,
        time_limit_seconds: 120,
        tags: ["geografia", "capitais", "brasil"],
        source: "Conhecimento Geral",
        year: 2024,
        subject_name: "Geografia",
        topic_name: "Capitais",
      },
      {
        question_text: "O Brasil foi descoberto em 1500.",
        question_type: "true_false",
        correct_answer: "Verdadeiro",
        explanation:
          "Pedro Álvares Cabral chegou ao Brasil em 22 de abril de 1500.",
        difficulty: "medio",
        points: 1,
        time_limit_seconds: 60,
        tags: ["história", "descobrimento"],
        source: "História do Brasil",
        year: 2024,
      },
    ];

    const dataStr = JSON.stringify(template, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "template-questoes.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const validQuestions = validationResults.filter((r) => r.isValid).length;
  const totalQuestions = validationResults.length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Questões via JSON</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload & Validação</TabsTrigger>
            <TabsTrigger value="preview" disabled={importPreview.length === 0}>
              Preview ({validQuestions}/{totalQuestions})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            {/* Template Download */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Template JSON
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Baixe um template JSON com exemplos de questões para facilitar
                  a importação.
                </p>
                <Button variant="outline" onClick={downloadTemplate}>
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Template
                </Button>
              </CardContent>
            </Card>

            {/* Upload Methods */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* File Upload */}
              <Card>
                <CardHeader>
                  <CardTitle>Upload de Arquivo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground mb-4">
                        Arraste um arquivo JSON ou clique para selecionar
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Selecionar Arquivo
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Direct JSON Input */}
              <Card>
                <CardHeader>
                  <CardTitle>Colar JSON</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Cole seu JSON aqui..."
                      value={jsonText}
                      onChange={(e) => setJsonText(e.target.value)}
                      rows={8}
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      onClick={() => validateAndPreview(jsonText)}
                      disabled={!jsonText.trim()}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Validar & Preview
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Validation Results */}
            {validationResults.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {validQuestions === totalQuestions ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                    )}
                    Resultado da Validação
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <Badge
                        variant="default"
                        className="bg-green-100 text-green-800"
                      >
                        {validQuestions} Válidas
                      </Badge>
                      <Badge variant="destructive">
                        {totalQuestions - validQuestions} Com Erro
                      </Badge>
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {validationResults.map((result, index) => (
                        <div key={index} className="border rounded p-3">
                          <div className="flex items-center gap-2 mb-2">
                            {result.isValid ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span className="font-medium">
                              Questão {index + 1}
                            </span>
                          </div>

                          {result.errors.length > 0 && (
                            <div className="mb-2">
                              {result.errors.map((error, errorIndex) => (
                                <p
                                  key={errorIndex}
                                  className="text-sm text-red-600"
                                >
                                  • {error}
                                </p>
                              ))}
                            </div>
                          )}

                          {result.warnings.length > 0 && (
                            <div>
                              {result.warnings.map((warning, warningIndex) => (
                                <p
                                  key={warningIndex}
                                  className="text-sm text-yellow-600"
                                >
                                  ⚠ {warning}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            {/* Preview Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Preview das Questões ({importPreview.length})
              </h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setActiveTab("upload")}
                >
                  Voltar
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={loading || importPreview.length === 0}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Importando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Importar {importPreview.length} Questões
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Questions Preview */}
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {importPreview.map((question, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {question.question_type === "multiple_choice"
                            ? "Múltipla Escolha"
                            : question.question_type === "true_false"
                              ? "V/F"
                              : question.question_type === "essay"
                                ? "Dissertativa"
                                : "Preencher Lacunas"}
                        </Badge>
                        <Badge variant="secondary">{question.difficulty}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {question.points} pts
                        </span>
                      </div>

                      <h4 className="font-medium line-clamp-2">
                        {question.question_text}
                      </h4>

                      {question.options && question.options.length > 0 && (
                        <div className="space-y-1">
                          {question.options.map(
                            (option: any, optIndex: number) => (
                              <div
                                key={optIndex}
                                className="flex items-center gap-2 text-sm"
                              >
                                <span
                                  className={
                                    option.isCorrect
                                      ? "text-green-600 font-medium"
                                      : "text-muted-foreground"
                                  }
                                >
                                  {String.fromCharCode(65 + optIndex)}){" "}
                                  {option.text}
                                  {option.isCorrect && " ✓"}
                                </span>
                              </div>
                            ),
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {question.subject_name && (
                          <span>Matéria: {question.subject_name}</span>
                        )}
                        {question.topic_name && (
                          <span>Tópico: {question.topic_name}</span>
                        )}
                        {question.source && (
                          <span>Fonte: {question.source}</span>
                        )}
                        <span>Ano: {question.year}</span>
                      </div>

                      {question.tags && question.tags.length > 0 && (
                        <div className="flex gap-1">
                          {question.tags.map((tag, tagIndex) => (
                            <Badge
                              key={tagIndex}
                              variant="outline"
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => {
              onClose();
              resetForm();
            }}
            disabled={loading}
          >
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
