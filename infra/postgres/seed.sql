-- ============================================================
-- Demo Seed Data — Pre-seeded Signals for Apex Motors demo
-- ============================================================

INSERT INTO signals (signal_id, name, description, time_window_seconds, firing_expiry_seconds) VALUES
  (
    '11111111-0000-0000-0000-000000000001',
    'High Purchase Intent',
    'Customer viewed a vehicle 3+ times and checked service pricing within 7 days — strong buying signal.',
    604800,
    604800    -- active for 7 days
  ),
  (
    '11111111-0000-0000-0000-000000000002',
    'Loyalty Milestone Approaching',
    'Customer is within 500 points of their next loyalty tier.',
    NULL,
    2592000   -- active for 30 days
  ),
  (
    '11111111-0000-0000-0000-000000000003',
    'Active Driver',
    'Customer vehicle reported 10+ location updates in a single day — they''re on the road.',
    86400,
    86400     -- active for 1 day
  ),
  (
    '11111111-0000-0000-0000-000000000004',
    'Recent Renter Browsing',
    'Customer completed a rental in the past 30 days and is now viewing vehicles online.',
    2592000,
    2592000   -- active for 30 days
  ),
  (
    '11111111-0000-0000-0000-000000000005',
    'Dealership Walk-In',
    'Customer physically checked into a dealership or service center.',
    NULL,
    86400     -- active for 1 day
  ),
  (
    '11111111-0000-0000-0000-000000000006',
    'Lapsed High-Value Customer',
    'Customer with 2+ past purchases has had no activity in over 90 days.',
    NULL,
    7776000   -- active for 90 days
  )
ON CONFLICT (signal_id) DO UPDATE SET
  name                  = EXCLUDED.name,
  description           = EXCLUDED.description,
  time_window_seconds   = EXCLUDED.time_window_seconds,
  firing_expiry_seconds = EXCLUDED.firing_expiry_seconds,
  updated_at            = NOW();

-- Signal rules for "High Purchase Intent"
INSERT INTO signal_rules (signal_id, event_type, min_count, conditions, sort_order) VALUES
  ('11111111-0000-0000-0000-000000000001', 'vehicle_view', 3, '{}', 0),
  ('11111111-0000-0000-0000-000000000001', 'service_price_check', 1, '{}', 1)
ON CONFLICT DO NOTHING;

-- Signal rules for "Loyalty Milestone Approaching"
INSERT INTO signal_rules (signal_id, event_type, min_count, conditions, sort_order) VALUES
  ('11111111-0000-0000-0000-000000000002', 'points_balance_updated', 1, '{"points_to_next_tier": {"$lt": 500}}', 0)
ON CONFLICT DO NOTHING;

-- Signal rules for "Active Driver"
INSERT INTO signal_rules (signal_id, event_type, min_count, conditions, sort_order) VALUES
  ('11111111-0000-0000-0000-000000000003', 'location_update', 10, '{}', 0)
ON CONFLICT DO NOTHING;

-- Signal rules for "Recent Renter Browsing"
INSERT INTO signal_rules (signal_id, event_type, min_count, conditions, sort_order) VALUES
  ('11111111-0000-0000-0000-000000000004', 'rental_ended', 1, '{}', 0),
  ('11111111-0000-0000-0000-000000000004', 'vehicle_view', 2, '{}', 1)
ON CONFLICT DO NOTHING;

-- Signal rules for "Dealership Walk-In"
INSERT INTO signal_rules (signal_id, event_type, min_count, conditions, sort_order) VALUES
  ('11111111-0000-0000-0000-000000000005', 'store_checkin', 1, '{}', 0)
ON CONFLICT DO NOTHING;

-- Signal rules for "Lapsed High-Value Customer"
INSERT INTO signal_rules (signal_id, event_type, min_count, conditions, sort_order) VALUES
  ('11111111-0000-0000-0000-000000000006', 'purchase', 2, '{}', 0)
ON CONFLICT DO NOTHING;
