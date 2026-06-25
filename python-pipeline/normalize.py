from dateutil import parser as date_parser 
from urllib.parse import urlparse, urlunparse

# stripped query parameters from urls before deduplication
# since tracking params would otherwise cause the same article to be treated as unique
def clean_url(raw_url):
    if not raw_url:
        return raw_url
    parsed=urlparse(raw_url)
    return urlunparse(parsed._replace(query="",fragment=""))


def normalize_entry(source, raw_entry):
    headline = raw_entry.get("title", "").strip()

    #because different feeds put the summary in different fields
    summary=(
        raw_entry.get("summary")
        or raw_entry.get("description")
        or ""
    )
    summary=summary.strip()
    url=clean_url(raw_entry.get("link"))

    #because different feeds put the published date in different fields
    pub_date_raw=raw_entry.get("published") or raw_entry.get("pubDate")
    published_at=None
    if pub_date_raw:
        try:
            published_at=date_parser.parse(pub_date_raw)  #date_parser.parse() to handle diff date formats
        except(ValueError, TypeError):
            published_at=None #so that it doesnt crash over one bad date
    
    return{
        "source": source,
        "headline": headline,
        "summary": summary,
        "url": url,
        "published_at": published_at,
    }

if __name__=="__main__":
    from fetch_feeds import fetch_raw_entries
    entries=fetch_raw_entries()
    seen_sources=set()
    for item in entries:
        if item["source"] in seen_sources:
            continue
        seen_sources.add(item["source"])
        normalized=normalize_entry(item["source"],item["raw_entry"])
        print(normalized)
        if len(seen_sources) == 3:
            break
