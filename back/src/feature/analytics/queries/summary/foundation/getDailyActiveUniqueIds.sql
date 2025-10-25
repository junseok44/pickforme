MERGE {{- DESTINATION_TABLE -}} AS target
using (
    select 
        DATE(@target_date) as summary_date,
        user_pseudo_id as user_unique_id,
        count(*) as total_events,
        min(TIMESTAMP_MICROS(event_timestamp)) as first_event_time,
        max(TIMESTAMP_MICROS(event_timestamp)) as last_event_time
    from {{- GA4_EVENTS_TABLE -}}
    where event_date = FORMAT_DATE('%Y%m%d', @target_date)
    group by user_pseudo_id
    order by count(*) desc
    limit 1000000
) as source
on target.summary_date = source.summary_date and target.user_unique_id = source.user_unique_id
when matched then
    update set
        total_events = source.total_events,
        first_event_time = source.first_event_time,
        last_event_time = source.last_event_time
when not matched then
    insert (summary_date, user_unique_id, total_events, first_event_time, last_event_time)
    values (source.summary_date, source.user_unique_id, source.total_events, source.first_event_time, source.last_event_time);