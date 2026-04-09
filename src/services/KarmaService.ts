import { injectable } from "inversify";
import axios from "axios";
import { IKarmaService } from "../types/interfaces";
import { config } from "../config";
import { logger } from "../utils/logger";

@injectable()
export class KarmaService implements IKarmaService {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor() {
    this.baseUrl = config.adjutor.baseUrl;
    this.apiKey = config.adjutor.apiKey;
  }

  async checkBlacklist(identity: string): Promise<boolean> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/verification/karma/${encodeURIComponent(identity)}`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );
      const hasKarmaRecord = response.data?.data !== null;
      if (hasKarmaRecord) {
        logger.warn(`Karma blacklist hit for identity check`);
      }
      return hasKarmaRecord;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return false;
      }
      logger.error(`Karma service check failed: ${error.message}`);
      return false;
    }
  }
}
