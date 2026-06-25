import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function getWidgetData(projectId: string, widget: any) {
  try {
    let rawData: any[] = [];
    const config = widget.config as any || {};
    const timeframe = parseInt(config.timeframe, 10) || 14;

    if (widget.metric === 'sessions') {
      const res = await db.execute(sql`
        SELECT date_trunc('day', started_at) as date, count(*) as count
        FROM sessions 
        ${projectId !== 'all' ? sql`WHERE project_id = ${projectId}` : sql``}
        GROUP BY 1 ORDER BY 1 DESC LIMIT ${timeframe}
      `);
      rawData = res.rows;
    } 
    else if (widget.metric === 'rage_clicks') {
    const res = await db.execute(sql`
      SELECT date_trunc('day', started_at) as date, count(*) as count
      FROM sessions 
      WHERE has_rage_clicks = true
      ${projectId !== 'all' ? sql`AND project_id = ${projectId}` : sql``}
      GROUP BY 1 ORDER BY 1 DESC LIMIT ${timeframe}
    `);
    rawData = res.rows;
  }
  else if (widget.metric === 'dead_clicks') {
    const res = await db.execute(sql`
      SELECT date_trunc('day', started_at) as date, count(*) as count
      FROM sessions 
      WHERE has_dead_clicks = true
      ${projectId !== 'all' ? sql`AND project_id = ${projectId}` : sql``}
      GROUP BY 1 ORDER BY 1 DESC LIMIT ${timeframe}
    `);
    rawData = res.rows;
  }
  else if (widget.metric === 'u_turns') {
    const res = await db.execute(sql`
      SELECT date_trunc('day', started_at) as date, count(*) as count
      FROM sessions 
      WHERE has_u_turns = true
      ${projectId !== 'all' ? sql`AND project_id = ${projectId}` : sql``}
      GROUP BY 1 ORDER BY 1 DESC LIMIT ${timeframe}
    `);
    rawData = res.rows;
  }
  else if (widget.metric === 'wild_scrolling') {
    const res = await db.execute(sql`
      SELECT date_trunc('day', started_at) as date, count(*) as count
      FROM sessions 
      WHERE has_wild_scrolling = true
      ${projectId !== 'all' ? sql`AND project_id = ${projectId}` : sql``}
      GROUP BY 1 ORDER BY 1 DESC LIMIT ${timeframe}
    `);
    rawData = res.rows;
  }
  else if (widget.metric === 'events') {
    const res = await db.execute(sql`
      SELECT date_trunc('day', to_timestamp(events.timestamp / 1000.0)) as date, count(*) as count
      FROM events JOIN sessions ON events.session_id = sessions.id
      ${projectId !== 'all' ? sql`WHERE sessions.project_id = ${projectId}` : sql``}
      GROUP BY 1 ORDER BY 1 DESC LIMIT ${timeframe}
    `);
    rawData = res.rows;
  }
  else if (widget.metric === 'network') {
    const res = await db.execute(sql`
      SELECT date_trunc('day', to_timestamp(network_requests.timestamp / 1000.0)) as date, count(*) as count
      FROM network_requests JOIN sessions ON network_requests.session_id = sessions.id
      ${projectId !== 'all' ? sql`WHERE sessions.project_id = ${projectId}` : sql``}
      GROUP BY 1 ORDER BY 1 DESC LIMIT ${timeframe}
    `);
    rawData = res.rows;
  }
  else if (widget.metric === 'failed_api') {
    const res = await db.execute(sql`
      SELECT date_trunc('day', to_timestamp(network_requests.timestamp / 1000.0)) as date, count(*) as count
      FROM network_requests JOIN sessions ON network_requests.session_id = sessions.id
      WHERE network_requests.status >= 400
      ${projectId !== 'all' ? sql`AND sessions.project_id = ${projectId}` : sql``}
      GROUP BY 1 ORDER BY 1 DESC LIMIT ${timeframe}
    `);
    rawData = res.rows;
  }
  else if (widget.metric === 'slow_api') {
    const res = await db.execute(sql`
      SELECT date_trunc('day', to_timestamp(network_requests.timestamp / 1000.0)) as date, count(*) as count
      FROM network_requests JOIN sessions ON network_requests.session_id = sessions.id
      WHERE network_requests.duration > 1000
      ${projectId !== 'all' ? sql`AND sessions.project_id = ${projectId}` : sql``}
      GROUP BY 1 ORDER BY 1 DESC LIMIT ${timeframe}
    `);
    rawData = res.rows;
  }
  else if (widget.metric === 'errors') {
    const res = await db.execute(sql`
      SELECT date_trunc('day', to_timestamp(errors.timestamp / 1000.0)) as date, count(*) as count
      FROM errors JOIN sessions ON errors.session_id = sessions.id
      ${projectId !== 'all' ? sql`WHERE sessions.project_id = ${projectId}` : sql``}
      GROUP BY 1 ORDER BY 1 DESC LIMIT ${timeframe}
    `);
    rawData = res.rows;
  }
  else if (widget.metric === 'console_warn') {
    const res = await db.execute(sql`
      SELECT date_trunc('day', to_timestamp(console_logs.timestamp / 1000.0)) as date, count(*) as count
      FROM console_logs JOIN sessions ON console_logs.session_id = sessions.id
      WHERE console_logs.level = 'warn'
      ${projectId !== 'all' ? sql`AND sessions.project_id = ${projectId}` : sql``}
      GROUP BY 1 ORDER BY 1 DESC LIMIT ${timeframe}
    `);
    rawData = res.rows;
  }
  else if (widget.metric === 'ai_tokens') {
    const res = await db.execute(sql`
      SELECT date_trunc('day', created_at) as date, COALESCE(SUM(total_tokens), 0) as count
      FROM ai_usage_logs
      ${projectId !== 'all' ? sql`WHERE project_id = ${projectId}` : sql``}
      GROUP BY 1 ORDER BY 1 DESC LIMIT ${timeframe}
    `);
    rawData = res.rows;
  }
  else if (widget.metric === 'custom_event') {
    const eventName = config.eventName;
    if (eventName) {
      const res = await db.execute(sql`
        SELECT date_trunc('day', to_timestamp(events.timestamp / 1000.0)) as date, count(*) as count
        FROM events JOIN sessions ON events.session_id = sessions.id
        WHERE events.type = 5 AND events.data->'data'->>'tag' = ${eventName}
        ${projectId !== 'all' ? sql`AND sessions.project_id = ${projectId}` : sql``}
        GROUP BY 1 ORDER BY 1 DESC LIMIT ${timeframe}
      `);
      rawData = res.rows;
    }
  }
  
  // Distibution metrics (Pie/Bar charts)
  else if (['browser_distribution', 'os_distribution', 'device_distribution', 'error_source_distribution'].includes(widget.metric)) {
    let distributionRes;
    
    if (widget.metric === 'browser_distribution') {
      distributionRes = await db.execute(sql`
        SELECT browser as name, count(*) as value
        FROM sessions
        WHERE browser IS NOT NULL AND browser != 'Unknown' AND started_at >= NOW() - INTERVAL '1 day' * ${timeframe}
        ${projectId !== 'all' ? sql`AND project_id = ${projectId}` : sql``}
        GROUP BY 1 ORDER BY 2 DESC LIMIT 10
      `);
    } else if (widget.metric === 'os_distribution') {
      distributionRes = await db.execute(sql`
        SELECT os as name, count(*) as value
        FROM sessions
        WHERE os IS NOT NULL AND os != 'Unknown' AND started_at >= NOW() - INTERVAL '1 day' * ${timeframe}
        ${projectId !== 'all' ? sql`AND project_id = ${projectId}` : sql``}
        GROUP BY 1 ORDER BY 2 DESC LIMIT 10
      `);
    } else if (widget.metric === 'device_distribution') {
      distributionRes = await db.execute(sql`
        SELECT device as name, count(*) as value
        FROM sessions
        WHERE device IS NOT NULL AND device != 'Unknown' AND started_at >= NOW() - INTERVAL '1 day' * ${timeframe}
        ${projectId !== 'all' ? sql`AND project_id = ${projectId}` : sql``}
        GROUP BY 1 ORDER BY 2 DESC LIMIT 10
      `);
    } else if (widget.metric === 'error_source_distribution') {
      distributionRes = await db.execute(sql`
        SELECT errors.source as name, count(*) as value
        FROM errors JOIN sessions ON errors.session_id = sessions.id
        WHERE errors.source IS NOT NULL AND to_timestamp(errors.timestamp / 1000.0) >= NOW() - INTERVAL '1 day' * ${timeframe}
        ${projectId !== 'all' ? sql`AND sessions.project_id = ${projectId}` : sql``}
        GROUP BY 1 ORDER BY 2 DESC LIMIT 10
      `);
    }
    
    const formattedData = distributionRes?.rows.map((row: any) => ({
      name: row.name,
      value: parseInt(row.value, 10)
    })) || [];
    
    return {
      success: true,
      data: formattedData,
      total: formattedData.reduce((acc: number, curr: any) => acc + curr.value, 0)
    };
  }
  
  if (widget.type === 'client_targets') {
    const browserRes = await db.execute(sql`
      SELECT browser, count(*) as count
      FROM sessions
      WHERE browser IS NOT NULL AND browser != 'Unknown'
      ${projectId !== 'all' ? sql`AND project_id = ${projectId}` : sql``}
      GROUP BY 1 ORDER BY 2 DESC LIMIT 5
    `);
    
    const avgRes = await db.execute(sql`
      SELECT avg(duration_ms) as avg_duration
      FROM sessions
      WHERE duration_ms IS NOT NULL
      ${projectId !== 'all' ? sql`AND project_id = ${projectId}` : sql``}
    `);
    
    const avgMs = avgRes.rows[0]?.avg_duration ? Math.round(Number(avgRes.rows[0].avg_duration) / 1000) : null;

    return {
      success: true,
      data: {
        browserStats: browserRes.rows,
        avgMs
      }
    };
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
  
  for (let i = timeframe - 1; i >= 0; i--) {
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

  return { 
    success: true, 
    data: formattedData,
    total: totalCount 
  };
} catch (err: any) {
  console.error('getWidgetData error:', err);
  return { success: false, error: err.message };
}
}
