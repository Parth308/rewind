import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

interface FunnelStep {
  type: 'event' | 'url';
  value: string;
}

export async function POST(req: NextRequest, context: { params: Promise<{ projectId: string }> }) {
  try {
    const params = await context.params;
    const body = await req.json();
    const steps: FunnelStep[] = body.steps || [];
    const timeWindowMs: number = body.timeWindowMs || 1800000;
    const filters = body.filters || {};

    if (steps.length === 0) {
      return NextResponse.json({ error: 'At least one step is required' }, { status: 400 });
    }

    const projectId = params.projectId;
    const safeProjectId = projectId.replace(/'/g, "''");

    // Build the dynamic CTEs
    let ctes = [];
    let selectFields = [];
    
    // We will also return the session_ids that dropped off at each step.
    // Dropoff at step 1: reached step 1, but NOT step 2.
    // Dropoff at step 2: reached step 2, but NOT step 3.

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const stepAlias = `s${i + 1}`;
      
      let condition = '';
      const safeValue = step.value.replace(/'/g, "''");
      if (step.type === 'event') {
        condition = `e.type = 5 AND e.data->'data'->>'tag' = '${safeValue}'`;
      } else if (step.type === 'url') {
        condition = `e.type = 4 AND e.data->'data'->>'href' ILIKE '%${safeValue}%'`;
      }

      if (i === 0) {
        // Base step (step 1)
        let filterSql = '';
        if (filters.browser) filterSql += ` AND s.browser = '${filters.browser.replace(/[^a-zA-Z0-9 ]/g, '')}'`;
        if (filters.os) filterSql += ` AND s.os = '${filters.os.replace(/[^a-zA-Z0-9 ]/g, '')}'`;
        if (filters.country) filterSql += ` AND s.country = '${filters.country.replace(/[^a-zA-Z0-9 ]/g, '')}'`;

        ctes.push(`
          ${stepAlias} AS (
            SELECT e.session_id, MIN(e.timestamp) as t
            FROM events e
            JOIN sessions s ON s.id = e.session_id
            WHERE s.project_id = '${safeProjectId}'
              AND ${condition}
              ${filterSql}
            GROUP BY e.session_id
          )
        `);
      } else {
        // Subsequent steps
        const prevAlias = `s${i}`;
        ctes.push(`
          ${stepAlias} AS (
            SELECT e.session_id, MIN(e.timestamp) as t
            FROM events e
            JOIN ${prevAlias} p ON p.session_id = e.session_id
            WHERE e.timestamp > p.t 
              AND e.timestamp <= p.t + ${timeWindowMs}
              AND ${condition}
            GROUP BY e.session_id
          )
        `);
      }
      
      selectFields.push(`(SELECT COUNT(*) FROM ${stepAlias}) AS count_${i + 1}`);
      // Also get session IDs that reached this step
      selectFields.push(`(SELECT COALESCE(json_agg(session_id), '[]') FROM ${stepAlias}) AS sessions_${i + 1}`);
    }

    const query = `
      WITH ${ctes.join(',\n')}
      SELECT ${selectFields.join(',\n')}
    `;

    // Execute raw SQL
    const { rows } = await db.execute(sql.raw(query));
    
    if (rows.length === 0) {
      return NextResponse.json({ success: true, results: [] });
    }

    const row = rows[0] as Record<string, any>;
    
    const results = steps.map((step, i) => {
      const currentCount = parseInt(row[`count_${i + 1}`], 10);
      const currentSessions = row[`sessions_${i + 1}`] as string[];
      
      let dropoffCount = 0;
      let dropoffSessionIds: string[] = [];
      let conversionRate = 100;
      
      if (i < steps.length - 1) {
        const nextSessions = new Set(row[`sessions_${i + 2}`] as string[]);
        dropoffSessionIds = currentSessions.filter(id => !nextSessions.has(id));
        dropoffCount = dropoffSessionIds.length;
      }
      
      if (i > 0) {
        const firstCount = parseInt(row[`count_1`], 10);
        conversionRate = firstCount > 0 ? (currentCount / firstCount) * 100 : 0;
      }

      return {
        stepIndex: i + 1,
        type: step.type,
        value: step.value,
        totalSessions: currentCount,
        dropoffCount,
        dropoffSessionIds,
        conversionRate: Math.round(conversionRate * 10) / 10,
      };
    });

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('[Funnel Analyze] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
