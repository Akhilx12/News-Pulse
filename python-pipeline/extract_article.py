import trafilatura

#fetching and extracting the article from url
#it will return none if the fetching or extracting fails
def extract_full_text(url):
    if not url:
        return None
    
    try:
        downloaded=trafilatura.fetch_url(url)
    except Exception as e:
        print(f"[WARN] Failed to fetch {url}: {e}")
        return None
    
    if downloaded is None:
        print(f"[WARN] No content downloaded for {url}")
        return None
    
    try:
        text=trafilatura.extract(downloaded)
    except Exception as e:
        print(f"[WARN] Failed to extract text from {url} : {e}")
        return None
    
    return text #if trafilatura cant find any article it will return none 

if __name__=="__main__":
    from fetch_feeds import fetch_raw_entries
    from normalize import normalize_entry

    entries=fetch_raw_entries()
    seen_sources=set()

    for item in entries:
        if item["source"] in seen_sources:
            continue
        seen_sources.add(item["source"])
        normalized=normalize_entry(item["source"],item["raw_entry"])
        full_text=extract_full_text(normalized["url"])

        print(f"--- {normalized['source']} ---")
        print("URL:", normalized["url"])
        print("Headline:", normalized["headline"])
        if full_text:
            print("Full text lenght:", len(full_text), "chars")
            print("First 200 chars:", full_text[:200])
        else:
            print("Extraction Failed or No text found")
        print()

        if len(seen_sources)==3:
            break

        
