import { pool } from '../db/index.js';
import { sql } from 'slonik';
import { z } from 'zod';
import { BalanceAnalytics, ForecastResponse } from '../types/index.js';

/**
 * Service for analytical insights.
 * Strategy: "SQL-First" logic to ensure performance and precision.
 */
export class AnalyticsService {
  /**
   * Returns the historical running balance using Window Functions.
   */
  async getRunningBalance(userId: string): Promise<BalanceAnalytics[]> {
    const result = await pool.any(sql.type(z.any())`
      SELECT 
        transaction_date,
        amount::numeric(15,2) as amount,
        SUM(amount) OVER (ORDER BY transaction_date, created_at)::numeric(15,2) as running_balance
      FROM transactions
      WHERE user_id = ${userId}
      ORDER BY transaction_date ASC, created_at ASC
    `);

    return result as BalanceAnalytics[];
  }

  /**
   * Projects the next 30 days of balance.
   * Safety: Uses a 30-day calendar series to calculate the average 'burn rate', 
   * effectively handling days without transactions to avoid distorted projections.
   */
  async getForecast(userId: string): Promise<ForecastResponse[]> {
    const result = await pool.any(sql.type(z.any())`
      WITH daily_stats AS (
        -- Aggregated history for the last 30 intervals (Calendar complete)
        SELECT 
          d::date as day,
          COALESCE(SUM(amount), 0) as daily_total
        FROM generate_series(CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE - INTERVAL '1 day', '1 day') d
        LEFT JOIN transactions ON transaction_date = d AND user_id = ${userId}
        GROUP BY 1
      ),
      avg_burn AS (
        -- Calculate the 'burn rate' based on the robust daily average
        SELECT COALESCE(AVG(daily_total), 0) as burn_rate FROM daily_stats
      ),
      current_state AS (
        -- Current absolute balance
        SELECT COALESCE(SUM(amount), 0) as current_balance FROM transactions WHERE user_id = ${userId}
      ),
      future_calendar AS (
        -- Generate the next 30 days for projection
        SELECT 
          (CURRENT_DATE + (n || ' days')::interval)::date as forecast_date,
          n as days_ahead
        FROM generate_series(1, 30) n
      )
      SELECT 
          forecast_date as date,
          (current_balance + (burn_rate * days_ahead))::numeric(15,2) as projected_balance
      FROM future_calendar, avg_burn, current_state
      ORDER BY 1
    `);

    return result as ForecastResponse[];
  }
}

export const analyticsService = new AnalyticsService();
