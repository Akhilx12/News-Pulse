import re
from collections import Counter 

STOP_WORDS = {
    "the", "is", "a", "an", "and", "or", "to", "of", "in", "on", "for",
    "with", "at", "by", "from", "as", "it", "its", "this", "that", "be",
    "are", "was", "were", "has", "have", "had", "will", "would", "could",
    "after", "over", "into", "amid", "says", "said",
}

OVERLAP_THRESHOLD = 3

def extract_keywords(text):
    #lowercase, strip punctuation, remove stop words and short tokens
    words = re.findall(r"[a-z]+", text.lower())
    return set(w for w in words if w not in STOP_WORDS and len(w) > 2)


def keywords_for_article(article):
    #article: dict with 'headline' and 'summary' keys
    text = (article.get("headline") or "") + " " + (article.get("summary") or "")
    return extract_keywords(text)


def label_for_keywords(keyword_sets, article_ids, top_n=3):
    all_words = []
    for aid in article_ids:
        all_words.extend(keyword_sets.get(aid, set()))
    most_common = Counter(all_words).most_common(top_n)
    return " ".join(w for w, _ in most_common) if most_common else "uncategorized"


def cluster_new_articles(new_articles, existing_clusters):
    keyword_sets = {a["id"]: keywords_for_article(a) for a in new_articles}

    #precompute each existing cluster's combined keyword once,
    #rather than recomputing it inside the loop for every new article
    existing_pools = {}
    for cluster_id, members in existing_clusters.items():
        pool_keywords = set()
        for m in members:
            pool_keywords |= keywords_for_article(m)
        existing_pools[cluster_id] = pool_keywords

    assignments_to_existing = {}
    unassigned = []

    #Pass 1= try to match each new article with existing clusters first
    #follow-up news should join old cluster, not make a new one.
    for article in new_articles:
        aid = article["id"]
        best_cluster_id = None
        best_overlap = 0
        for cluster_id, pool_keywords in existing_pools.items():
            overlap = len(keyword_sets[aid] & pool_keywords)
            if overlap > best_overlap:
                best_overlap = overlap
                best_cluster_id = cluster_id

        if best_cluster_id is not None and best_overlap >= OVERLAP_THRESHOLD:
            assignments_to_existing.setdefault(best_cluster_id, []).append(aid)
        else:
            unassigned.append(article)

    #Pass 2= group whatever's left into new clusters among themselves
    #same keyword-overlap logic as before, just scoped to the leftovers
    new_groups = []
    assigned_in_pass2 = set()

    for article in unassigned:
        aid = article["id"]
        if aid in assigned_in_pass2:
            continue

        best_group_idx = None
        best_overlap = 0
        for gi, group_ids in enumerate(new_groups):
            group_keywords = set()
            for gid in group_ids:
                group_keywords |= keyword_sets[gid]
            overlap = len(keyword_sets[aid] & group_keywords)
            if overlap > best_overlap:
                best_overlap = overlap
                best_group_idx = gi

        if best_group_idx is not None and best_overlap >= OVERLAP_THRESHOLD:
            new_groups[best_group_idx].append(aid)
        else:
            new_groups.append([aid])

        assigned_in_pass2.add(aid)

    return assignments_to_existing, new_groups, keyword_sets