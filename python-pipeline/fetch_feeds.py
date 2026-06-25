import feedparser 

FEEDS={
    "BBC" : "http://feeds.bbci.co.uk/news/rss.xml",
    "NPR" : "https://feeds.npr.org/1001/rss.xml",
    "Al Jazeera" : "https://www.aljazeera.com/xml/rss/all.xml",
}

def fetch_raw_entries():
    #Returns a list of dicts: {'source': str, 'raw_entry': feedparser entry}
    all_entries=[]
    for source_name, feed_url in FEEDS.items():
        feed=feedparser.parse(feed_url)
        
        #checking for bozo because feedparser dont raise exceptions on bad feeds but sets bozo=1
        if feed.bozo:
            print(f"[WARN] Feed parsing issue for {source_name}:{feed.bozo_exception}")
        
        for entry in feed.entries:
            all_entries.append({
                "source": source_name,
                "raw_entry": entry,
            })
    return all_entries

if __name__=="__main__":
    entries=fetch_raw_entries()
    print(f"Fetched {len(entries)} total entries")
    for e in entries[:3]:
        print(e["source"],"-",e["raw_entry"].get("title"))