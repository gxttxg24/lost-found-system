CREATE DATABASE IF NOT EXISTS lost_found_system
DEFAULT CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE lost_found_system;

-- ============================================
-- 1. 用户表
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    avatar_url VARCHAR(255),
    role ENUM('user', 'admin') DEFAULT 'user',
    status ENUM('normal', 'banned') DEFAULT 'normal',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- 2. 物品分类表
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255)
);

-- ============================================
-- 3. 失物与招领信息表
-- ============================================
CREATE TABLE IF NOT EXISTS items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    category_id INT,
    type ENUM('lost', 'found') NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    location VARCHAR(100),
    event_time DATETIME,
    status ENUM('open', 'matching', 'claimed', 'closed') DEFAULT 'open',
    contact_info VARCHAR(100),
    view_count INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_items_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_items_category FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- ============================================
-- 4. 物品图片表
-- ============================================
CREATE TABLE IF NOT EXISTS item_images (
    id INT PRIMARY KEY AUTO_INCREMENT,
    item_id INT NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_item_images_item FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

-- ============================================
-- 5. 智能匹配结果表
-- ============================================
CREATE TABLE IF NOT EXISTS matches (
    id INT PRIMARY KEY AUTO_INCREMENT,
    lost_item_id INT NOT NULL,
    found_item_id INT NOT NULL,
    similarity_score DECIMAL(5, 2) NOT NULL,
    match_reason VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_matches_lost FOREIGN KEY (lost_item_id) REFERENCES items(id),
    CONSTRAINT fk_matches_found FOREIGN KEY (found_item_id) REFERENCES items(id),
    CONSTRAINT uq_matches_pair UNIQUE (lost_item_id, found_item_id)
);

-- ============================================
-- 6. 认领申请表
-- ============================================
CREATE TABLE IF NOT EXISTS claim_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    item_id INT NOT NULL,
    applicant_id INT NOT NULL,
    owner_id INT NOT NULL,
    description TEXT,
    proof_text TEXT,
    status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
    review_comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_claims_item FOREIGN KEY (item_id) REFERENCES items(id),
    CONSTRAINT fk_claims_applicant FOREIGN KEY (applicant_id) REFERENCES users(id),
    CONSTRAINT fk_claims_owner FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- ============================================
-- 7. 通知表
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(100) NOT NULL,
    content TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ============================================
-- 8. 索引
-- ============================================
CREATE INDEX IF NOT EXISTS idx_items_type ON items(type);
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category_id);
CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
CREATE INDEX IF NOT EXISTS idx_items_created_at ON items(created_at);
CREATE INDEX IF NOT EXISTS idx_claims_applicant ON claim_requests(applicant_id);
CREATE INDEX IF NOT EXISTS idx_claims_owner ON claim_requests(owner_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claim_requests(status);
CREATE INDEX IF NOT EXISTS idx_matches_lost ON matches(lost_item_id);
CREATE INDEX IF NOT EXISTS idx_matches_found ON matches(found_item_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

-- ============================================
-- 9. 初始化分类数据
-- ============================================
INSERT IGNORE INTO categories (name, description) VALUES
('证件', '学生证、身份证、校园卡等'),
('电子产品', '手机、耳机、电脑、充电器等'),
('书籍资料', '教材、笔记、论文资料等'),
('生活用品', '水杯、雨伞、钥匙等'),
('衣物饰品', '衣服、帽子、手链等'),
('其他', '其他类型物品');
