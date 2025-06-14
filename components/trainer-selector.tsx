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
    console.log("useEffect triggered for gymId:", gymId, "existing trainers:", existingGymTrainers.length);
    console.log("Last successful update:", lastSuccessfulUpdate);
    
    // Don't fetch if we just had a successful update (within last 30 seconds)
    const timeSinceLastUpdate = Date.now() - lastSuccessfulUpdate;
    const skipFetchAfterUpdate = timeSinceLastUpdate < 30000; // 30 seconds
    
    if (gymId && existingGymTrainers.length === 0 && !skipFetchAfterUpdate) {
      console.log("Fetching existing trainers for new gymId:", gymId);
      fetchExistingGymTrainers(gymId);
    } else if (gymId && existingGymTrainers.length > 0) {
      console.log("Skipping fetch - already have existing trainers:", existingGymTrainers.map(t => t.first_name_th));
    } else if (!gymId) {
      console.log("No gymId provided, skipping fetch");
    } else if (skipFetchAfterUpdate) {
      console.log("Skipping fetch - just had successful update, waiting 30 seconds");
    }
  }, [gymId]); // Only depend on gymId, not existingGymTrainers to avoid loops

  // Auto-refresh existing trainers when triggerRefresh changes
  useEffect(() => {
    if (triggerRefresh && triggerRefresh > 0 && gymId) {
      console.log("Trigger refresh detected:", triggerRefresh, "- refetching existing trainers");
      fetchExistingGymTrainers(gymId);
    }
  }, [triggerRefresh, gymId]);

  // Debug: Monitor changes to existing gym trainers
  useEffect(() => {
    console.log("existingGymTrainers changed:", existingGymTrainers.length, "trainers");
    if (existingGymTrainers.length === 0 && gymId) {
      console.warn("Existing gym trainers was cleared unexpectedly for gymId:", gymId);
    }
  }, [existingGymTrainers, gymId]);

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
      console.log("No gymId provided to fetchExistingGymTrainers");
      return;
    }
    
    console.log("=== FETCHING EXISTING GYM TRAINERS ===");
    console.log("GymId:", gymId);
    console.log("Current existing trainers before fetch:", existingGymTrainers.length);
    
    setIsLoadingExisting(true);
    try {
      // Try multiple approaches to get ALL trainers for this gym
      
      // Approach 1: Try to get gym details with associated trainers
      let gymTrainers: Trainer[] = [];
      
      try {
        console.log("=== TRYING APPROACH 1: GET GYM WITH TRAINERS ===");
        const gymResponse = await apiRequest(`/api/gyms/${gymId}`);
        console.log("Gym API Response:", JSON.stringify(gymResponse, null, 2));
        
        if (gymResponse.data?.associatedTrainers && Array.isArray(gymResponse.data.associatedTrainers)) {
          const associatedTrainers = gymResponse.data.associatedTrainers.map((trainer: any) => convertBackendTrainer(trainer));
          console.log("Found trainers from gym endpoint:", associatedTrainers.map((t: Trainer) => `${t.first_name_th} ${t.last_name_th} (${t.id})`));
          gymTrainers = associatedTrainers;
        }
      } catch (gymError) {
        console.log("Gym endpoint failed, trying trainers endpoint:", gymError);
      }
      
      // Approach 2: If gym endpoint didn't work, try trainers endpoint
      if (gymTrainers.length === 0) {
        console.log("=== TRYING APPROACH 2: GET TRAINERS BY GYM ID ===");
        const params = new URLSearchParams({
          gymId: gymId,
          includeInactive: "false",
          page: "1",
          pageSize: "1000", // Increased to ensure we get all trainers
          includeAssigned: "true" // Make sure we include assigned trainers
        });
        
        console.log("Fetching with params:", params.toString());
        const response = await apiRequest(`/api/trainers?${params.toString()}`);
        console.log("=== FULL API RESPONSE ===");
        console.log("Full API Response:", JSON.stringify(response, null, 2));
        
        let backendTrainers: BackendTrainer[] = [];
        
        if (response.data?.items && Array.isArray(response.data.items)) {
          backendTrainers = response.data.items;
        } else if (response.trainers && Array.isArray(response.trainers)) {
          backendTrainers = response.trainers;
        } else if (response.data?.trainers && Array.isArray(response.data.trainers)) {
          backendTrainers = response.data.trainers;
        }

        console.log("=== BACKEND TRAINERS ANALYSIS ===");
        console.log("Backend trainers found:", backendTrainers.length);
        console.log("All backend trainers:", backendTrainers.map((t: BackendTrainer) => ({
          name: `${t.first_name_th} ${t.last_name_th}`,
          id: t.id,
          gym_id: t.gym_id,
          is_active: t.is_active,
          is_freelance: t.is_freelance
        })));

        // Filter to only include trainers that are actually assigned to THIS gym
        const gymSpecificTrainers = backendTrainers.filter(trainer => {
          const isAssignedToThisGym = trainer.gym_id === gymId;
          console.log(`Trainer ${trainer.first_name_th} ${trainer.last_name_th} (${trainer.id}):`, {
            gym_id: trainer.gym_id,
            target_gym_id: gymId,
            isAssignedToThisGym,
            is_active: trainer.is_active,
            is_freelance: trainer.is_freelance
          });
          return isAssignedToThisGym;
        });
        
        console.log("=== GYM-SPECIFIC TRAINERS ===");
        console.log("Gym-specific trainers:", gymSpecificTrainers.length);
        console.log("Gym-specific trainer details:", gymSpecificTrainers.map((t: BackendTrainer) => ({
          name: `${t.first_name_th} ${t.last_name_th}`,
          id: t.id,
          gym_id: t.gym_id
        })));

        gymTrainers = gymSpecificTrainers.map(convertBackendTrainer);
      }
      
      console.log("=== FINAL RESULT ===");
      console.log("Setting existing gym trainers to:", gymTrainers.map(t => `${t.first_name_th} ${t.last_name_th} (${t.id})`));
      
      setExistingGymTrainers(gymTrainers);
      console.log("=== FETCH EXISTING TRAINERS COMPLETE ===");
    } catch (error) {
      console.error("Error fetching existing gym trainers:", error);
      console.log("Keeping existing trainers due to error");
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
      // Fetch trainers with specific criteria: active, no gym, not freelancer
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        includeInactive: "false", // Only active trainers
        isFreelance: "false", // Not freelancers
        includeClasses: "true"
      });
      
      console.log("Fetching trainers with params:", params.toString());
      
      const response = await apiRequest(`/api/trainers?${params.toString()}`);
      console.log("Raw API response:", response);
      
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

      console.log("Backend trainers found:", backendTrainers);

      // Filter trainers to only include those without gym assignment and convert to frontend format
      const unassignedTrainers = backendTrainers
        .filter((trainer: BackendTrainer) => 
          trainer.gym_id === null && // No gym assigned (checking gym_id directly)
          trainer.is_active === true && // Is active
          trainer.is_freelance === false // Not freelancer
        )
        .map(convertBackendTrainer);

      console.log("Filtered unassigned trainers:", unassignedTrainers);

      if (reset) {
        setAvailableTrainers(unassignedTrainers);
        setCurrentPage(1);
      } else {
        setAvailableTrainers(prev => [...prev, ...unassignedTrainers]);
        setCurrentPage(page);
      }

      setTotalCount(unassignedTrainers.length);
      
      // Check if there are more pages based on original response
      const totalPages = Math.ceil(total / pageSize);
      setHasNextPage(page < totalPages);

    } catch (error) {
      console.error("Error fetching trainers:", error);
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
    console.log("Adding trainer:", trainer.first_name_th, "Current existing trainers:", existingGymTrainers.length);
    
    if (!selectedTrainers.find((t) => t.id === trainer.id)) {
      const newSelectedTrainers = [...selectedTrainers, trainer];
      console.log("New selected trainers:", newSelectedTrainers.length);
      onTrainersChange(newSelectedTrainers);
      setIsDropdownOpen(false);
    }
  };

  const handleRemoveTrainer = (trainerId: string) => {
    console.log("Removing trainer from selected:", trainerId, "Current existing trainers:", existingGymTrainers.length);
    const updatedTrainers = selectedTrainers.filter((t) => t.id !== trainerId);
    onTrainersChange(updatedTrainers);
  };

  const handleMarkTrainerForRemoval = (trainerId: string) => {
    console.log("Marking trainer for removal:", trainerId, "Current existing trainers:", existingGymTrainers.length);
    if (onTrainersToRemoveChange) {
      const updatedRemovalList = trainersToRemove.includes(trainerId)
        ? trainersToRemove.filter(id => id !== trainerId) // Unmark for removal
        : [...trainersToRemove, trainerId]; // Mark for removal
      onTrainersToRemoveChange(updatedRemovalList);
    }
  };

  const handleRemoveFromExistingList = (trainerId: string) => {
    console.log("Removing trainer from existing list:", trainerId, "Current existing trainers:", existingGymTrainers.length);
    // Remove specific trainer from existing gym trainers list immediately
    setExistingGymTrainers(prevTrainers => {
      const newTrainers = prevTrainers.filter(trainer => trainer.id !== trainerId);
      console.log("New existing trainers after removal:", newTrainers.length);
      return newTrainers;
    });
  };

  // Function to update existing trainers after API response
  const updateExistingTrainersFromAPI = (apiTrainers: Trainer[]) => {
    console.log("Updating existing trainers from API:", apiTrainers.length, "new trainers");
    console.log("Current existing trainers before merge:", existingGymTrainers.length);
    
    setExistingGymTrainers(prevTrainers => {
      // Create a map of existing trainers by ID for quick lookup
      const existingTrainersMap = new Map(prevTrainers.map(t => [t.id, t]));
      console.log("Existing trainers before merge:", Array.from(existingTrainersMap.keys()));
      
      // Add new trainers from API, avoiding duplicates
      apiTrainers.forEach((trainer: Trainer) => {
        if (!existingTrainersMap.has(trainer.id)) {
          console.log("Adding new trainer to existing list:", trainer.first_name_th);
          existingTrainersMap.set(trainer.id, trainer);
        } else {
          console.log("Trainer already exists, updating:", trainer.first_name_th);
          existingTrainersMap.set(trainer.id, trainer); // Update existing trainer data
        }
      });
      
      // Convert back to array
      const mergedTrainers = Array.from(existingTrainersMap.values());
      console.log("Final merged trainers:", mergedTrainers.length, "total trainers");
      console.log("Merged trainer names:", mergedTrainers.map((t: Trainer) => t.first_name_th));
      
      return mergedTrainers;
    });
  };

  // Function to handle successful trainer updates (call this after saving)
  const handleTrainerUpdateSuccess = (response: any) => {
    console.log("=== HANDLING TRAINER UPDATE SUCCESS ===");
    console.log("API Response:", response);
    console.log("Current existing trainers before update:", existingGymTrainers.length);
    console.log("Current existing trainer names:", existingGymTrainers.map((t: Trainer) => t.first_name_th));
    
    if (response?.data?.associatedTrainers && Array.isArray(response.data.associatedTrainers)) {
      const apiTrainers = response.data.associatedTrainers.map((trainer: any) => convertBackendTrainer(trainer));
      console.log("API returned trainers (newly added):", apiTrainers.map((t: Trainer) => `${t.first_name_th} ${t.last_name_th}`));
      
      // CRITICAL FIX: Don't replace existing trainers, just add new ones
      setExistingGymTrainers(prevTrainers => {
        console.log("Previous trainers (existing):", prevTrainers.map((t: Trainer) => t.first_name_th));
        
        // Start with existing trainers that are NOT marked for removal
        const keepExistingTrainers = prevTrainers.filter((trainer: Trainer) => !trainersToRemove.includes(trainer.id));
        console.log("Keeping existing trainers (not marked for removal):", keepExistingTrainers.map((t: Trainer) => t.first_name_th));
        
        // Create a map for quick lookup - START with existing trainers
        const allTrainersMap = new Map(keepExistingTrainers.map(t => [t.id, t]));
        
        // Only add trainers from API response that are NOT already in our existing list
        // This handles the case where API response contains newly added trainers
        apiTrainers.forEach((trainer: Trainer) => {
          if (!allTrainersMap.has(trainer.id)) {
            console.log("Adding newly added trainer from API:", trainer.first_name_th);
            allTrainersMap.set(trainer.id, trainer);
          } else {
            console.log("Trainer from API already exists, updating data:", trainer.first_name_th);  
            allTrainersMap.set(trainer.id, trainer); // Update with latest data
          }
        });
        
        const finalTrainers = Array.from(allTrainersMap.values());
        console.log("Final trainer list after merge:", finalTrainers.map((t: Trainer) => t.first_name_th));
        console.log("Total trainers after update:", finalTrainers.length);
        
        return finalTrainers;
      });
      
      // Clear selected trainers since they've been successfully added
      console.log("Clearing selected trainers:", selectedTrainers.length);
      onTrainersChange([]);
      
      // Clear trainers marked for removal since the update was successful
      if (onTrainersToRemoveChange && trainersToRemove.length > 0) {
        console.log("Clearing trainers marked for removal:", trainersToRemove.length);
        onTrainersToRemoveChange([]);
      }
      
      // Mark the successful update timestamp to prevent unnecessary refetches
      setLastSuccessfulUpdate(Date.now());
      
      console.log("=== TRAINER UPDATE SUCCESS COMPLETE ===");
    } else {
      console.warn("No associatedTrainers found in API response, not updating trainer list");
    }
  };

  // Method to clear selected trainers without affecting existing ones
  const clearSelectedTrainersOnly = () => {
    console.log("Clearing selected trainers only, preserving existing trainers");
    console.log("Selected trainers before clear:", selectedTrainers.length);
    console.log("Existing trainers (preserved):", existingGymTrainers.length);
    
    onTrainersChange([]);
    
    if (onTrainersToRemoveChange) {
      onTrainersToRemoveChange([]);
    }
  };

  // Create backup of current state before updates
  const createTrainerBackup = () => {
    console.log("=== CREATING TRAINER BACKUP ===");
    const currentCompleteList = getCompleteTrainerList();
    setBackupTrainers(currentCompleteList);
    console.log("Backed up trainers:", currentCompleteList.map((t: Trainer) => `${t.first_name_th} ${t.last_name_th} (${t.id})`));
    console.log("Backup created with", currentCompleteList.length, "trainers");
  };

  // Restore from backup if needed
  const restoreFromBackup = () => {
    console.log("=== RESTORING FROM BACKUP ===");
    console.log("Backup contains:", backupTrainers.length, "trainers");
    console.log("Backup trainers:", backupTrainers.map((t: Trainer) => `${t.first_name_th} ${t.last_name_th} (${t.id})`));
    
    if (backupTrainers.length > 0) {
      setExistingGymTrainers(backupTrainers);
      console.log("Restored existing trainers from backup");
    } else {
      console.log("No backup available to restore");
    }
  };

  // Enhanced simplified method for handling successful trainer updates
  const handleSuccessfulUpdate = () => {
    console.log("=== HANDLING SUCCESSFUL UPDATE (ENHANCED) ===");
    
    // Create backup before any changes
    createTrainerBackup();
    
    // Get the complete list that should now be the gym's trainers
    const completeList = getCompleteTrainerList();
    
    // Update the existing trainers with this complete list
    updateWithCompleteList(completeList);
    
    console.log("=== SUCCESSFUL UPDATE COMPLETE ===");
  };

  // Method to handle updates without automatic refetching
  const handleUpdateWithoutRefetch = () => {
    console.log("=== HANDLING UPDATE WITHOUT REFETCH ===");
    
    // Get the complete list that should now be the gym's trainers
    const completeList = getCompleteTrainerList();
    console.log("Complete list for update:", completeList.map((t: Trainer) => `${t.first_name_th} ${t.last_name_th} (${t.id})`));
    
    // Update UI immediately with the calculated complete list
    setExistingGymTrainers(completeList);
    
    // Clear selected trainers since they're now part of existing
    console.log("Clearing selected trainers");
    onTrainersChange([]);
    
    // Clear removal marks since update was successful
    if (onTrainersToRemoveChange) {
      console.log("Clearing trainers marked for removal");
      onTrainersToRemoveChange([]);
    }
    
    // Mark successful update to prevent automatic refetching
    setLastSuccessfulUpdate(Date.now());
    
    console.log("=== UPDATE WITHOUT REFETCH COMPLETE ===");
  };

  // Method to manually refresh when ready
  const manualRefresh = () => {
    console.log("=== MANUAL REFRESH TRIGGERED ===");
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
    console.log("=== GETTING COMPLETE TRAINER LIST ===");
    console.log("existingGymTrainers:", existingGymTrainers.length, existingGymTrainers.map(t => `${t.first_name_th} ${t.last_name_th} (${t.id})`));
    console.log("trainersToRemove:", trainersToRemove);
    console.log("selectedTrainers:", selectedTrainers.length, selectedTrainers.map(t => `${t.first_name_th} ${t.last_name_th} (${t.id})`));
    
    // Start with existing trainers
    const existingNotMarkedForRemoval = existingGymTrainers.filter(
      trainer => {
        const isMarkedForRemoval = trainersToRemove.includes(trainer.id);
        console.log(`Trainer ${trainer.first_name_th} (${trainer.id}) - marked for removal: ${isMarkedForRemoval}`);
        return !isMarkedForRemoval;
      }
    );
    
    console.log("existingNotMarkedForRemoval:", existingNotMarkedForRemoval.length, existingNotMarkedForRemoval.map(t => `${t.first_name_th} ${t.last_name_th} (${t.id})`));
    
    // Add selected trainers (new ones being added)
    const selectedTrainerIds = selectedTrainers.map(t => t.id);
    const existingIds = existingNotMarkedForRemoval.map(t => t.id);
    
    console.log("selectedTrainerIds:", selectedTrainerIds);
    console.log("existingIds:", existingIds);
    
    // Avoid duplicates when merging
    const newTrainersToAdd = selectedTrainers.filter(
      trainer => {
        const isAlreadyExisting = existingIds.includes(trainer.id);
        console.log(`Selected trainer ${trainer.first_name_th} (${trainer.id}) - already existing: ${isAlreadyExisting}`);
        return !isAlreadyExisting;
      }
    );
    
    console.log("newTrainersToAdd:", newTrainersToAdd.length, newTrainersToAdd.map(t => `${t.first_name_th} ${t.last_name_th} (${t.id})`));
    
    const completeList = [...existingNotMarkedForRemoval, ...newTrainersToAdd];
    
    console.log("=== COMPLETE TRAINER LIST RESULT ===");
    console.log("Final complete list:", completeList.map(t => `${t.first_name_th} ${t.last_name_th} (${t.id})`));
    console.log("Total trainers in complete list:", completeList.length);
    console.log("=== END COMPLETE TRAINER LIST ===");
    
    return completeList;
  };

  // Update existing trainers list with the complete trainer list (after successful API update)
  const updateWithCompleteList = (completeTrainerList: Trainer[]) => {
    console.log("=== UPDATING WITH COMPLETE LIST ===");
    console.log("Input completeTrainerList:", completeTrainerList.length, completeTrainerList.map(t => `${t.first_name_th} ${t.last_name_th} (${t.id})`));
    console.log("Current existingGymTrainers before update:", existingGymTrainers.length, existingGymTrainers.map(t => `${t.first_name_th} ${t.last_name_th} (${t.id})`));
    console.log("Current selectedTrainers before clear:", selectedTrainers.length, selectedTrainers.map(t => `${t.first_name_th} ${t.last_name_th} (${t.id})`));
    console.log("Current trainersToRemove before clear:", trainersToRemove);
    
    setExistingGymTrainers(completeTrainerList);
    console.log("Set existingGymTrainers to complete list");
    
    // Clear selected trainers since they're now part of existing
    console.log("Clearing selected trainers");
    onTrainersChange([]);
    
    // Clear removal marks since update was successful
    if (onTrainersToRemoveChange) {
      console.log("Clearing trainers marked for removal");
      onTrainersToRemoveChange([]);
    }
    
    // Mark successful update to prevent unnecessary refetches
    setLastSuccessfulUpdate(Date.now());
    
    console.log("=== UPDATE WITH COMPLETE LIST COMPLETE ===");
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
                            console.log("Removing trainer:", trainer.id, trainer.first_name_th);
                            
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
                          console.log("Removing selected trainer:", trainer.id, trainer.first_name_th);
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