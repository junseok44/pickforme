MERGE {{- DESTINATION_TABLE -}} AS target
USING (
  SELECT
    DATE(@target_date) AS summary_date,
    COUNTIF(event_name = 'keyword_search_result' AND (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'status') = 'started') AS keyword_search_submit_count,
    COUNTIF(event_name = 'keyword_search_result' AND (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'status') = 'success') AS keyword_search_success_count,
    COUNTIF(event_name = 'keyword_search_result' AND (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'status') = 'failure') AS keyword_search_failure_count,
    COUNTIF(event_name = 'search_item_click') AS search_item_click_count,
    COUNTIF(event_name = 'search_mode_view') AS search_result_pv
  FROM
    {{- GA4_EVENTS_TABLE -}}
  WHERE
    PARSE_DATE('%Y%m%d', event_date) = DATE(@target_date)
) AS source
ON target.summary_date = source.summary_date
WHEN MATCHED THEN
  UPDATE SET
    keyword_search_submit_count = source.keyword_search_submit_count,
    keyword_search_success_count = source.keyword_search_success_count,
    keyword_search_failure_count = source.keyword_search_failure_count,
    search_item_click_count = source.search_item_click_count,
    search_result_pv = source.search_result_pv
WHEN NOT MATCHED THEN
  INSERT (summary_date, keyword_search_submit_count, keyword_search_success_count, keyword_search_failure_count, search_item_click_count, search_result_pv)
  VALUES (source.summary_date, source.keyword_search_submit_count, source.keyword_search_success_count, source.keyword_search_failure_count, source.search_item_click_count, source.search_result_pv);