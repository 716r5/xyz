import newspaper3k as n3k
import concurrent.futures
import os
import uuid
import logging
import datetime
from dotenv import load_dotenv
import textstat
from textblob import TextBlob

logging.basicConfig(level=logging.INFO)
load_dotenv()

class NewsNutritionAnalyzer:
    def __init__(self):
        pass

    def scrape_websites(self, websites):
        articles = []
        with concurrent.futures.ThreadPoolExecutor() as executor:
            futures = {executor.submit(self._scrape_website, website): website for website in websites}
            for future in concurrent.futures.as_completed(futures):
                website = futures[future]
                try:
                    articles.extend(future.result())
                    logging.info(f"Scraped articles from {website}")
                except Exception as e:
                    logging.error(f"Error scraping {website}: {e}")
        return articles

    def _scrape_website(self, website):
        try:
            site = n3k.build(website, language="en", memoize_articles=False)
            return [article_url for article_url in site.article_urls()]
        except Exception as e:
            logging.error(f"Error building website {website}: {e}")
            return []

    def format_article(self, url):
        try:
            article = n3k.Article(url, language="en")
            article.download()
            article.parse()
            article.nlp()
            return {"id": str(uuid.uuid4()), "article": article, "url": url}
        except Exception as e:
            logging.warning(f"Failed to format article from {url}: {e}")
            return None

    def analyze_article(self, article_data):
        article = article_data["article"]
        text = article.text
        analysis = {
            "fact_density": self.calculate_fact_density(text),
            "bias_content": self.calculate_bias_content(text),
            "emotional_calories": self.calculate_emotional_calories(text),
            "perspective_vitamins": self.calculate_perspective_vitamins(text),
            "complexity_index": self.calculate_complexity_index(text),
            "source_minerals": self.calculate_source_minerals(article_data["url"]),
            "title": article.title,
            "url": article_data["url"]
        }
        return analysis

    def calculate_fact_density(self, text):
        sentences = text.split('.')
        if not sentences:
            return 0
        fact_sentences = sum(1 for sentence in sentences if any(char.isdigit() for char in sentence))
        return round((fact_sentences / len(sentences)) * 100, 2)

    def calculate_bias_content(self, text):
        polarity = abs(TextBlob(text).sentiment.polarity)
        return round(polarity * 100, 2)

    def calculate_emotional_calories(self, text):
        subjectivity = TextBlob(text).sentiment.subjectivity
        return round(subjectivity * 100, 2)

    def calculate_perspective_vitamins(self, text):
        blob = TextBlob(text)
        unique_noun_phrases = set(blob.noun_phrases)
        value = min(len(unique_noun_phrases) / 10 * 100, 100)
        return round(value, 2)

    def calculate_complexity_index(self, text):
        try:
            score = textstat.flesch_reading_ease(text)
            complexity = round(100 - score, 2) if score <= 100 else 0
            return complexity
        except Exception as e:
            logging.error(f"Error calculating complexity index: {e}")
            return 0

    def calculate_source_minerals(self, url):
        url_lower = url.lower()
        if "nytimes" in url_lower:
            return 95
        if "bbc" in url_lower:
            return 90
        if "cnn" in url_lower:
            return 80
        return 70

    def main(self):
        with open("websites.txt", "r") as f:
            websites = [line.strip() for line in f if line.strip()]
        all_articles = self.scrape_websites(websites)
        logging.info(f"Found {len(all_articles)} article URLs")
        with concurrent.futures.ThreadPoolExecutor() as executor:
            formatted_articles = [r for r in executor.map(self.format_article, all_articles) if r is not None]
        logging.info(f"Formatted {len(formatted_articles)} articles")
        analyses = []
        for article_data in formatted_articles:
            analysis = self.analyze_article(article_data)
            analyses.append(analysis)
            logging.info(f"Analysis for {analysis['title']}: {analysis}")
        return analyses

if __name__ == "__main__":
    analyzer = NewsNutritionAnalyzer()
    results = analyzer.main()
    for res in results:
        print(res)
