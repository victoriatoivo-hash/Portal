ALTER TABLE packaging
  ADD COLUMN unit VARCHAR(40) NOT NULL DEFAULT 'unit' AFTER quantity;

ALTER TABLE recipe_items
  ADD COLUMN component_id INT NULL AFTER component_type;

ALTER TABLE transport_allocations
  ADD COLUMN component_type ENUM('raw_material', 'packaging') NOT NULL DEFAULT 'raw_material' AFTER transport_invoice_id,
  ADD COLUMN component_id INT NULL AFTER component_type;

CREATE TABLE IF NOT EXISTS transport_invoice_lines (
  id INT AUTO_INCREMENT PRIMARY KEY,
  transport_invoice_id INT NOT NULL,
  supplier_id INT,
  supplier_name VARCHAR(190),
  waybill_number VARCHAR(100),
  consignment_number VARCHAR(100),
  description VARCHAR(255),
  route VARCHAR(190),
  pieces DECIMAL(12,3),
  actual_weight_kg DECIMAL(12,3),
  chargeable_weight_kg DECIMAL(12,3),
  line_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (transport_invoice_id) REFERENCES transport_invoices(id),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

ALTER TABLE transport_allocations
  ADD COLUMN transport_invoice_line_id INT NULL AFTER transport_invoice_id;
