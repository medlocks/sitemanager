jest.mock("../lib/supabase");
import { assetService } from "./assetService";
import { supabase } from "../lib/supabase";
import NetInfo from "@react-native-community/netinfo";
import { syncService } from "./syncService";

jest.mock("./syncService", () => ({
  syncService: {
    enqueue: jest.fn(),
  },
}));

describe("AssetService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.from as jest.Mock).mockReturnThis();
  });

  it("should create an asset online", async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });
    await assetService.createAsset({
      asset_name: "Test",
      type: "T",
      regulation: "R",
      location: "L",
      min_clearance_required: "1",
    });
    expect(supabase.from).toHaveBeenCalledWith("assets");
    expect((supabase.from("") as any).insert).toHaveBeenCalled();
  });

  it("should update an asset online", async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });
    await assetService.updateAsset("123", { asset_name: "Updated" } as any);
    expect((supabase.from("") as any).update).toHaveBeenCalled();
    expect((supabase.from("") as any).eq).toHaveBeenCalledWith("id", "123");
  });

  it("should delete an asset online", async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });
    await assetService.deleteAsset("123");
    expect((supabase.from("") as any).delete).toHaveBeenCalled();
    expect((supabase.from("") as any).eq).toHaveBeenCalledWith("id", "123");
  });

  it("should enqueue when offline", async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: false });
    await assetService.deleteAsset("123");
    expect(syncService.enqueue).toHaveBeenCalledWith("assets_deletions", {
      id: "123",
    });
  });
});
