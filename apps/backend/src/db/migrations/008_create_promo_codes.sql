CREATE TABLE IF NOT EXISTS promo_codes (
  id CHAR(36) NOT NULL PRIMARY KEY,
  merchant_id CHAR(36) NOT NULL,
  code VARCHAR(50) NOT NULL,
  discount_type ENUM('PERCENTAGE','FIXED_AMOUNT') NOT NULL,
  discount_value DECIMAL(10,2) NOT NULL,
  max_discount_amount DECIMAL(10,2) NULL,
  min_transaction_amount DECIMAL(10,2) NULL,
  valid_from DATETIME NOT NULL,
  valid_until DATETIME NOT NULL,
  max_usage INT NULL,
  max_usage_per_customer INT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_promo_merchant FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE,
  UNIQUE KEY uq_promo_merchant_code (merchant_id, code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
