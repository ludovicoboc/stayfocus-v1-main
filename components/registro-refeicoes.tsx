"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateNavigation } from "@/components/ui/date-navigation";
import { X, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-provider";
import { getCurrentDateString } from "@/lib/utils";

interface MealRecord {
  id: string;
  time: string;
  description: string;
  created_at: string;
}

export function RegistroRefeicoes({ date }: { date?: string }) {
  const { user } = useAuth();
  const supabase = createClient();
  const [records, setRecords] = useState<MealRecord[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRecordTime, setNewRecordTime] = useState("");
  const [newRecordDescription, setNewRecordDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState<string>(
    date || getCurrentDateString(),
  );

  useEffect(() => {
    if (date) {
      setCurrentDate(date);
    }
  }, [date]);

  useEffect(() => {
    if (user) {
      fetchRecords(currentDate);
    }
  }, [user, currentDate]);

  const handleDateChange = (newDate: string) => {
    setCurrentDate(newDate);
  };

  const fetchRecords = async (targetDate: string) => {
    if (!user) return;

    try {
      const start = `${targetDate}T00:00:00`;
      const end = `${targetDate}T23:59:59.999`;
      const { data, error } = await supabase
        .from("meal_records")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", start)
        .lte("created_at", end)
        .order("time");

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error("Error fetching records:", error);
    } finally {
      setLoading(false);
    }
  };

  const addRecord = async () => {
    if (!user || !newRecordTime || !newRecordDescription) return;

    try {
      const { data, error } = await supabase
        .from("meal_records")
        .insert({
          user_id: user.id,
          time: newRecordTime,
          description: newRecordDescription,
        })
        .select()
        .single();

      if (error) throw error;

      setRecords([...records, data]);
      setNewRecordTime("");
      setNewRecordDescription("");
      setShowAddForm(false);
    } catch (error) {
      console.error("Error adding record:", error);
    }
  };

  const deleteRecord = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("meal_records")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      setRecords(records.filter((record) => record.id !== id));
    } catch (error) {
      console.error("Error deleting record:", error);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="mb-6">
          <DateNavigation
            date={currentDate}
            onDateChangeAction={handleDateChange}
            title="Refeições"
            className="mb-4"
          />
        </div>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Registro de Refeições</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-slate-400">Carregando...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <DateNavigation
          date={currentDate}
          onDateChangeAction={handleDateChange}
          title="Refeições"
          className="mb-4"
        />
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Registro de Refeições</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {records.map((record) => (
            <div
              key={record.id}
              className="flex items-center justify-between p-3 bg-slate-700 rounded-lg"
            >
              <div>
                <div className="text-white font-medium">
                  {record.time} {record.description}
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-slate-400 hover:text-red-400"
                onClick={() => deleteRecord(record.id)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}

          {showAddForm ? (
            <div className="border border-slate-600 rounded-lg p-4 space-y-3">
              <div className="flex space-x-2">
                <Input
                  type="time"
                  value={newRecordTime}
                  onChange={(e) => setNewRecordTime(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                />
                <Input
                  placeholder="Descrição da refeição"
                  value={newRecordDescription}
                  onChange={(e) => setNewRecordDescription(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white flex-1"
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={addRecord}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={!newRecordTime || !newRecordDescription}
                >
                  Salvar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewRecordTime("");
                    setNewRecordDescription("");
                  }}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => setShowAddForm(true)}
              className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 border border-dashed border-slate-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Registro
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Export default para lazy loading
export default RegistroRefeicoes;
