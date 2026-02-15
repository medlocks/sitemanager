jest.mock("../lib/supabase");
import { accidentService } from "./accidentService";
import { supabase } from "../lib/supabase";
import NetInfo from "@react-native-community/netinfo";
import { syncService } from "./syncService";

jest.mock("./syncService", () => ({
  syncService: {
    enqueue: jest.fn(),
  },
}));

describe("AccidentService", () => {
  const validMockData = {
    injury_description: "Detailed report of a warehouse fall",
    location: "Main Warehouse",
    user_id: "u123",
    injured_person_name: "John Doe",
    date_time: "2026-02-11T22:00:00Z",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.from as jest.Mock).mockReturnThis();
    const mockFrom = supabase.from("") as any;
    mockFrom.select = jest.fn().mockReturnThis();
    mockFrom.order = jest.fn().mockResolvedValue({ data: [], error: null });
    mockFrom.insert = jest.fn().mockResolvedValue({ error: null });
  });

  it("should fetch accidents with reporter names", async () => {
    await accidentService.getAccidents();

    expect(supabase.from).toHaveBeenCalledWith("accidents");
    expect((supabase.from("") as any).select).toHaveBeenCalledWith(
      expect.stringContaining("reporter:user_id (name)"),
    );
    expect((supabase.from("") as any).order).toHaveBeenCalledWith("date_time", {
      ascending: false,
    });
  });

  it("should insert accident record with correct schema mapping when online", async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });

    const result = await accidentService.logAccident(validMockData);

    expect(supabase.from).toHaveBeenCalledWith("accidents");
    expect((supabase.from("") as any).insert).toHaveBeenCalledWith([
      expect.objectContaining({
        injury_description: validMockData.injury_description,
        injured_person_name: validMockData.injured_person_name,
        location: validMockData.location,
      }),
    ]);
    expect(result).toEqual({ success: true, offline: false });
  });

  it("should queue accident data in syncService when offline", async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: false });

    const result = await accidentService.logAccident(validMockData);

    expect(syncService.enqueue).toHaveBeenCalledWith(
      "accidents",
      expect.objectContaining({
        injury_description: validMockData.injury_description,
      }),
    );
    expect(result).toEqual({
      success: true,
      offline: true,
      message: "Saved to offline queue",
    });
  });

  it("should return error object if validation fails", async () => {
    const invalidData = {
      injury_description: "Short",
      location: "L",
      user_id: "u123",
      injured_person_name: "J",
    };
    const result = await accidentService.logAccident(invalidData as any);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("should return real database error message if supabase insert fails", async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });
    (supabase.from("") as any).insert.mockResolvedValueOnce({
      error: { message: "Column not found" },
    });

    const result = await accidentService.logAccident(validMockData);
    expect(result).toEqual({ success: false, error: "Column not found" });
  });
});
