import { privacyService } from "./privacyService";
import { supabase } from "../lib/supabase";
import { Alert, Clipboard } from "react-native";

jest.mock("../lib/supabase");

describe("PrivacyService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.from as jest.Mock).mockReturnThis();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
    jest.spyOn(Clipboard, "setString").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should fetch profile and incidents then copy to clipboard", async () => {
    const mockProfile = { id: "u1", email: "test@raytheon.com" };
    const mockIncidents = [{ id: "i1", description: "Fault" }];

    const mockChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
    };

    const mockIncidentsChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: mockIncidents, error: null }),
    };

    (supabase.from as jest.Mock)
      .mockReturnValueOnce(mockChain)
      .mockReturnValueOnce(mockIncidentsChain);

    await privacyService.downloadMyData("u1");

    expect(supabase.from).toHaveBeenCalledWith("profiles");
    expect(supabase.from).toHaveBeenCalledWith("incidents");
    expect(Clipboard.setString).toHaveBeenCalledWith(
      expect.stringContaining("test@raytheon.com"),
    );
    expect(Alert.alert).toHaveBeenCalledWith(
      "GDPR Data Export",
      "Your personal data has been copied to your clipboard in JSON format.",
    );
  });

  it("should handle fetch errors gracefully", async () => {
    (supabase.from as jest.Mock).mockImplementation(() => {
      throw new Error("Database down");
    });

    await privacyService.downloadMyData("u1");

    expect(Alert.alert).toHaveBeenCalledWith(
      "Error",
      "Could not compile data export.",
    );
  });
});
