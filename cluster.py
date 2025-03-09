import newspaper3k as n3k
import concurrent.futures
import os
import json
import uuid
import logging
from datetime import datetime
from collections import defaultdict
from dotenv import load_dotenv
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from textblob import TextBlob
import textstat

load_dotenv()
logging.basicConfig(level=logging.INFO)

class UnionFind:
    def __init__(self, articles):
        self.root = {article["id"]: article["id"] for article in articles}

    def find(self, x):
        if x != self.root[x]:
            self.root[x] = self.find(self.root[x])
        return self.root[x]

    def union(self, x, y):
        rootX, rootY = self.find(x), self.find(y)
        if rootX != rootY:
            self.root[rootY] = rootX

def scrape_websites():
    with open("websites.txt", "r") as f:
        websites = [line.strip() for line in f if line.strip()]
    articles = []
    with concurrent.futures.ThreadPoolExecutor() as executor:
        futures = {executor.submit(scrape_website, website): website for website in websites}
        for future in concurrent.futures.as_completed(futures):
            result = future.result()
            if result:
                articles.extend(result)
    return articles

def scrape_website(website):
    try:
        site = n3k.build(website, language="en", memoize_articles=False)
        return [article_url for article_url in site.article_urls()]
    except Exception as e:
        logging.error(f"Error scraping website {website}: {e}")
        return []

def format_article(url):
    try:
        article = n3k.Article(url, language="en")
        article.download()
        article.parse()
        article.nlp()
        return {
            "id": str(uuid.uuid4()),
            "text": article.text,
            "title": article.title,
            "authors": article.authors,
            "publish_date": article.publish_date or datetime.now().isoformat(),
            "top_image": article.top_image,
            "keywords": article.keywords,
            "summary": article.summary,
            "url": url
        }
    except Exception as e:
        logging.warning(f"Failed to process article {url}: {e}")
        return None

def process_articles(articles):
    processed = [article for article in articles if article and article.get("text") and len(article["text"]) > 250 and " ad " not in article["text"].lower()]
    logging.info(f"Processed {len(articles)} articles; usable: {len(processed)}")
    return processed

def cluster_articles(articles, similarity_threshold=0.5):
    if not articles:
        return {}
    texts = [article["text"] for article in articles]
    vectorizer = TfidfVectorizer(stop_words="english")
    tfidf_matrix = vectorizer.fit_transform(texts)
    sim_matrix = cosine_similarity(tfidf_matrix)
    
    uf = UnionFind(articles)
    n = len(articles)
    for i in range(n):
        for j in range(i + 1, n):
            if sim_matrix[i, j] >= similarity_threshold:
                uf.union(articles[i]["id"], articles[j]["id"])
                
    clusters = defaultdict(list)
    for article in articles:
        clusters[uf.find(article["id"])].append(article)
    return clusters

def calculate_fact_density(text):
    sentences = text.split('.')
    if not sentences:
        return 0
    fact_sentences = sum(1 for sentence in sentences if any(char.isdigit() for char in sentence))
    return round((fact_sentences / len(sentences)) * 100, 2)

def calculate_bias_content(text):
    polarity = abs(TextBlob(text).sentiment.polarity)
    return round(polarity * 100, 2)

def calculate_emotional_calories(text):
    subjectivity = TextBlob(text).sentiment.subjectivity
    return round(subjectivity * 100, 2)

def calculate_perspective_vitamins(text):
    blob = TextBlob(text)
    unique_noun_phrases = set(blob.noun_phrases)
    return round(min(len(unique_noun_phrases) / 10 * 100, 100), 2)

def calculate_complexity_index(text):
    try:
        score = textstat.flesch_reading_ease(text)
        complexity = round(100 - score, 2) if score <= 100 else 0
        return complexity
    except Exception as e:
        logging.error(f"Error calculating complexity index: {e}")
        return 0

def calculate_source_minerals(url):
    url_lower = url.lower()
    if "nytimes" in url_lower:
        return 95
    if "bbc" in url_lower:
        return 90
    if "cnn" in url_lower:
        return 80
    return 70

def analyze_article(article):
    text = article["text"]
    return {
        "fact_density": calculate_fact_density(text),
        "bias_content": calculate_bias_content(text),
        "emotional_calories": calculate_emotional_calories(text),
        "perspective_vitamins": calculate_perspective_vitamins(text),
        "complexity_index": calculate_complexity_index(text),
        "source_minerals": calculate_source_minerals(article["url"]),
        "title": article["title"],
        "url": article["url"]
    }

def main():
    logging.info("Starting to scrape websites.")
    article_urls = scrape_websites()
    logging.info(f"Found {len(article_urls)} article URLs.")
    
    with concurrent.futures.ThreadPoolExecutor() as executor:
        articles = list(filter(None, executor.map(format_article, article_urls)))
        
    logging.info(f"Formatted {len(articles)} articles.")
    articles = process_articles(articles)
    
    clusters = cluster_articles(articles, similarity_threshold=0.5)
    logging.info(f"Found {len(clusters)} clusters.")
    
    # For each cluster, compute average metrics
    for cluster_id, cluster_articles in clusters.items():
        logging.info(f"Cluster {cluster_id} contains {len(cluster_articles)} articles.")
