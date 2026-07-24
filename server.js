const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
require('dotenv').config();

const site = require('./data/site');
const articles = require('./data/articles');

const app = express();
const PORT = process.env.PORT || 3001;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'partials/layout');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.locals.site = site;
  res.locals.currentPath = req.path;
  next();
});

app.get('/sitemap.xml', (req, res) => {
  const staticPaths = ['/', '/net-worth', '/about-us', '/contact-us', '/terms-and-conditions', '/privacy-policy'];
  const articlePaths = articles.map(a => `/${a.slug}`);
  const urls = [...staticPaths, ...articlePaths];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${site.baseUrl}${u}</loc></url>`).join('\n')}
</urlset>`;

  res.type('application/xml').send(xml);
});

app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(`User-agent: *
Allow: /

Sitemap: ${site.baseUrl}/sitemap.xml`);
});

app.post('/subscribe', (req, res) => {
  // Newsletter capture placeholder - wire up to an email provider when ready.
  res.redirect('/?subscribed=1');
});

app.get('/', (req, res) => {
  const featured = articles[0];
  const latest = articles.slice(1);
  res.render('pages/home', {
    title: `${site.name} - ${site.tagline}`,
    metaDescription: site.description,
    featured,
    latest,
    subscribed: req.query.subscribed === '1'
  });
});

app.get('/net-worth', (req, res) => {
  res.render('pages/category', {
    title: `Net Worth Articles | ${site.name}`,
    metaDescription: `Browse verified net worth estimates for celebrities and public figures on ${site.name}.`,
    categoryName: 'Net Worth',
    articles
  });
});

app.get('/:slug', (req, res, next) => {
  const staticPages = { 'about-us': 'about', 'contact-us': 'contact', 'terms-and-conditions': 'terms', 'privacy-policy': 'privacy' };
  if (staticPages[req.params.slug]) {
    return res.render(`pages/${staticPages[req.params.slug]}`, {
      title: `${req.params.slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} | ${site.name}`,
      metaDescription: site.description
    });
  }
  const article = articles.find(a => a.slug === req.params.slug);
  if (!article) return next();
  const related = articles.filter(a => a.slug !== article.slug).slice(0, 3);
  const wordCount = article.content.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).length;
  const readMinutes = Math.max(1, Math.round(wordCount / 200));
  res.render('pages/article', {
    title: article.seoTitle || article.title,
    metaDescription: article.metaDescription || article.excerpt,
    article,
    related,
    readMinutes
  });
});

app.use((req, res) => {
  res.status(404).render('pages/404', { title: `Page Not Found | ${site.name}`, metaDescription: '' });
});

app.listen(PORT, () => {
  console.log(`Richlytic site running at http://localhost:${PORT}`);
});
