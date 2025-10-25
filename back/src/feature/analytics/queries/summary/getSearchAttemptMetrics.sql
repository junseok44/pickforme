MERGE {{- DESTINATION_TABLE -}} AS target
USING (
  SELECT 
    DATE(@target_date) AS summary_date,
    COUNT(CASE WHEN event_name = 'keyword_search_submit' THEN 1 END) as search_total,
    COUNT(CASE WHEN event_name = 'keyword_search_complete' THEN 1 END) as search_success_count
  FROM 
    {{- GA4_EVENTS_TABLE -}}
  WHERE 
    PARSE_DATE('%Y%m%d', event_date) = DATE(@target_date)
    AND (event_name = 'keyword_search_submit' OR event_name = 'keyword_search_complete')
) AS source
ON target.summary_date = source.summary_date
WHEN MATCHED THEN
  UPDATE SET
    search_total = source.search_total,
    search_success_count = source.search_success_count
WHEN NOT MATCHED THEN
  INSERT (summary_date, search_total, search_success_count)
  VALUES (source.summary_date, source.search_total, source.search_success_count);