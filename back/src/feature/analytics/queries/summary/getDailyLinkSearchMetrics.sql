MERGE {{- DESTINATION_TABLE -}} AS target
USING (
  SELECT
    DATE(@target_date) AS summary_date,
    COUNTIF(event_name = 'link_search_attempt') AS link_search_attempt_count,
    COUNTIF(event_name = 'link_search_complete') AS link_search_success_count
  FROM
    {{- GA4_EVENTS_TABLE -}}
  WHERE
    PARSE_DATE('%Y%m%d', event_date) = DATE(@target_date)
) AS source
ON target.summary_date = source.summary_date
WHEN MATCHED THEN
  UPDATE SET
    link_search_attempt_count = source.link_search_attempt_count,
    link_search_success_count = source.link_search_success_count
WHEN NOT MATCHED THEN
  INSERT (summary_date, link_search_attempt_count, link_search_success_count)
  VALUES (source.summary_date, source.link_search_attempt_count, source.link_search_success_count);
