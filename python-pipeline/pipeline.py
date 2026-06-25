from fetch_feeds import fetch_raw_entries
from normalize import normalize_entry
from extract_article import extract_full_text
from cluster import cluster_new_articles, label_for_keywords
import db

def run_ingestion():
    #fetches all feeds, normalizes entries, extracts full text
    #and inserts unique articles into the database also it returns the count of newly inserted articles

    raw_entries = fetch_raw_entries()
    new_count = 0

    for item in raw_entries:
        normalized = normalize_entry(item["source"], item["raw_entry"])

        if not normalized["url"]:
            print("[SKIP] Entry with no URL, cannot store")
            continue

        if db.article_exists(normalized["url"]):
            continue #already in the database so skip it

        normalized["full_text"] = extract_full_text(normalized["url"])

        inserted_id = db.insert_article(normalized)
        if inserted_id is not None:
            new_count += 1
        #if inserted_id is None dont count it as new

    print(f"[INGEST] Inserted {new_count} new articles")
    return new_count

def run_clustering():
    
    #clusters all currently unclustered articles checking with
    #existing clusters first so follow up news join the right group instead of always starting a new one

    new_articles = db.get_unclustered_articles()
    if not new_articles:
        print("[CLUSTER] No unclustered articles to process")
        return

    existing_clusters = db.get_articles_by_cluster()

    assignments_to_existing, new_groups, keyword_sets = cluster_new_articles(
        new_articles, existing_clusters
    )

    #case 1= articles that matched an existing cluster
    for cluster_id, article_ids in assignments_to_existing.items():
        db.assign_articles_to_cluster(article_ids, cluster_id)
        print(f"[CLUSTER] Added {len(article_ids)} article(s) to existing cluster {cluster_id}")

    #case 2= leftover articles formed into brand new clusters
    for group_ids in new_groups:
        label = label_for_keywords(keyword_sets, group_ids)
        cluster_id = db.create_cluster(label)
        db.assign_articles_to_cluster(group_ids, cluster_id)
        print(f"[CLUSTER] Created new cluster '{label}' (id={cluster_id}) with {len(group_ids)} article(s)")

def run_pipeline():
    print("=== News Pulse Pipeline: starting ===")
    run_ingestion()
    run_clustering()
    print("=== News Pulse Pipeline: done ===")


if __name__ == "__main__":
    run_pipeline()