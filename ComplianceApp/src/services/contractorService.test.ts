jest.mock("../lib/supabase");
import { contractorService } from "./contractorService";
import { supabase } from "../lib/supabase";
import NetInfo from "@react-native-community/netinfo";
import { syncService } from "./syncService";

jest.mock("./syncService", () => ({
  syncService: {
    enqueue: jest.fn(),
  },
}));

describe("ContractorService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.from as jest.Mock).mockReturnThis();
  });

  it("should fetch a single contractor profile", async () => {
    (supabase.from("") as any).single.mockResolvedValue({
      data: { id: "u1", name: "John" },
      error: null,
    });

    const profile = await contractorService.getProfile("u1");

    expect(supabase.from).toHaveBeenCalledWith("profiles");
    expect((supabase.from("") as any).eq).toHaveBeenCalledWith("id", "u1");
    expect(profile.name).toBe("John");
  });

  it("should fetch all users with Contractor role", async () => {
    await contractorService.getAllContractors();
    expect((supabase.from("") as any).eq).toHaveBeenCalledWith(
      "role",
      "Contractor",
    );
  });

  it("should fetch only approved contractors", async () => {
    await contractorService.getApprovedContractors();
    expect((supabase.from("") as any).eq).toHaveBeenCalledWith(
      "role",
      "Contractor",
    );
    expect((supabase.from("") as any).eq).toHaveBeenCalledWith(
      "competence_status",
      "Approved",
    );
  });

  it("should update specialism online", async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });

    await contractorService.updateSpecialism("u1", "Electrical");

    expect(supabase.from).toHaveBeenCalledWith("profiles");
    expect((supabase.from("") as any).update).toHaveBeenCalledWith({
      specialism: "Electrical",
    });
  });

  it("should enqueue competence submission when offline", async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: false });
    const result = await contractorService.submitCompetence(
      "u123",
      "http://doc.pdf",
    );

    expect(result).toEqual({ success: true, offline: true });
  });

  it("should assign contractor to an incident when online", async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });

    await contractorService.assignToJob("job_123", "cont_456", false);

    expect(supabase.from).toHaveBeenCalledWith("incidents");
    expect((supabase.from("") as any).update).toHaveBeenCalledWith({
      assigned_to: "cont_456",
      status: "Assigned",
    });
  });

  it("should assign contractor to an asset when online", async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });

    await contractorService.assignToJob("asset_123", "cont_456", true);

    expect(supabase.from).toHaveBeenCalledWith("assets");
    expect((supabase.from("") as any).update).toHaveBeenCalledWith(
      expect.objectContaining({
        assigned_to: "cont_456",
      }),
    );
  });
});
