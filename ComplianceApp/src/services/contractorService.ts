import { supabase } from "../lib/supabase";
import NetInfo from "@react-native-community/netinfo";
import { syncService } from "./syncService";
import { InputValidator } from "../utils/InputValidator";

export interface Contractor {
  id: string;
  name: string;
  company?: string;
  specialism: string;
  qualifications?: string[];
  competence_status?: string;
  email?: string;
  competence_evidence_url?: string;
  rejection_reason?: string | null;
}

export const contractorService = {
  async getProfile(userId: string): Promise<Contractor> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) throw error;
    return data;
  },

  async updateSpecialism(userId: string, specialism: string) {
    const cleanSpecialism = InputValidator.sanitize(specialism);

    if (cleanSpecialism.length < 2) {
      return {
        success: false,
        error: "Specialism must be at least 2 characters.",
      };
    }

    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      await syncService.enqueue("profiles_updates", {
        id: userId,
        specialism: cleanSpecialism,
      });
      return { success: true, offline: true };
    }

    const { error } = await supabase
      .from("profiles")
      .update({ specialism: cleanSpecialism })
      .eq("id", userId);

    if (error) {
      return { success: false, error: "Update failed." };
    }
    return { success: true, offline: false };
  },

  async submitCompetence(userId: string, path: string) {
    const { data } = supabase.storage.from("evidence").getPublicUrl(path);

    const publicUrl = data.publicUrl;

    const updateData = {
      id: userId,
      competence_evidence_url: publicUrl,
      competence_status: "Pending",
    };

    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      await syncService.enqueue("profiles_upserts", updateData);
      return { success: true, offline: true };
    }

    const { error } = await supabase
      .from("profiles")
      .upsert(updateData, { onConflict: "id" });

    if (error) {
      console.error("[Statutory Audit] Link Update Error:", error);
      return { success: false, error: error.message };
    }
    return { success: true, offline: false };
  },
  async getAllContractors(): Promise<Contractor[]> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "Contractor");

    if (error) throw error;
    return data;
  },

  async updateContractorStatus(id: string, newStatus: string) {
    const cleanStatus = InputValidator.sanitize(newStatus);

    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      await syncService.enqueue("profiles_updates", {
        id,
        competence_status: cleanStatus,
      });
      return { success: true, offline: true };
    }

    const { data, error } = await supabase
      .from("profiles")
      .update({ competence_status: cleanStatus })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return { success: false, error: "Status update failed." };
    }
    return { success: true, data, offline: false };
  },

  async getApprovedContractors(): Promise<Contractor[]> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "Contractor")
      .eq("competence_status", "Approved");

    if (error) throw error;
    return data;
  },

  async assignToJob(id: string, contractorId: string, isAsset: boolean) {
    const table = isAsset ? "assets" : "incidents";
    const updateData = { assigned_to: contractorId, status: "Assigned" };

    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      await syncService.enqueue(`${table}_updates`, { id, ...updateData });
      return { success: true, offline: true };
    }

    const { data, error } = await supabase
      .from(table)
      .update(updateData)
      .eq("id", id)
      .select();

    if (error) {
      return { success: false, error: "Assignment failed." };
    }
    return { success: true, data, offline: false };
  },
};
