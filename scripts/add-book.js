const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const url = args[0];

if (!url) {
  console.error("Please provide a URL. Example: node scripts/add-book.js 'https://example.com/story'");
  process.exit(1);
}

async function addBook(url) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    let title = await page.title();
    // basic cleanup of title
    title = title.split('|')[0].trim();

    // Extract a short excerpt (first paragraph) for the review field
    const review = await page.evaluate(() => {
      const p = document.querySelector('p');
      return p ? p.innerText.substring(0, 150) + '...' : 'Great read.';
    });

    // Try to extract an og:image for the cover
    const coverImageUrl = await page.evaluate(() => {
      const metaImage = document.querySelector('meta[property="og:image"]') || document.querySelector('meta[name="twitter:image"]');
      return metaImage ? metaImage.content : '';
    });

    const newBook = {
      title: title,
      author: "Unknown Author", // Can be manually updated later
      genre: "Short Story / Web Fiction",
      rating: "Unrated",
      review: review,
      coverImageUrl: coverImageUrl,
      externalLink: url,
      dateCompleted: new Date().toISOString().split('T')[0]
    };

    const filePath = path.join(__dirname, '../src/data/books.json');
    let books = [];
    if (fs.existsSync(filePath)) {
      const fileData = fs.readFileSync(filePath, 'utf8');
      if (fileData) {
        books = JSON.parse(fileData);
      }
    }

    books.push(newBook);
    fs.writeFileSync(filePath, JSON.stringify(books, null, 2), 'utf8');

    console.log(`Successfully added "${newBook.title}" to src/data/books.json!`);
  } catch (error) {
    console.error("Error scraping the URL:", error);
  } finally {
    await browser.close();
  }
}

addBook(url);
