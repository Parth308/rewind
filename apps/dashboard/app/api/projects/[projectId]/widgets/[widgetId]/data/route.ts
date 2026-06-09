import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dashboardWidgets, sessions, events, errors } from '@rewind/shared';
import { eq, and, sql, isNull } from 'drizzle-orm';

export async function GET(req: NextRequest, context: { params: Promise<{ projectId: string, widgetId: string }> }) {
  try {
    const params = await context.params;
    
    // 1. Fetch widget config
    let widget: any;
    const targetProjectId = params.projectId === 'all' ? null : params.projectId;
    
    const rows = await db.select().from(dashboardWidgets)
      .where(and(
        eq(dashboardWidgets.id, params.widgetId),
        targetProjectId === null ? isNull(dashboardWidgets.projectId) : eq(dashboardWidgets.projectId, targetProjectId)
      ));
    
    if (rows.length === 0) return NextResponse.json({ error: 'Widget not found' }, { status: 404 });
    widget = rows[0];

    // 2. Fetch data based on metric
    let rawData: any[] = [];
    const config = widget.config as any;

    if (widget.metric === 'sessions') {
      const res = await db.execute(sql`
        SELECT date_trunc('day', started_at) as date, count(*) as count
        FROM sessions 
        ${params.projectId !== 'all' ? sql`WHERE project_id = ${params.projectId}` : sql``}
        GROUP BY 1 ORDER BY 1 DESC LIMIT 14
      `);
      rawData = res.rows;
    } 
    else if (widget.metric === 'rage_clicks') {
      const res = await db.execute(sql`
        SELECT date_trunc('day', started_at) as date, count(*) as count
        FROM sessions 
        WHERE has_rage_clicks = true
        ${params.projectId !== 'all' ? sql`AND project_id = ${params.projectId}` : sql``}
        GROUP BY 1 ORDER BY 1 DESC LIMIT 14
      `);
      rawData = res.rows;
    }
    else if (widget.metric === 'dead_clicks') {
      const res = await db.execute(sql`
        SELECT date_trunc('day', started_at) as date, count(*) as count
        FROM sessions 
        WHERE has_dead_clicks = true
        ${params.projectId !== 'all' ? sql`AND project_id = ${params.projectId}` : sql``}
        GROUP BY 1 ORDER BY 1 DESC LIMIT 14
      `);
      rawData = res.rows;
    }
    else if (widget.metric === 'u_turns') {
      const res = await db.execute(sql`
        SELECT date_trunc('day', started_at) as date, count(*) as count
        FROM sessions 
        WHERE has_u_turns = true
        ${params.projectId !== 'all' ? sql`AND project_id = ${params.projectId}` : sql``}
        GROUP BY 1 ORDER BY 1 DESC LIMIT 14
      `);
      rawData = res.rows;
    }
    else if (widget.metric === 'wild_scrolling') {
      const res = await db.execute(sql`
        SELECT date_trunc('day', started_at) as date, count(*) as count
        FROM sessions 
        WHERE has_wild_scrolling = true
        ${params.projectId !== 'all' ? sql`AND project_id = ${params.projectId}` : sql``}
        GROUP BY 1 ORDER BY 1 DESC LIMIT 14
      `);
      rawData = res.rows;
    }
    else if (widget.metric === 'events') {
      const res = await db.execute(sql`
        SELECT date_trunc('day', to_timestamp(events.timestamp / 1000.0)) as date, count(*) as count
        FROM events JOIN sessions ON events.session_id = sessions.id
        ${params.projectId !== 'all' ? sql`WHERE sessions.project_id = ${params.projectId}` : sql``}
        GROUP BY 1 ORDER BY 1 DESC LIMIT 14
      `);
      rawData = res.rows;
    }
    else if (widget.metric === 'network') {
      const res = await db.execute(sql`
        SELECT date_trunc('day', to_timestamp(network_requests.timestamp / 1000.0)) as date, count(*) as count
        FROM network_requests JOIN sessions ON network_requests.session_id = sessions.id
        ${params.projectId !== 'all' ? sql`WHERE sessions.project_id = ${params.projectId}` : sql``}
        GROUP BY 1 ORDER BY 1 DESC LIMIT 14
      `);
      rawData = res.rows;
    }
    else if (widget.metric === 'failed_api') {
      const res = await db.execute(sql`
        SELECT date_trunc('day', to_timestamp(network_requests.timestamp / 1000.0)) as date, count(*) as count
        FROM network_requests JOIN sessions ON network_requests.session_id = sessions.id
        WHERE network_requests.status >= 400
        ${params.projectId !== 'all' ? sql`AND sessions.project_id = ${params.projectId}` : sql``}
        GROUP BY 1 ORDER BY 1 DESC LIMIT 14
      `);
      rawData = res.rows;
    }
    else if (widget.metric === 'slow_api') {
      const res = await db.execute(sql`
        SELECT date_trunc('day', to_timestamp(network_requests.timestamp / 1000.0)) as date, count(*) as count
        FROM network_requests JOIN sessions ON network_requests.session_id = sessions.id
        WHERE network_requests.duration > 1000
        ${params.projectId !== 'all' ? sql`AND sessions.project_id = ${params.projectId}` : sql``}
        GROUP BY 1 ORDER BY 1 DESC LIMIT 14
      `);
      rawData = res.rows;
    }
    else if (widget.metric === 'errors') {
      const res = await db.execute(sql`
        SELECT date_trunc('day', to_timestamp(errors.timestamp / 1000.0)) as date, count(*) as count
        FROM errors JOIN sessions ON errors.session_id = sessions.id
        ${params.projectId !== 'all' ? sql`WHERE sessions.project_id = ${params.projectId}` : sql``}
        GROUP BY 1 ORDER BY 1 DESC LIMIT 14
      `);
      rawData = res.rows;
    }
    else if (widget.metric === 'console_warn') {
      const res = await db.execute(sql`
        SELECT date_trunc('day', to_timestamp(console_logs.timestamp / 1000.0)) as date, count(*) as count
        FROM console_logs JOIN sessions ON console_logs.session_id = sessions.id
        WHERE console_logs.level = 'warn'
        ${params.projectId !== 'all' ? sql`AND sessions.project_id = ${params.projectId}` : sql``}
        GROUP BY 1 ORDER BY 1 DESC LIMIT 14
      `);
      rawData = res.rows;
    }
    else if (widget.metric === 'ai_tokens') {
      const res = await db.execute(sql`
        SELECT date_trunc('day', created_at) as date, COALESCE(SUM(total_tokens), 0) as count
        FROM ai_usage_logs
        ${params.projectId !== 'all' ? sql`WHERE project_id = ${params.projectId}` : sql``}
        GROUP BY 1 ORDER BY 1 DESC LIMIT 14
      `);
      rawData = res.rows;
    }
    else if (widget.metric === 'custom_event') {
      const eventName = config.eventName;
      if (eventName) {
        // Safe interpolation using sql parameterized query
        const res = await db.execute(sql`
          SELECT date_trunc('day', to_timestamp(events.timestamp / 1000.0)) as date, count(*) as count
          FROM events JOIN sessions ON events.session_id = sessions.id
          WHERE events.type = 5 AND events.data->'data'->>'tag' = ${eventName}
          ${params.projectId !== 'all' ? sql`AND sessions.project_id = ${params.projectId}` : sql``}
          GROUP BY 1 ORDER BY 1 DESC LIMIT 14
        `);
        rawData = res.rows;
      }
    }

    // 3. Format into a 14-day continuous array
    const countsByDate = new Map();
    rawData.forEach((row: any) => {
      const d = new Date(row.date);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      countsByDate.set(label, (countsByDate.get(label) || 0) + parseInt(row.count, 10));
    });

    const formattedData = [];
    let totalCount = 0;
    
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const val = countsByDate.get(label) || 0;
      formattedData.push({
        date: label,
        value: val,
      });
      totalCount += val;
    }

    return NextResponse.json({ 
      success: true, 
      data: formattedData,
      total: totalCount 
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch widget data' }, { status: 500 });
  }
}
