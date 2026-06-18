# 搜索与智能匹配模块 功能设计

## 一、模块定位

本模块负责两件事：

1. **搜索**：用户输入关键词，在数据库中检索相关失物或招领信息，按相关度排序返回。
2. **智能匹配**：给定一条失物（或招领）记录，自动在对侧类型中找出最相似的候选，辅助双方快速找到彼此。

两者是独立功能，但共用底层的文本相似度计算逻辑。

---

## 二、搜索功能设计

### 2.1 功能说明

用户在搜索框输入关键词，系统在 `items` 表中检索匹配结果，结果按相关度从高到低排列。  
搜索时**必须指定 type（lost 或 found）**，失物和招领不混合展示。

### 2.2 输入参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `q` | string | 否 | 关键词，可为空（空时返回全部） |
| `type` | enum | 是 | `lost` 或 `found` |
| `category_id` | int | 否 | 分类筛选 |
| `status` | enum | 否 | `open` / `matching` / `claimed` / `closed`，默认不限 |
| `location` | string | 否 | 地点关键词 |
| `start_date` | string | 否 | 事发时间下界（格式 `YYYY-MM-DD`） |
| `end_date` | string | 否 | 事发时间上界 |
| `sort` | enum | 否 | `relevance`（默认）/ `time_desc` / `time_asc` |
| `page` | int | 否 | 页码，默认 1 |
| `page_size` | int | 否 | 每页条数，默认 10 |

### 2.3 搜索流程

```
用户输入
    │
    ▼
① 数据库层：MySQL FULLTEXT 粗筛
    - 对 items.title + items.description + items.location 建 ngram FULLTEXT 索引
    - 用 MATCH ... AGAINST 取得数据库侧相关度分（relevanc_db）
    - 同时应用 type / category / status / location / date 等过滤条件
    │
    ▼
② 应用层：Python 精排（仅 q 非空时执行）
    - jieba 分词：对候选结果的 title + description 做中文分词
    - TF-IDF 向量化：用 sklearn TfidfVectorizer 将查询和候选文本向量化
    - 余弦相似度：计算查询向量与每条候选向量的余弦相似度（similarity_text）
    - 综合得分：score = 0.7 × similarity_text + 0.3 × normalize(relevanc_db)
    │
    ▼
③ 排序 & 分页
    - sort=relevance 时按综合得分降序
    - sort=time_desc/asc 时按 event_time 排序（忽略相关度）
    - 分页切片返回
```

**关键技术：MySQL ngram FULLTEXT**

```sql
-- 在 init.sql 或迁移脚本中添加
ALTER TABLE items
  ADD FULLTEXT INDEX ft_items_search (title, description, location)
  WITH PARSER ngram;
```

```sql
-- 查询示例（后端生成）
SELECT *, MATCH(title, description, location) AGAINST (:q IN BOOLEAN MODE) AS relevance_db
FROM items
WHERE type = :type
  AND MATCH(title, description, location) AGAINST (:q IN BOOLEAN MODE) > 0
  AND (category_id = :category_id OR :category_id IS NULL)
  AND (status = :status OR :status IS NULL)
ORDER BY relevance_db DESC
LIMIT :offset, :page_size;
```

> 当 `q` 为空时跳过 FULLTEXT，直接用普通条件过滤后按 `created_at DESC` 排序（即"浏览全部"模式）。

### 2.4 返回结果

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "total": 42,
    "page": 1,
    "page_size": 10,
    "items": [
      {
        "id": 5,
        "type": "lost",
        "title": "黑色双肩包",
        "description": "...",
        "category_id": 4,
        "category_name": "生活用品",
        "location": "图书馆三楼",
        "event_time": "2024-11-10 14:00:00",
        "status": "open",
        "contact_info": "...",
        "images": ["http://localhost:5000/uploads/items/xxx.jpg"],
        "username": "zhangsan",
        "relevance_score": 0.87
      }
    ]
  }
}
```

---

## 三、智能匹配功能设计

### 3.1 功能说明

给定一条失物记录（type=lost），在所有招领记录（type=found）中找出最相似的 Top-N 候选；反之亦然。  
**失物永远只与招领匹配，不与失物匹配。**

匹配结果持久化到 `matches` 表（`lost_item_id` + `found_item_id` + `similarity_score`），供后续直接读取，避免重复计算。

### 3.2 触发时机

| 触发方式 | 说明 |
|------|------|
| **被动触发（主流程）** | 用户在"物品详情页"点击"查看智能匹配"时，后端检查 matches 表，若无记录则实时计算并写入 |
| **主动触发（可选）** | 用户发布新物品后，前端可调用 `POST /api/matches/trigger/<item_id>` 提前触发计算 |

实时计算对数据量不大的课程项目完全可行（百条数据级别）。

### 3.3 相似度计算方法

#### 3.3.1 文本相似度（权重 60%）

对 `title + " " + description` 拼接文本，用 jieba 做中文分词，再用 TF-IDF + 余弦相似度计算。

```
text_sim = cosine_similarity(tfidf(item_a.title+description), tfidf(item_b.title+description))
```

实现方式：每次匹配时，将目标物品与所有候选物品的文本一起放入 `TfidfVectorizer` 拟合，得到向量矩阵后批量计算余弦相似度。

#### 3.3.2 分类匹配分（权重 20%）

```
category_score = 1.0 if item_a.category_id == item_b.category_id else 0.0
```

#### 3.3.3 地点相似分（权重 10%）

对 location 字符串做简单字符重叠率计算（不做精确地址解析）：

```
location_score = len(set(chars_a) & set(chars_b)) / max(len(chars_a), len(chars_b), 1)
```

其中 `chars` 为去空格后的字符集合。

#### 3.3.4 时间接近分（权重 10%）

```
delta_days = |item_a.event_time - item_b.event_time| 的天数差
time_score = max(0, 1 - delta_days / 30)
```

即时间差在 30 天以内才有分，超过 30 天得 0 分。

#### 3.3.5 综合评分公式

```
final_score = 0.6 × text_sim
            + 0.2 × category_score
            + 0.1 × location_score
            + 0.1 × time_score
```

取所有候选中 `final_score > 0.1` 的，按分降序取 Top-5 写入 `matches` 表。

### 3.4 match_reason 字段

匹配记录存入时生成一段中文说明，便于前端展示：

```
"标题描述高度相似；分类相同（证件）；地点重叠（图书馆）"
```

### 3.5 返回结果（GET /api/matches/item/<item_id>）

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "target_item": { "id": 5, "type": "lost", "title": "..." },
    "matches": [
      {
        "match_id": 12,
        "item": {
          "id": 23,
          "type": "found",
          "title": "捡到黑色双肩包",
          "location": "图书馆",
          "event_time": "2024-11-11 09:00:00",
          "images": ["..."],
          "username": "lisi"
        },
        "similarity_score": 0.82,
        "match_reason": "标题描述高度相似；分类相同（生活用品）；地点重叠（图书馆）"
      }
    ]
  }
}
```

---

## 四、图片匹配（可选增强）

### 4.1 方案选择

采用**感知哈希（Perceptual Hash）**方案，无需深度学习，依赖 `imagehash` 库（基于 Pillow）。

核心思路：将图片缩放为 8×8 灰度图，计算 64 位哈希值，两图的哈希汉明距离越小表示越相似。

```
image_sim = 1 - hamming_distance(hash_a, hash_b) / 64
```

### 4.2 集成方式

图片相似度作为附加信息，**不改变主匹配流程**：
- 若双方都有图片，计算最优图片对的 phash 相似度，作为额外参考列在 `match_reason` 中
- 不纳入 `final_score` 公式（避免没有图片的物品匹配分大幅下降）

### 4.3 依赖

```
pip install imagehash
```

### 4.4 实现位置

`backend/utils/match.py` 中增加 `compute_image_similarity(image_path_a, image_path_b)` 函数，在主匹配流程末尾调用，结果追加进 `match_reason`。

---

## 五、接口汇总

### 5.1 搜索接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/search/items` | 关键词搜索，支持筛选和分页 |
| GET | `/api/search/categories` | 获取分类列表（供前端筛选下拉框使用） |

### 5.2 匹配接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/matches/item/<item_id>` | 获取指定物品的匹配结果（自动触发计算） |
| POST | `/api/matches/trigger/<item_id>` | 手动触发匹配计算（需 JWT，只能操作自己的物品） |
| GET | `/api/matches/my` | 获取当前用户所有物品的匹配概览（需 JWT） |

---

## 六、与其他模块的接口约定

本模块**只读 items / item_images / categories / matches / users 表**，写操作仅限 `matches` 表。  
不依赖 auth / claims / notifications 模块的内部逻辑，只依赖以下隐式约定：

- `items` 表中 `user_id` 关联 `users.id`，`users.username` 用于展示发布者信息
- `item_images.item_id` 关联 `items.id`，图片通过 `uploads/items/` 目录访问
- `categories.id` 关联 `items.category_id`，`categories.name` 用于展示分类名称

其他模块发布物品后，可选择性调用 `POST /api/matches/trigger/<item_id>` 触发匹配。

---

## 七、文件结构

```
backend/
├── routes/
│   ├── search.py          # 搜索接口：/api/search/*
│   └── matches.py         # 匹配接口：/api/matches/*
└── utils/
    └── match.py           # 相似度计算核心逻辑

frontend/src/
├── api/
│   ├── search.js          # 封装搜索请求
│   └── matches.js         # 封装匹配请求
├── pages/
│   ├── Search.jsx         # 搜索结果页
│   └── MatchResult.jsx    # 智能匹配结果页
└── components/
    └── SearchBar.jsx      # 搜索栏组件（供 Home 和 Search 页复用）
```

---

## 八、数据库补充（需在 init.sql 中追加）

```sql
-- 为搜索添加 ngram FULLTEXT 索引（MySQL 8.0 支持）
ALTER TABLE items
  ADD FULLTEXT INDEX ft_items_search (title, description, location)
  WITH PARSER ngram;
```

> 注意：`ngram_token_size` 默认为 2（二字母 / 双字节），适合中文搜索。如需修改，需在 MySQL 配置文件中设置 `ngram_token_size=1`。

---

## 九、依赖清单

后端新增依赖（需加入 `requirements.txt`）：

```
jieba
scikit-learn
imagehash        # 仅图片匹配可选
Pillow           # imagehash 依赖
```

---

## 十、实现优先级

| 优先级 | 内容 |
|--------|------|
| P0 | 搜索接口（含 FULLTEXT 索引 + 基础筛选） |
| P0 | 匹配核心算法（text_sim + category + location + time） |
| P0 | GET /api/matches/item/<item_id> |
| P1 | 应用层 TF-IDF 精排（search 精排） |
| P1 | Search.jsx + MatchResult.jsx 前端页面 |
| P1 | SearchBar.jsx 组件 |
| P2 | POST /api/matches/trigger、GET /api/matches/my |
| P2 | match_reason 中文说明生成 |
| P3 | 图片匹配（imagehash） |
