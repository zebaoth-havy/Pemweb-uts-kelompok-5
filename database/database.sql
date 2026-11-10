CREATE DATABASE IF NOT EXISTS stockflow;

USE stockflow;

CREATE TABLE suppliers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    telepon VARCHAR(20),
    email VARCHAR(100),
    alamat TEXT
);

CREATE TABLE barang (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kode VARCHAR(30) NOT NULL UNIQUE,
    nama VARCHAR(150) NOT NULL,
    supplier_id INT NOT NULL,
    satuan VARCHAR(30) NOT NULL,
    stok INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_barang_supplier
        FOREIGN KEY (supplier_id)
        REFERENCES suppliers(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CHECK (stok >= 0)
);

CREATE TABLE barang_masuk (
    id INT AUTO_INCREMENT PRIMARY KEY,
    barang_id INT NOT NULL,
    tanggal DATE NOT NULL,
    jumlah INT NOT NULL,
    keterangan TEXT,
    CONSTRAINT fk_masuk_barang
        FOREIGN KEY (barang_id)
        REFERENCES barang(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CHECK (jumlah > 0)
);

CREATE TABLE barang_keluar (
    id INT AUTO_INCREMENT PRIMARY KEY,
    barang_id INT NOT NULL,
    tanggal DATE NOT NULL,
    jumlah INT NOT NULL,
    tujuan VARCHAR(150),
    CONSTRAINT fk_keluar_barang
        FOREIGN KEY (barang_id)
        REFERENCES barang(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CHECK (jumlah > 0)
);

INSERT INTO suppliers (nama, telepon, email, alamat) VALUES
('PT Sumber Makmur', '081234567890', 'sumber@email.com', 'Denpasar'),
('CV Berkah Jaya', '081234567891', 'berkah@email.com', 'Badung'),
('UD Mitra Sejahtera', '081234567892', 'mitra@email.com', 'Gianyar');

INSERT INTO barang (kode, nama, supplier_id, satuan, stok) VALUES
('BRG001', 'Laptop', 1, 'Unit', 10),
('BRG002', 'Mouse Wireless', 2, 'Pcs', 25),
('BRG003', 'Keyboard Mechanical', 3, 'Pcs', 15),
('BRG004', 'Monitor 24 Inch', 1, 'Unit', 8);
