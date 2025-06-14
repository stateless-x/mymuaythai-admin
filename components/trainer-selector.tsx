"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, UserPlus, UserMinus, User, MapPin } from "lucide-react";
import type { Trainer } from "@/lib/types";

interface TrainerSelectorProps {
  selectedTrainers: Trainer[];
  onTrainersChange: (trainers: Trainer[]) => void;
  disabled?: boolean;
  gymId?: string;
}

// Helper function for authenticated requests
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  
  // Get auth token if available
  const getAuthToken = (): string | null => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("auth-token");
    }
    return null;
  };
  
  const token = getAuthToken();
  
  const config: RequestInit = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    let errorDetails;
    try {
      errorDetails = await response.json();
    } catch {
      errorDetails = await response.text();
    }
    
    throw new Error(`API Error: ${response.status} ${response.statusText} - ${JSON.stringify(errorDetails)}`);
  }
  
  return response.json();
};

export function TrainerSelector({
  selectedTrainers,
  onTrainersChange,
  disabled = false,
  gymId,
}: TrainerSelectorProps) {
  const [availableTrainers, setAvailableTrainers] = useState<Trainer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Fetch available trainers (no gym and not freelancers)
  useEffect(() => {
    fetchAvailableTrainers();
  }, []);

  const fetchAvailableTrainers = async () => {
    setIsLoading(true);
    try {
      // Fetch trainers without gym and not freelancers
      const params = new URLSearchParams({
        isFreelance: "false",
        gymId: "null",
        includeInactive: "false",
        page: "1",
        pageSize: "100"
      });
      
      const response = await apiRequest(`/api/trainers?${params.toString()}`);
      const trainers = response.data?.trainers || response.trainers || response.data || response;
      setAvailableTrainers(Array.isArray(trainers) ? trainers : []);
    } catch (error) {
      console.error("Error fetching available trainers:", error);
      setAvailableTrainers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAvailableTrainers = availableTrainers.filter((trainer) => {
    if (!searchTerm) return true;
    const fullNameTh = `${trainer.first_name_th} ${trainer.last_name_th}`.toLowerCase();
    const fullNameEn = `${trainer.first_name_en} ${trainer.last_name_en}`.toLowerCase();
    const search = searchTerm.toLowerCase();
    return fullNameTh.includes(search) || fullNameEn.includes(search) || trainer.email?.toLowerCase().includes(search);
  });

  const handleAddTrainer = (trainer: Trainer) => {
    if (!selectedTrainers.find((t) => t.id === trainer.id)) {
      onTrainersChange([...selectedTrainers, trainer]);
    }
  };

  const handleRemoveTrainer = (trainerId: string) => {
    onTrainersChange(selectedTrainers.filter((t) => t.id !== trainerId));
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <User className="w-4 h-4" />
          จัดการครูมวย (Trainer Management)
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          เพิ่มหรือลบครูมวยที่ไม่มียิมและไม่ใช่ฟรีแลนซ์ เข้ามาในยิมนี้
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selected Trainers */}
        {selectedTrainers.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">ครูมวยที่เลือกแล้ว ({selectedTrainers.length})</h4>
            <div className="space-y-2">
              {selectedTrainers.map((trainer) => (
                <div
                  key={trainer.id}
                  className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">
                        {trainer.first_name_th} {trainer.last_name_th}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {trainer.first_name_en} {trainer.last_name_en}
                      </div>
                      {trainer.province && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          {trainer.province.name_th}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {trainer.exp_year || 0} ปี
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemoveTrainer(trainer.id)}
                      disabled={disabled}
                      className="h-8 w-8 p-0"
                    >
                      <UserMinus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search and Add Trainers */}
        <div>
          <h4 className="text-sm font-medium mb-2">เพิ่มครูมวยใหม่</h4>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="ค้นหาชื่อครูมวยหรืออีเมล..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              disabled={disabled}
            />
          </div>

          <ScrollArea className="h-64 border rounded-lg">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                กำลังโหลด...
              </div>
            ) : filteredAvailableTrainers.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {searchTerm ? "ไม่พบครูมวยที่ตรงกับการค้นหา" : "ไม่มีครูมวยที่พร้อมใช้งาน"}
              </div>
            ) : (
              <div className="p-2 space-y-2">
                {filteredAvailableTrainers.map((trainer) => {
                  const isSelected = selectedTrainers.find((t) => t.id === trainer.id);
                  return (
                    <div
                      key={trainer.id}
                      className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                        isSelected 
                          ? "bg-gray-100 border-gray-300" 
                          : "hover:bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">
                            {trainer.first_name_th} {trainer.last_name_th}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {trainer.first_name_en} {trainer.last_name_en}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {trainer.email}
                          </div>
                          {trainer.province && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="w-3 h-3" />
                              {trainer.province.name_th}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {trainer.exp_year || 0} ปี
                        </Badge>
                        <Button
                          size="sm"
                          variant={isSelected ? "secondary" : "default"}
                          onClick={() => isSelected ? handleRemoveTrainer(trainer.id) : handleAddTrainer(trainer)}
                          disabled={disabled}
                          className="h-8 w-8 p-0"
                        >
                          {isSelected ? (
                            <UserMinus className="w-3 h-3" />
                          ) : (
                            <UserPlus className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
} 