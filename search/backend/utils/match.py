import jieba
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from datetime import datetime


def tokenize(text):
    if not text:
        return ""
    return " ".join(jieba.cut(str(text).strip()))


def compute_batch_text_similarity(query_text, candidate_texts):
    """Batch TF-IDF cosine similarity: query vs each candidate."""
    if not query_text or not candidate_texts:
        return [0.0] * len(candidate_texts)

    all_segs = [tokenize(query_text)] + [tokenize(t) for t in candidate_texts]

    if all(not s.strip() for s in all_segs):
        return [0.0] * len(candidate_texts)

    try:
        vectorizer = TfidfVectorizer(
            tokenizer=lambda t: t.split(),
            lowercase=False,
            token_pattern=None,
            min_df=1,
        )
        tfidf = vectorizer.fit_transform(all_segs)
        scores = cosine_similarity(tfidf[0:1], tfidf[1:])[0]
        return [float(s) for s in scores]
    except Exception:
        return [0.0] * len(candidate_texts)


def _category_score(cat_a, cat_b):
    return 1.0 if (cat_a and cat_b and cat_a == cat_b) else 0.0


def _location_score(loc_a, loc_b):
    if not loc_a or not loc_b:
        return 0.0
    ca = set(loc_a.replace(" ", ""))
    cb = set(loc_b.replace(" ", ""))
    if not ca or not cb:
        return 0.0
    return len(ca & cb) / max(len(ca), len(cb))


def _time_score(t_a, t_b):
    if not t_a or not t_b:
        return 0.0
    fmt = "%Y-%m-%d %H:%M:%S"
    if isinstance(t_a, str):
        try:
            t_a = datetime.strptime(t_a, fmt)
        except ValueError:
            return 0.0
    if isinstance(t_b, str):
        try:
            t_b = datetime.strptime(t_b, fmt)
        except ValueError:
            return 0.0
    return max(0.0, 1.0 - abs((t_a - t_b).days) / 30.0)


def _build_reason(ts, cs, ls, ws, cat_name=None, loc_a=None):
    parts = []
    if ts >= 0.5:
        parts.append("标题描述高度相似")
    elif ts >= 0.15:
        parts.append("标题描述部分相似")
    if cs == 1.0:
        parts.append(f"分类相同（{cat_name}）" if cat_name else "分类相同")
    if ls >= 0.5:
        parts.append(f"地点高度重叠（{loc_a}）" if loc_a else "地点高度重叠")
    elif ls > 0:
        parts.append("地点部分重叠")
    if ws >= 0.8:
        parts.append("时间非常接近")
    elif ws >= 0.5:
        parts.append("时间较接近")
    return "；".join(parts) if parts else "基本信息相关"


def run_matching(target_item_id, conn, top_n=5):
    """
    Compute top-N matches for target_item_id against opposite-type items.
    Writes results to matches table and returns them.
    """
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT i.*, c.name AS category_name
            FROM items i LEFT JOIN categories c ON i.category_id = c.id
            WHERE i.id = %s
        """, (target_item_id,))
        target = cursor.fetchone()
        if not target:
            return []

        opposite = 'found' if target['type'] == 'lost' else 'lost'

        cursor.execute("""
            SELECT i.*, c.name AS category_name
            FROM items i LEFT JOIN categories c ON i.category_id = c.id
            WHERE i.type = %s AND i.status IN ('open', 'matching') AND i.id != %s
        """, (opposite, target_item_id))
        candidates = cursor.fetchall()
        if not candidates:
            return []

        target_text = (target['title'] or '') + ' ' + (target['description'] or '')
        cand_texts = [(c['title'] or '') + ' ' + (c['description'] or '') for c in candidates]
        text_sims = compute_batch_text_similarity(target_text, cand_texts)

        scored = []
        for i, cand in enumerate(candidates):
            ts = text_sims[i]
            cs = _category_score(target.get('category_id'), cand.get('category_id'))
            ls = _location_score(target.get('location'), cand.get('location'))
            ws = _time_score(target.get('event_time'), cand.get('event_time'))
            score = round(0.6 * ts + 0.2 * cs + 0.1 * ls + 0.1 * ws, 4)
            reason = _build_reason(ts, cs, ls, ws,
                                   cat_name=target.get('category_name'),
                                   loc_a=target.get('location'))
            scored.append({'cand': cand, 'score': score, 'reason': reason})

        scored.sort(key=lambda x: x['score'], reverse=True)
        top = [s for s in scored if s['score'] > 0.05][:top_n]

        if target['type'] == 'lost':
            cursor.execute("DELETE FROM matches WHERE lost_item_id = %s", (target_item_id,))
        else:
            cursor.execute("DELETE FROM matches WHERE found_item_id = %s", (target_item_id,))

        for s in top:
            cand = s['cand']
            lost_id = target_item_id if target['type'] == 'lost' else cand['id']
            found_id = cand['id'] if target['type'] == 'lost' else target_item_id
            cursor.execute("""
                INSERT INTO matches (lost_item_id, found_item_id, similarity_score, match_reason)
                VALUES (%s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    similarity_score = VALUES(similarity_score),
                    match_reason = VALUES(match_reason)
            """, (lost_id, found_id, s['score'], s['reason']))

        conn.commit()
        return top

    finally:
        cursor.close()
