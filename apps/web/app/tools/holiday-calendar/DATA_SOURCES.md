# Social calendar data policy

The social calendars intentionally use a small, reviewable static dataset. They
are content-planning aids, not employment, banking, or school closure calendars.

## Sources

- United Nations, International Days and Weeks:
  <https://www.un.org/en/observances/list-days-weeks>
- World Health Organization, World Mental Health Day:
  <https://www.who.int/campaigns/world-mental-health-day>
- U.S. Office of Personnel Management, Federal Holidays:
  <https://www.opm.gov/policy-data-oversight/pay-leave/federal-holidays/>
- National Portal of India calendar and government holiday publications:
  <https://www.india.gov.in/calendar>
- Direct calendar references for long-established dates:
  - <https://www.timeanddate.com/holidays/common/new-year-day>
  - <https://www.timeanddate.com/holidays/common/valentine-day>
  - <https://www.timeanddate.com/holidays/common/earth-day>
  - <https://www.timeanddate.com/holidays/common/halloween>
  - <https://www.timeanddate.com/holidays/common/christmas-day>

## Date rules

Fixed dates store a Gregorian month and day. Weekday-based holidays store a
rule such as “fourth Thursday in November” and are calculated for the selected
year in UTC, making results deterministic across browser time zones.

Observed or “in lieu of” workdays are not substituted for the named holiday.
Those rules depend on jurisdiction and employment context.

Movable lunar, lunisolar, religious, state, and regional dates are excluded
unless an authoritative annual date is explicitly reviewed and represented.
Do not copy one year's movable date into a recurring rule.

## Review checklist

Before adding an event, confirm that it has a durable primary source for civic
and awareness dates, or a direct established calendar reference for cultural
and seasonal dates. It must also have clear scope, a defensible category, and a
date rule that remains true across years. Prefer omission over a novelty date
with unclear provenance.
