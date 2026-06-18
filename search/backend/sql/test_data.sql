-- 测试数据：用于验证搜索与匹配功能
-- 执行前请确保已初始化数据库（init.sql）
USE lost_found_system;

-- 测试用户（密码均为 test123 的 Werkzeug hash）
INSERT IGNORE INTO users (id, username, password_hash, phone, email, role) VALUES
(1, 'alice',  'pbkdf2:sha256:260000$test$placeholder1', '13800000001', 'alice@example.com', 'user'),
(2, 'bob',    'pbkdf2:sha256:260000$test$placeholder2', '13800000002', 'bob@example.com',   'user'),
(3, 'carol',  'pbkdf2:sha256:260000$test$placeholder3', '13800000003', 'carol@example.com', 'user');

-- 失物记录
INSERT IGNORE INTO items (id, user_id, category_id, type, title, description, location, event_time, status, contact_info) VALUES
(1,  1, 1, 'lost', '丢失学生证',       '蓝色校园卡，背面有我的名字，非常重要',                 '图书馆三楼',     '2024-11-10 14:00:00', 'open', '微信：alice001'),
(2,  1, 2, 'lost', '遗失黑色耳机',     'Sony WH-1000XM4 黑色头戴式耳机，有收纳袋',           '自习室A区',      '2024-11-12 09:30:00', 'open', '电话：13800000001'),
(3,  2, 4, 'lost', '丢失黑色双肩包',   '品牌 Osprey，里面有笔记本和充电器，非常重要',         '图书馆一楼大厅', '2024-11-15 16:00:00', 'open', '微信：bob002'),
(4,  2, 3, 'lost', '遗失数学课笔记',   '大三上学期数学分析笔记，红色封面，A4大小',           '教学楼305教室',  '2024-11-18 11:00:00', 'open', '邮件：bob@example.com'),
(5,  3, 5, 'lost', '丢失蓝色围巾',     '手工编织，深蓝色，长约150cm',                        '食堂二楼',       '2024-11-20 12:30:00', 'open', '电话：13800000003'),
(6,  1, 4, 'lost', '遗失雨伞',         '黑色自动折叠伞，伞柄有轻微磨损',                     '体育馆入口',     '2024-11-22 18:00:00', 'open', '微信：alice001'),
(7,  3, 1, 'lost', '丢失身份证',       '本人身份证，证件号以370开头，内蒙人',                 '便利店附近',     '2024-11-25 10:00:00', 'open', '电话：13800000003');

-- 招领记录
INSERT IGNORE INTO items (id, user_id, category_id, type, title, description, location, event_time, status, contact_info) VALUES
(8,  2, 1, 'found', '捡到一张校园卡',   '蓝色学生证，正面印有校徽，已交至图书馆前台',         '图书馆三楼',     '2024-11-10 15:30:00', 'open', '微信：bob002'),
(9,  3, 2, 'found', '捡到黑色头戴耳机', '看起来是 Sony 的，有收纳袋，放在失物招领箱',         '自习室B区走廊',  '2024-11-12 11:00:00', 'open', '电话：13800000003'),
(10, 1, 4, 'found', '捡到一个黑色背包', '里面有笔记本电脑和数据线，目前由我保管',             '图书馆门口',     '2024-11-15 16:30:00', 'open', '微信：alice001'),
(11, 3, 3, 'found', '捡到一本笔记本',   '红色封面的数学笔记，看起来是大学生的，在教室里发现', '教学楼3楼走廊',  '2024-11-18 12:00:00', 'open', '邮件：carol@example.com'),
(12, 2, 5, 'found', '捡到围巾',         '深蓝色手织围巾，在食堂椅子上发现',                  '食堂二楼',       '2024-11-20 13:00:00', 'open', '微信：bob002'),
(13, 1, 4, 'found', '捡到一把雨伞',     '黑色折叠伞，放在体育馆门口的物品架上',              '体育馆',         '2024-11-22 19:00:00', 'open', '电话：13800000001'),
(14, 2, 1, 'found', '捡到证件',         '身份证一张，姓名暂不公开，请失主凭特征认领',         '校门口保安室',   '2024-11-25 11:00:00', 'open', '微信：bob002');
