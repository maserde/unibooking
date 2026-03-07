ALTER TABLE merchants
  ADD COLUMN mayar_webhook_status VARCHAR(20) NULL AFTER mayar_api_key_encrypted;