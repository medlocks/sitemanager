import { supabase } from "../lib/supabase";
import NetInfo from "@react-native-community/netinfo";
import { syncService } from "./syncService";
import { InputValidator } from "../utils/InputValidator";

interface AccidentReport {
  user_id: string;
  date_time: string;
  location: string;
  injured_person_name: string;
  injury_description: string;
  treatment_given?: string;
  is_riddor_reportable?: boolean;
  evidence_url?: string | null;
  remedial_action?: string;
  status?: string;
}

export const accidentService = {
  async logAccident(data: AccidentReport) {
    const cleanDescription = InputValidator.sanitize(data.injury_description);
    const cleanLocation = InputValidator.sanitize(data.location);
    const cleanName = InputValidator.sanitize(data.injured_person_name);

    const validation = InputValidator.validateIncident(
      cleanDescription,
      cleanLocation,
    );

    if (!validation.isValid) {
      return { success: false, error: validation.errors[0] };
    }

    const payload = {
      ...data,
      injury_description: cleanDescription,
      location: cleanLocation,
      injured_person_name: cleanName,
      date_time: data.date_time || new Date().toISOString(),
    };

    const state = await NetInfo.fetch();

    if (!state.isConnected) {
      await syncService.enqueue("accidents", payload);
      return {
        success: true,
        offline: true,
        message: "Saved to offline queue",
      };
    }

    const { error } = await supabase.from("accidents").insert([payload]);

    if (error) {
      console.error("[AccidentService] Error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, offline: false };
  },

  async getAccidents() {
    const { data, error } = await supabase
      .from("accidents")
      .select(
        `
        *,
        reporter:user_id (name) 
      `,
      )
      .order("date_time", { ascending: false });

    if (error) {
      console.error("[AccidentService] Fetch Error:", error);
      throw error;
    }
    return data;
  },
};
