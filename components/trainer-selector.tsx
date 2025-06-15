"use client";

import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { UserPlus, UserMinus, User, MapPin, Loader2, ChevronDown, ChevronUp, Users, Eye, RotateCcw, Mail, Phone, MessageCircle } from "lucide-react";
import type { Trainer } from "@/lib/types";

interface TrainerSelectorProps {
  selectedTrainers: Trainer[];
  onTrainersChange: (trainers: Trainer[]) => void;
  disabled?: boolean;
  gymId?: string;
  trainersToRemove?: string[];
  onTrainersToRemoveChange?: (trainerIds: string[]) => void;
  triggerRefresh?: number;
}

// Interface for methods that parent can call
export interface TrainerSelectorRef {
  handleTrainerUpdateSuccess: (response: any) => void;
  updateExistingTrainersFromAPI: (trainers: Trainer[]) => void;
  clearSelectedTrainersOnly: () => void;
  refreshExistingTrainers: () => void;
  // Complete list management methods
  getCompleteTrainerList: () => Trainer[];
  updateWithCompleteList: (trainers: Trainer[]) => void;
  handleSuccessfulUpdate: () => void;
  // Backup and restore methods
  createTrainerBackup: () => void;
  restoreFromBackup: () => void;
  // New methods for better control
  handleUpdateWithoutRefetch: () => void;
  manualRefresh: () => void;
}

// Backend trainer type that matches the actual API response
interface BackendTrainer {
  id: string;
  first_name_th: string;
  last_name_th: string | null;
  first_name_en: string;
  last_name_en: string | null;
  bio_th: string | null;
  bio_en: string | null;
  phone: string | null;
  email: string | null;
  line_id: string | null;
  is_freelance: boolean;
  gym_id: string | null;
  exp_year: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  province: {
    id: number;
    name_th: string;
    name_en: string;
  } | null;
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

// Convert backend trainer to frontend trainer format
const convertBackendTrainer = (backendTrainer: BackendTrainer): Trainer => {
  return {
    id: backendTrainer.id,
    first_name_th: backendTrainer.first_name_th,
    first_name_en: backendTrainer.first_name_en,
    last_name_th: backendTrainer.last_name_th || '',
    last_name_en: backendTrainer.last_name_en || '',
    email: backendTrainer.email || '',
    phone: backendTrainer.phone || undefined,
    bio_th: backendTrainer.bio_th || undefined,
    bio_en: backendTrainer.bio_en || undefined,
    is_active: backendTrainer.is_active,
    is_freelance: backendTrainer.is_freelance,
    line_id: backendTrainer.line_id || undefined,
    exp_year: backendTrainer.exp_year || undefined,
    province: backendTrainer.province || undefined,
    created_at: backendTrainer.created_at,
    updated_at: backendTrainer.updated_at,
    // Map gym_id to primaryGym structure if needed
    primaryGym: backendTrainer.gym_id ? { 
      id: backendTrainer.gym_id, 
      name_th: '', 
      name_en: '' 
    } : undefined
  };
};

export const TrainerSelector = forwardRef<TrainerSelectorRef, TrainerSelectorProps>(({
  selectedTrainers,
  onTrainersChange,
  disabled = false,
  gymId,
  trainersToRemove = [],
  onTrainersToRemoveChange,
  triggerRefresh,
}, ref) => {
  const [availableTrainers, setAvailableTrainers] = useState<Trainer[]>([]);
  const [existingGymTrainers, setExistingGymTrainers] = useState<Trainer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [lastSuccessfulUpdate, setLastSuccessfulUpdate] = useState<number>(0);
  // Add backup of trainers before updates
  const [backupTrainers, setBackupTrainers] = useState<Trainer[]>([]);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const pageSize = 50;

  // Fetch available trainers (active, no gym, not freelancer)
  useEffect(() => {
    fetchAvailableTrainers(1, true);
  }, []);

  // Fetch existing gym trainers if gymId is provided - only once per gymId
  useEffect(() => {
    // Don't fetch if we just had a successful update (within last 30 seconds)
    const timeSinceLastUpdate = Date.now() - lastSuccessfulUpdate;
    const skipFetchAfterUpdate = timeSinceLastUpdate < 30000; // 30 seconds
    
    if (gymId && existingGymTrainers.length === 0 && !skipFetchAfterUpdate) {
      fetchExistingGymTrainers(gymId);
    }
  }, [gymId]); // Only depend on gymId, not existingGymTrainers to avoid loops

  // Auto-refresh existing trainers when triggerRefresh changes
  useEffect(() => {
    if (triggerRefresh && triggerRefresh > 0 && gymId) {
      fetchExistingGymTrainers(gymId);
    }
  }, [triggerRefresh, gymId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchExistingGymTrainers = async (gymId: string) => {
    if (!gymId) {
      return;
    }
    
    setIsLoadingExisting(true);
    try {
      const params = new URLSearchParams({
        gymId: gymId,
        includeInactive: "false",
        page: "1",
        pageSize: "50",
        includeAssigned: "true"
      });
      
      const response = await apiRequest(`/api/trainers?${params.toString()}`);
      
      // Handle different possible response structures
      let backendTrainers: BackendTrainer[] = [];
      
      if (response.data?.items && Array.isArray(response.data.items)) {
        backendTrainers = response.data.items;
      } else if (response.trainers && Array.isArray(response.trainers)) {
        backendTrainers = response.trainers;
      } else if (response.data?.trainers && Array.isArray(response.data.trainers)) {
        backendTrainers = response.data.trainers;
      }

      // Filter and convert to frontend format
      const gymTrainers = backendTrainers
        .filter(trainer => trainer.gym_id === gymId)
        .map(convertBackendTrainer);
      
      setExistingGymTrainers(gymTrainers);
    } catch (error) {
      // Don't clear existing trainers on error - keep what we have
    } finally {
      setIsLoadingExisting(false);
    }
  };

  const fetchAvailableTrainers = async (page: number = 1, reset: boolean = false) => {
    if (reset) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      // Optimized: Use unassignedOnly parameter instead of filtering client-side
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        includeInactive: "false",
        unassignedOnly: "true" // Use backend filtering
      });
      
      const response = await apiRequest(`/api/trainers?${params.toString()}`);
      
      // Handle different possible response structures
      let backendTrainers: BackendTrainer[] = [];
      let total = 0;
      
      if (response.data?.items && Array.isArray(response.data.items)) {
        backendTrainers = response.data.items;
        total = response.data.total || response.data.items.length;
      } else if (response.trainers && Array.isArray(response.trainers)) {
        backendTrainers = response.trainers;
        total = response.total || response.trainers.length;
      } else if (response.data?.trainers && Array.isArray(response.data.trainers)) {
        backendTrainers = response.data.trainers;
        total = response.data.total || response.data.trainers.length;
      } else if (Array.isArray(response.data)) {
        backendTrainers = response.data;
        total = response.data.length;
      } else if (Array.isArray(response)) {
        backendTrainers = response;
        total = response.length;
      }

      // Convert to frontend format (backend already filtered)
      const unassignedTrainers = backendTrainers.map(convertBackendTrainer);

      if (reset) {
        setAvailableTrainers(unassignedTrainers);
        setCurrentPage(1);
      } else {
        setAvailableTrainers(prev => [...prev, ...unassignedTrainers]);
        setCurrentPage(page);
      }

      setTotalCount(total);
      
      // Check if there are more pages
      const totalPages = Math.ceil(total / pageSize);
      setHasNextPage(page < totalPages);

    } catch (error) {
      if (reset) {
        setAvailableTrainers([]);
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isLoadingMore) {
      fetchAvailableTrainers(currentPage + 1, false);
    }
  };

  const filteredAvailableTrainers = availableTrainers.filter((trainer) => {
    // Filter out already selected trainers
    return !selectedTrainers.find((t) => t.id === trainer.id);
  });

  const handleAddTrainer = (trainer: Trainer) => {
    if (!selectedTrainers.find((t) => t.id === trainer.id)) {
      const newSelectedTrainers = [...selectedTrainers, trainer];
      onTrainersChange(newSelectedTrainers);
      setIsDropdownOpen(false);
    }
  };

  const handleRemoveTrainer = (trainerId: string) => {
    const updatedTrainers = selectedTrainers.filter((t) => t.id !== trainerId);
    onTrainersChange(updatedTrainers);
  };

  const handleMarkTrainerForRemoval = (trainerId: string) => {
    if (onTrainersToRemoveChange) {
      const updatedRemovalList = trainersToRemove.includes(trainerId)
        ? trainersToRemove.filter(id => id !== trainerId) // Unmark for removal
        : [...trainersToRemove, trainerId]; // Mark for removal
      onTrainersToRemoveChange(updatedRemovalList);
    }
  };

  const handleRemoveFromExistingList = (trainerId: string) => {
    // Remove specific trainer from existing gym trainers list immediately
    setExistingGymTrainers(prevTrainers => {
      const newTrainers = prevTrainers.filter(trainer => trainer.id !== trainerId);
      return newTrainers;
    });
  };

  // Function to update existing trainers after API response
  const updateExistingTrainersFromAPI = (apiTrainers: Trainer[]) => {
    setExistingGymTrainers(prevTrainers => {
      // Create a map of existing trainers by ID for quick lookup
      const existingTrainersMap = new Map(prevTrainers.map(t => [t.id, t]));
      
      // Add new trainers from API, avoiding duplicates
      apiTrainers.forEach((trainer: Trainer) => {
        if (!existingTrainersMap.has(trainer.id)) {
          existingTrainersMap.set(trainer.id, trainer);
        } else {
          existingTrainersMap.set(trainer.id, trainer); // Update existing trainer data
        }
      });
      
      // Convert back to array
      const mergedTrainers = Array.from(existingTrainersMap.values());
      
      return mergedTrainers;
    });
  };

  // Function to handle successful trainer updates (call this after saving)
  const handleTrainerUpdateSuccess = (response: any) => {
    if (response?.data?.associatedTrainers && Array.isArray(response.data.associatedTrainers)) {
      const apiTrainers = response.data.associatedTrainers.map((trainer: any) => convertBackendTrainer(trainer));
      
      // CRITICAL FIX: Don't replace existing trainers, just add new ones
      setExistingGymTrainers(prevTrainers => {
        
        // Start with existing trainers that are NOT marked for removal
        const keepExistingTrainers = prevTrainers.filter((trainer: Trainer) => !trainersToRemove.includes(trainer.id));
        
        // Create a map for quick lookup - START with existing trainers
        const allTrainersMap = new Map(keepExistingTrainers.map(t => [t.id, t]));
        
        // Only add trainers from API response that are NOT already in our existing list
        // This handles the case where API response contains newly added trainers
        apiTrainers.forEach((trainer: Trainer) => {
          if (!allTrainersMap.has(trainer.id)) {
            allTrainersMap.set(trainer.id, trainer);
          } else {
            allTrainersMap.set(trainer.id, trainer); // Update with latest data
          }
        });
        
        const finalTrainers = Array.from(allTrainersMap.values());
        
        return finalTrainers;
      });
      
      // Clear selected trainers since they've been successfully added
      onTrainersChange([]);
      
      // Clear trainers marked for removal since the update was successful
      if (onTrainersToRemoveChange && trainersToRemove.length > 0) {
        onTrainersToRemoveChange([]);
      }
      
      // Mark the successful update timestamp to prevent unnecessary refetches
      setLastSuccessfulUpdate(Date.now());
    }
  };

  // Method to clear selected trainers without affecting existing ones
  const clearSelectedTrainersOnly = () => {
    onTrainersChange([]);
    
    if (onTrainersToRemoveChange) {
      onTrainersToRemoveChange([]);
    }
  };

  // Create backup of current state before updates
  const createTrainerBackup = () => {
    const currentCompleteList = getCompleteTrainerList();
    setBackupTrainers(currentCompleteList);
  };

  // Restore from backup if needed
  const restoreFromBackup = () => {
    if (backupTrainers.length > 0) {
      setExistingGymTrainers(backupTrainers);
    }
  };

  // Enhanced simplified method for handling successful trainer updates
  const handleSuccessfulUpdate = () => {
    // Create backup before any changes
    createTrainerBackup();
    
    // Get the complete list that should now be the gym's trainers
    const completeList = getCompleteTrainerList();
    
    // Update the existing trainers with this complete list
    updateWithCompleteList(completeList);
  };

  // Method to handle updates without automatic refetching
  const handleUpdateWithoutRefetch = () => {
    // Get the complete list that should now be the gym's trainers
    const completeList = getCompleteTrainerList();
    
    // Update UI immediately with the calculated complete list
    setExistingGymTrainers(completeList);
    
    // Clear selected trainers since they're now part of existing
    onTrainersChange([]);
    
    // Clear removal marks since update was successful
    if (onTrainersToRemoveChange) {
      onTrainersToRemoveChange([]);
    }
    
    // Mark successful update to prevent automatic refetching
    setLastSuccessfulUpdate(Date.now());
  };

  // Method to manually refresh when ready
  const manualRefresh = () => {
    setLastSuccessfulUpdate(0); // Reset to allow fetching
    if (gymId) {
      fetchExistingGymTrainers(gymId);
    }
  };

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    handleTrainerUpdateSuccess,
    updateExistingTrainersFromAPI,
    clearSelectedTrainersOnly,
    refreshExistingTrainers: () => gymId ? fetchExistingGymTrainers(gymId) : undefined,
    // Complete list management methods
    getCompleteTrainerList: () => getCompleteTrainerList(),
    updateWithCompleteList: (trainers: Trainer[]) => updateWithCompleteList(trainers),
    handleSuccessfulUpdate: () => handleSuccessfulUpdate(),
    // Backup and restore methods
    createTrainerBackup: () => createTrainerBackup(),
    restoreFromBackup: () => restoreFromBackup(),
    // New methods for better control
    handleUpdateWithoutRefetch: () => handleUpdateWithoutRefetch(),
    manualRefresh: () => manualRefresh()
  }), [onTrainersChange, onTrainersToRemoveChange, gymId, existingGymTrainers, selectedTrainers, trainersToRemove]);

  const handleDropdownToggle = () => {
    setIsDropdownOpen(!isDropdownOpen);
    if (!isDropdownOpen && availableTrainers.length === 0) {
      fetchAvailableTrainers(1, true);
    }
  };

  // Trainer detail popover component
  const TrainerDetailPopover = ({ trainer, children }: { trainer: Trainer; children: React.ReactNode }) => (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-semibold">
                {trainer.first_name_th} {trainer.last_name_th}
              </div>
              <div className="text-sm text-muted-foreground">
                {trainer.first_name_en} {trainer.last_name_en}
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            {trainer.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span>{trainer.email}</span>
              </div>
            )}
            
            {trainer.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{trainer.phone}</span>
              </div>
            )}
            
            {trainer.line_id && (
              <div className="flex items-center gap-2 text-sm">
                <MessageCircle className="w-4 h-4 text-muted-foreground" />
                <span>{trainer.line_id}</span>
              </div>
            )}
            
            {trainer.province && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>{trainer.province.name_th}</span>
              </div>
            )}
          </div>
          
          {(trainer.bio_th || trainer.bio_en) && (
            <div className="space-y-1">
              <div className="text-sm font-medium">รายละเอียด</div>
              {trainer.bio_th && (
                <div className="text-sm text-muted-foreground">
                  <strong>TH:</strong> {trainer.bio_th.length > 100 ? `${trainer.bio_th.substring(0, 100)}...` : trainer.bio_th}
                </div>
              )}
              {trainer.bio_en && (
                <div className="text-sm text-muted-foreground">
                  <strong>EN:</strong> {trainer.bio_en.length > 100 ? `${trainer.bio_en.substring(0, 100)}...` : trainer.bio_en}
                </div>
              )}
            </div>
          )}
          
          <div className="flex items-center gap-2 pt-2">
            <Badge variant="outline">
              ประสบการณ์ {trainer.exp_year || 0} ปี
            </Badge>
            {trainer.is_active && (
              <Badge variant="default">
                ใช้งานอยู่
              </Badge>
            )}
            {trainer.is_freelance && (
              <Badge variant="secondary">
                อิสระ
              </Badge>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );

  // Get the complete list of trainers that should be associated with the gym
  const getCompleteTrainerList = (): Trainer[] => {
    // Start with existing trainers
    const existingNotMarkedForRemoval = existingGymTrainers.filter(
      trainer => {
        const isMarkedForRemoval = trainersToRemove.includes(trainer.id);
        return !isMarkedForRemoval;
      }
    );
    
    // Add selected trainers (new ones being added)
    const selectedTrainerIds = selectedTrainers.map(t => t.id);
    const existingIds = existingNotMarkedForRemoval.map(t => t.id);
    
    // Avoid duplicates when merging
    const newTrainersToAdd = selectedTrainers.filter(
      trainer => {
        const isAlreadyExisting = existingIds.includes(trainer.id);
        return !isAlreadyExisting;
      }
    );
    
    const completeList = [...existingNotMarkedForRemoval, ...newTrainersToAdd];
    
    return completeList;
  };

  // Update existing trainers list with the complete trainer list (after successful API update)
  const updateWithCompleteList = (completeTrainerList: Trainer[]) => {
    setExistingGymTrainers(completeTrainerList);
    
    // Clear selected trainers since they're now part of existing
    onTrainersChange([]);
    
    // Clear removal marks since update was successful
    if (onTrainersToRemoveChange) {
      onTrainersToRemoveChange([]);
    }
    
    // Mark successful update to prevent unnecessary refetches
    setLastSuccessfulUpdate(Date.now());
  };

  return (
    <div className="space-y-6">
      {/* Existing Gym Trainers */}
      {(gymId && existingGymTrainers.length > 0) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4" />
              ครูมวยปัจจุบันของยิม
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              ครูมวยที่ได้รับมอบหมายในยิมนี้ สามารถทำการเปลี่ยนแปลงได้ แต่จะมีผลเมื่อบันทึกข้อมูล
            </p>
            <div className="text-xs text-muted-foreground">
              จำนวนครูมวยในยิม {existingGymTrainers.length} คน
              {trainersToRemove.length > 0 && (
                <span className="text-red-600 ml-2">
                  (กำลังจะลบ {trainersToRemove.length} คน)
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingExisting ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
                กำลังโหลดครูมวยปัจจุบัน...
              </div>
            ) : (
              <div className="space-y-2">
                {existingGymTrainers.map((trainer) => {
                  const isMarkedForRemoval = trainersToRemove.includes(trainer.id);
                  return (
                    <div
                      key={trainer.id}
                      className={`flex items-center justify-between p-3 border rounded-lg transition-all ${
                        isMarkedForRemoval 
                          ? 'bg-red-50 border-red-200 opacity-60' 
                          : 'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isMarkedForRemoval ? 'bg-red-500' : 'bg-blue-600'
                        }`}>
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
                        <Badge variant="outline" className="text-xs">
                          {trainer.exp_year || 0} ปี
                        </Badge>
                        {isMarkedForRemoval && (
                          <Badge variant="destructive" className="text-xs">
                            จะถูกลบ
                          </Badge>
                        )}
                        <TrainerDetailPopover trainer={trainer}>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                        </TrainerDetailPopover>
                        <Button
                          size="sm"
                          variant={isMarkedForRemoval ? "outline" : "destructive"}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            
                            if (onTrainersToRemoveChange) {
                              // Use soft removal (mark for removal)
                              handleMarkTrainerForRemoval(trainer.id);
                            } else {
                              // Use hard removal (remove from list immediately)
                              handleRemoveFromExistingList(trainer.id);
                            }
                          }}
                          disabled={disabled}
                          className="h-8 w-8 p-0"
                        >
                          {isMarkedForRemoval ? (
                            <RotateCcw className="w-3 h-3" />
                          ) : (
                            <UserMinus className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Trainer Management */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4" />
            จัดการครูมวย (Trainer Management)
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            เพิ่มครูมวยใหม่เข้ามาในยิมนี้ การเปลี่ยนแปลงจะมีผลเมื่อบันทึกข้อมูล
          </p>
          {totalCount > 0 && (
            <div className="text-xs text-muted-foreground">
              พบครูมวยที่ยังไม่ได้รับมอบหมาย {totalCount} คน
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selected Trainers for Addition */}
          {selectedTrainers.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                ครูมวยที่เลือกให้เพิ่มเข้ายิม ({selectedTrainers.length})
                <Badge variant="default" className="text-xs">
                  ใหม่
                </Badge>
              </h4>
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
                      <Badge variant="outline" className="text-xs">
                        {trainer.exp_year || 0} ปี
                      </Badge>
                      <Badge variant="default" className="text-xs">
                        จะถูกเพิ่ม
                      </Badge>
                      <TrainerDetailPopover trainer={trainer}>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                      </TrainerDetailPopover>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleRemoveTrainer(trainer.id);
                        }}
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

          {/* Simple Dropdown for Adding Trainers */}
          <div className="relative" ref={dropdownRef}>
            <h4 className="text-sm font-medium mb-2">เพิ่มครูมวยใหม่</h4>
            
            {/* Dropdown Button */}
            <button
              type="button"
              className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleDropdownToggle}
              disabled={disabled}
            >
              <span className="text-sm text-muted-foreground">
                เลือกครูมวยที่ต้องการเพิ่ม...
              </span>
              {isDropdownOpen ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>

            {/* Dropdown Results */}
            {isDropdownOpen && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-hidden">
                {isLoading ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
                    กำลังโหลด...
                  </div>
                ) : filteredAvailableTrainers.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    ไม่พบครูมวยที่ยังไม่ได้รับมอบหมาย
                  </div>
                ) : (
                  <div className="max-h-80 overflow-y-auto">
                    {filteredAvailableTrainers.map((trainer) => (
                      <button
                        key={trainer.id}
                        type="button"
                        className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:bg-gray-50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => handleAddTrainer(trainer)}
                        disabled={disabled}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              {trainer.first_name_th} {trainer.last_name_th || ''}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {trainer.first_name_en} {trainer.last_name_en || ''}
                            </div>
                            {trainer.email && (
                              <div className="text-xs text-muted-foreground truncate">
                                {trainer.email}
                              </div>
                            )}
                            {trainer.province && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="w-3 h-3" />
                                <span className="truncate">{trainer.province.name_th}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge variant="outline" className="text-xs">
                              {trainer.exp_year || 0} ปี
                            </Badge>
                            <UserPlus className="w-4 h-4 text-blue-600" />
                          </div>
                        </div>
                      </button>
                    ))}
                    
                    {/* Load More in Dropdown */}
                    {hasNextPage && (
                      <div className="p-2 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleLoadMore}
                          disabled={isLoadingMore || disabled}
                          className="w-full"
                        >
                          {isLoadingMore ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin mr-2" />
                              กำลังโหลดเพิ่มเติม...
                            </>
                          ) : (
                            `โหลดเพิ่มเติม (${filteredAvailableTrainers.length}/${totalCount})`
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Summary of Changes */}
          {(selectedTrainers.length > 0 || trainersToRemove.length > 0) && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <h5 className="text-sm font-medium text-amber-800 mb-2">สรุปการเปลี่ยนแปลง</h5>
              <div className="text-xs text-amber-700 space-y-1">
                {selectedTrainers.length > 0 && (
                  <div>• จะเพิ่มครูมวย {selectedTrainers.length} คน</div>
                )}
                {trainersToRemove.length > 0 && (
                  <div>• จะลบครูมวย {trainersToRemove.length} คน</div>
                )}
                <div className="mt-2 text-amber-600">
                  การเปลี่ยนแปลงจะมีผลเมื่อกดบันทึกข้อมูล
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}); 