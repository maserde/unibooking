-- Compound index for availability check queries
CREATE INDEX idx_bookings_availability
  ON bookings (asset_unit_id, status, start_time, end_time);

-- Index for booking list filtering by merchant + status
CREATE INDEX idx_bookings_merchant_status
  ON bookings (merchant_id, status);

-- Index for merchant_users lookup by merchant
CREATE INDEX idx_merchant_users_merchant
  ON merchant_users (merchant_id);

-- Index for assets by merchant
CREATE INDEX idx_assets_merchant
  ON assets (merchant_id);

-- Index for magic_links by customer
CREATE INDEX idx_magic_links_customer
  ON magic_links (customer_id);

-- Index for payments by booking
CREATE INDEX idx_payments_booking
  ON payments (booking_id);

-- Index for bookings by customer
CREATE INDEX idx_bookings_customer
  ON bookings (customer_id);
