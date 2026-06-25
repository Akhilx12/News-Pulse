import os
import psycopg2
from psycopg2 import pool
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ["DATABASE_URL"]
connection_pool = psycopg2.pool.SimpleConnectionPool(
    1, 5, DATABASE_URL
)


def get_conn():
    return connection_pool.getconn()


def put_conn(conn):
    connection_pool.putconn(conn)


#ingestion funcs

def article_exists(url):
    #return true if article is already stored with the same url
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT 1 FROM articles WHERE url = %s", (url,))
    result = cur.fetchone()
    cur.close()
    put_conn(conn)
    return result is not None


def insert_article(data):
    #data is a dict with keys: url,source,headine,summary,full_text,published_at
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO articles (url, source, headline, summary, full_text, published_at)
        VALUES (%s, %s, %s, %s, %s, %s)
        ON CONFLICT (url) DO NOTHING
        RETURNING id
        """,
        (
            data["url"],
            data["source"],
            data["headline"],
            data["summary"],
            data.get("full_text"),
            data.get("published_at"),
        ),
    )
    row = cur.fetchone()
    conn.commit()
    cur.close()
    put_conn(conn)
    return row[0] if row else None


#clusterin funcs

def get_unclustered_articles():
    #return articles that are not in a cluster yet as list of dicts
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "SELECT id, headline, summary FROM articles WHERE cluster_id IS NULL"
    )
    rows = cur.fetchall()
    cur.close()
    put_conn(conn)
    return [{"id": r[0], "headline": r[1], "summary": r[2]} for r in rows]


def get_articles_by_cluster():
    #return existing clusters
    #new articles will be compared with existing cluster keyword rather than each other to avoid making new cluster and just add them to old one
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT cluster_id, id, headline, summary
        FROM articles
        WHERE cluster_id IS NOT NULL
        """
    )
    rows = cur.fetchall()
    cur.close()
    put_conn(conn)

    result = {}
    for cluster_id, article_id, headline, summary in rows:
        result.setdefault(cluster_id, []).append({
            "id": article_id,
            "headline": headline,
            "summary": summary,
        })
    return result


def create_cluster(label):
    #create a new cluster and return its id
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO clusters (label) VALUES (%s) RETURNING id",
        (label,),
    )
    cluster_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    put_conn(conn)
    return cluster_id


def update_cluster_label(cluster_id, label):
    #update existing cluster's label
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "UPDATE clusters SET label = %s WHERE id = %s",
        (label, cluster_id),
    )
    conn.commit()
    cur.close()
    put_conn(conn)


def assign_articles_to_cluster(article_ids, cluster_id):
    #assign multiple articles to a cluster
    if not article_ids:
        return
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "UPDATE articles SET cluster_id = %s WHERE id = ANY(%s)",
        (cluster_id, article_ids),
    )
    conn.commit()
    cur.close()
    put_conn(conn)


#func for api layer to get clusters with article counts and timestamps

def get_clusters():
    #return all clusters with id,label,article count, earliest & latest article with time
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT
            c.id,
            c.label,
            COUNT(a.id) AS article_count,
            MIN(a.published_at) AS earliest,
            MAX(a.published_at) AS latest
        FROM clusters c
        JOIN articles a ON a.cluster_id = c.id
        GROUP BY c.id, c.label
        ORDER BY latest DESC
        """
    )
    rows = cur.fetchall()
    cur.close()
    put_conn(conn)
    return [
        {
            "id": r[0],
            "label": r[1],
            "article_count": r[2],
            "earliest": r[3],
            "latest": r[4],
        }
        for r in rows
    ]


if __name__ == "__main__":
    print("Unclustered articles:", len(get_unclustered_articles()))
    print("Existing clusters:", get_clusters())
    #test run