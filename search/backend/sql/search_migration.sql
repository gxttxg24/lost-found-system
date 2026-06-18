-- 搜索模块数据库补丁
-- 在已有数据库上执行一次即可；如果已存在会报 Duplicate key 错误，忽略即可。
USE lost_found_system;

-- 为中文全文搜索添加 ngram FULLTEXT 索引（MySQL 8.0 内置，无需额外插件）
ALTER TABLE items
  ADD FULLTEXT INDEX ft_items_search (title, description, location)
  WITH PARSER ngram;
