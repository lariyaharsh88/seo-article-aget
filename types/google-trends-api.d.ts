declare module "google-trends-api" {
  export interface GoogleTrendsOptions {
    keyword?: string | string[];
    geo?: string | string[];
    hl?: string;
    timezone?: number;
    category?: number | string;
    trendDate?: Date;
    startTime?: Date;
    endTime?: Date;
    /** Hourly resolution for short date ranges (library forwards to Google Trends). */
    granularTimeResolution?: boolean;
  }

  interface GoogleTrends {
    dailyTrends(options: {
      geo: string;
      trendDate?: Date;
      hl?: string;
      timezone?: number;
    }): Promise<string>;
    realTimeTrends(options: {
      geo: string;
      category?: string;
      hl?: string;
      timezone?: number;
    }): Promise<string>;
    relatedQueries(options: GoogleTrendsOptions): Promise<string>;
    relatedTopics(options: GoogleTrendsOptions): Promise<string>;
    interestOverTime(options: GoogleTrendsOptions): Promise<string>;
  }

  const googleTrends: GoogleTrends;
  export default googleTrends;
}
