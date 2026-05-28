CREATE TABLE suppliers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(190) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE supplier_invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  supplier_id INT NOT NULL,
  invoice_number VARCHAR(100),
  invoice_date DATE,
  pdf_path VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

CREATE TABLE raw_materials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id INT,
  supplier_id INT,
  name VARCHAR(190) NOT NULL,
  quantity DECIMAL(12,3) NOT NULL DEFAULT 0,
  unit VARCHAR(40) NOT NULL DEFAULT 'unit',
  unit_cost DECIMAL(12,4) NOT NULL DEFAULT 0,
  total_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES supplier_invoices(id),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

CREATE TABLE packaging (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id INT,
  supplier_id INT,
  name VARCHAR(190) NOT NULL,
  quantity DECIMAL(12,3) NOT NULL DEFAULT 0,
  unit VARCHAR(40) NOT NULL DEFAULT 'unit',
  unit_cost DECIMAL(12,4) NOT NULL DEFAULT 0,
  total_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES supplier_invoices(id),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

CREATE TABLE transport (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id INT,
  supplier_id INT,
  description VARCHAR(190),
  allocation_basis ENUM('order_weight', 'item_quantity', 'invoice_value') DEFAULT 'order_weight',
  total_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES supplier_invoices(id),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

CREATE TABLE transport_providers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(190) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE transport_invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  supplier_id INT,
  provider_id INT NOT NULL,
  invoice_number VARCHAR(100),
  invoice_date DATE,
  reference VARCHAR(190),
  waybill_number VARCHAR(100),
  consignment_number VARCHAR(100),
  route VARCHAR(190),
  pieces DECIMAL(12,3),
  actual_weight_kg DECIMAL(12,3),
  chargeable_weight_kg DECIMAL(12,3),
  pdf_path VARCHAR(255),
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  vat_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  allocation_basis ENUM('order_weight', 'item_quantity', 'invoice_value', 'manual') DEFAULT 'order_weight',
  link_type ENUM('supplier_invoice', 'purchase_order', 'date_range', 'product_batch', 'woo_order_group') DEFAULT 'supplier_invoice',
  link_value VARCHAR(190),
  status ENUM('pending', 'allocated', 'part_allocated') DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  FOREIGN KEY (provider_id) REFERENCES transport_providers(id)
);

CREATE TABLE transport_invoice_lines (
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

CREATE TABLE transport_allocations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  transport_invoice_id INT NOT NULL,
  transport_invoice_line_id INT,
  component_type ENUM('raw_material', 'packaging') NOT NULL DEFAULT 'raw_material',
  component_id INT,
  product_id INT,
  supplier_invoice_id INT,
  woo_order_id BIGINT UNSIGNED,
  batch_reference VARCHAR(100),
  allocation_basis ENUM('order_weight', 'item_quantity', 'invoice_value', 'manual') DEFAULT 'order_weight',
  allocation_value DECIMAL(12,3) NOT NULL DEFAULT 0,
  allocated_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (transport_invoice_id) REFERENCES transport_invoices(id),
  FOREIGN KEY (transport_invoice_line_id) REFERENCES transport_invoice_lines(id),
  FOREIGN KEY (supplier_invoice_id) REFERENCES supplier_invoices(id)
);

CREATE TABLE finished_products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  woo_product_id BIGINT UNSIGNED,
  name VARCHAR(190) NOT NULL,
  sku VARCHAR(100),
  selling_price DECIMAL(12,2) NOT NULL DEFAULT 0
);

CREATE TABLE product_recipes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  version VARCHAR(40) DEFAULT 'v1',
  transport_weight DECIMAL(12,3) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES finished_products(id)
);

CREATE TABLE recipe_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  recipe_id INT NOT NULL,
  component_type ENUM('raw_material', 'packaging') NOT NULL,
  component_id INT,
  component_name VARCHAR(190) NOT NULL,
  quantity DECIMAL(12,3) NOT NULL,
  unit VARCHAR(40) DEFAULT 'unit',
  FOREIGN KEY (recipe_id) REFERENCES product_recipes(id)
);

CREATE TABLE woo_sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  woo_order_id BIGINT UNSIGNED NOT NULL,
  woo_product_id BIGINT UNSIGNED NOT NULL,
  quantity DECIMAL(12,3) NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  sold_at DATETIME NOT NULL
);

ALTER TABLE transport_allocations
  ADD CONSTRAINT fk_transport_allocations_product
  FOREIGN KEY (product_id) REFERENCES finished_products(id);
