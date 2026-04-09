import axios from "axios";
import { KarmaService } from "../../../src/services/KarmaService";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("KarmaService", () => {
  let karmaService: KarmaService;

  beforeEach(() => {
    karmaService = new KarmaService();
  });

  describe("checkBlacklist", () => {
    it("should return true when user is blacklisted", async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          status: "success",
          data: {
            karma_identity: "test@example.com",
            amount_in_contention: "0",
            reason: "fraud",
            default_date: "2024-01-01",
            karma_type: "identity",
            karma_identity_type: "email",
          },
        },
      });

      const result = await karmaService.checkBlacklist("test@example.com");

      expect(result).toBe(true);
    });

    it("should return false when user is not blacklisted (null data)", async () => {
      mockedAxios.get.mockResolvedValue({
        data: { status: "success", data: null },
      });

      const result = await karmaService.checkBlacklist("clean@example.com");

      expect(result).toBe(false);
    });

    it("should return false when API returns 404", async () => {
      mockedAxios.get.mockRejectedValue({ response: { status: 404 } });

      const result = await karmaService.checkBlacklist("unknown@example.com");

      expect(result).toBe(false);
    });

    it("should return false on API error and not throw", async () => {
      mockedAxios.get.mockRejectedValue(new Error("Network error"));

      const result = await karmaService.checkBlacklist("test@example.com");

      expect(result).toBe(false);
    });
  });
});
