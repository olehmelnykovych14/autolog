import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { BLOG_ARTICLES, BASE_URL } from '../../constants/seo';
import { ArrowLeft, BookOpen, Clock, Calendar, ChevronRight, Check } from 'lucide-react';

export default function ArticleView() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const article = BLOG_ARTICLES.find(a => a.slug === slug);

  useEffect(() => {
    if (article) {
      document.title = article.title;
      let descMeta = document.querySelector('meta[name="description"]');
      if (!descMeta) {
        descMeta = document.createElement('meta');
        descMeta.setAttribute('name', 'description');
        document.head.appendChild(descMeta);
      }
      descMeta.setAttribute('content', article.description);
    }
  }, [article]);

  if (!article) {
    return (
      <div className="min-h-screen bg-[#06061a] text-[#e8eaf6] font-sans flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-3xl font-black mb-4">Статтю не знайдено</h1>
        <p className="text-gray-400 mb-8 max-w-sm">На жаль, такий матеріал відсутній або був переміщений.</p>
        <Link
          to="/blog"
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#5c3efe] to-[#7c5cff] text-white font-bold no-underline inline-flex items-center gap-2 hover:shadow-lg hover:shadow-[#5c3efe]/25"
        >
          <ArrowLeft size={16} />
          Повернутися до Блогу
        </Link>
      </div>
    );
  }

  const canonicalUrl = `${BASE_URL}/blog/${article.slug}`;

  const getIsoDate = (s) => {
    if (s === 'rozhid-palyva-yak-rahuvaty') return '2026-08-27';
    if (s === 'osago-tehoglyad-terminy') return '2026-08-25';
    if (s === 'yak-prodaty-avto-dorozhche') return '2026-08-22';
    if (s === 'serwisna-knyzhka-avtomobilya') return '2026-05-15';
    if (s === 'vytraty-na-avto-ukraina') return '2026-05-10';
    if (s === 'koly-minyaty-maslo') return '2026-05-05';
    if (s === 'perevirka-avto-pry-kupivli') return '2026-05-01';
    return '2026-05-21';
  };
  const isoDate = getIsoDate(article.slug);

  return (
    <div className="h-screen overflow-y-auto custom-scrollbar bg-[#06061a] text-[#e8eaf6] font-sans relative overflow-x-hidden flex flex-col">
      {/* Dynamic SEO Tags */}
      <Helmet>
        <title>{article.title}</title>
        <meta name="description" content={article.description} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={article.description} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="article" />
        <meta property="article:published_time" content={isoDate} />
        <meta property="og:image" content="https://www.autolog.com.ua/logo.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://www.autolog.com.ua/logo.png" />
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "BlogPosting",
              "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": "${canonicalUrl}"
              },
              "headline": "${article.title.replace(/"/g, '\\"')}",
              "description": "${article.description.replace(/"/g, '\\"')}",
              "image": "https://www.autolog.com.ua/logo.png",
              "datePublished": "${isoDate}",
              "author": {
                "@type": "Organization",
                "name": "AutoLog"
              },
              "publisher": {
                "@type": "Organization",
                "name": "AutoLog",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://www.autolog.com.ua/logo.png"
                }
              }
            }
          `}
        </script>
      </Helmet>

      {/* Decorative Blur Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-radial from-[#5c3efe]/15 to-transparent blur-[80px] pointer-events-none z-0" />
      <div className="absolute bottom-[20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-radial from-[#7c5cff]/10 to-transparent blur-[80px] pointer-events-none z-0" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-[#06061a]/85 backdrop-blur-md border-b border-white/8">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 no-underline text-white font-bold text-xl">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#5C3EFE] to-[#7C5CFF] flex items-center justify-center shadow-lg shadow-[#5c3efe]/30">
              <img src="/logo.svg" alt="Logo" className="w-5.5 h-5.5 object-contain" />
            </div>
            <span>AutoLog</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/blog" className="text-sm font-semibold text-gray-350 hover:text-white transition-colors no-underline">
              Блог
            </Link>
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 text-xs font-black uppercase tracking-widest text-white rounded-xl bg-gradient-to-r from-[#5c3efe] to-[#7c5cff] border-0 cursor-pointer hover:shadow-lg hover:shadow-[#5c3efe]/25 hover:-translate-y-[1px] active:translate-y-0 transition-all"
            >
              Увійти
            </button>
          </div>
        </div>
      </header>

      {/* Breadcrumbs Navigation */}
      <nav className="relative z-10 max-w-4xl mx-auto w-full px-6 pt-10">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Link to="/" className="hover:text-white transition-colors no-underline">Головна</Link>
          <ChevronRight size={12} />
          <Link to="/blog" className="hover:text-white transition-colors no-underline">Блог</Link>
          <ChevronRight size={12} />
          <span className="text-gray-250 truncate">{article.title}</span>
        </div>
      </nav>

      {/* Main Article Section */}
      <main className="relative z-10 flex-1 max-w-4xl mx-auto w-full px-6 py-12">
        <article className="bg-white/[0.02] border border-white/8 backdrop-blur-md rounded-[32px] p-6 sm:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[6px] bg-gradient-to-r from-[#5c3efe] to-[#7c5cff]" />

          {/* Article Header info */}
          <header className="mb-10 pb-8 border-b border-white/8">
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/25">
                {article.category}
              </span>
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Calendar size={13} />
                <span>{article.date}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Clock size={13} />
                <span>Час читання: {article.readTime}</span>
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4">
              {article.h1}
            </h1>
            <p className="text-base sm:text-lg text-gray-350 leading-relaxed italic">
              {article.summary}
            </p>
          </header>

          {/* Render Rich Content Blocks */}
          <div className="space-y-6 text-gray-300 leading-relaxed text-[15px] sm:text-[16px]">
            {article.content.map((block, index) => {
              if (block.type === 'intro') {
                return (
                  <p key={index} className="text-lg text-white font-medium mb-6 leading-relaxed">
                    {block.text}
                  </p>
                );
              }
              if (block.type === 'heading') {
                return (
                  <h2 key={index} className="text-xl sm:text-2xl font-bold text-white mt-10 mb-4 flex items-center gap-3">
                    <span className="w-1.5 h-6 bg-[#5C3EFE] rounded-full inline-block" />
                    {block.text}
                  </h2>
                );
              }
              if (block.type === 'text') {
                return (
                  <p key={index} className="mb-4 whitespace-pre-line text-gray-300">
                    {block.text}
                  </p>
                );
              }
              if (block.type === 'quote') {
                return (
                  <blockquote
                    key={index}
                    className="p-6 my-8 rounded-2xl bg-white/[0.01] border-l-4 border-[#5C3EFE] backdrop-blur-sm"
                  >
                    <p className="text-white italic mb-3 font-medium">“{block.text}”</p>
                    {block.author && (
                      <cite className="text-xs font-black uppercase tracking-wider text-[#7C5CFF] block not-italic">
                        — {block.author}
                      </cite>
                    )}
                  </blockquote>
                );
              }
              if (block.type === 'list') {
                return (
                  <ul key={index} className="space-y-3 my-6 pl-1">
                    {block.items.map((item, idx) => (
                      <li key={idx} className="flex gap-3 text-gray-300">
                        <div className="w-5 h-5 rounded-full bg-[#10B981]/15 text-[#10B981] flex items-center justify-center flex-shrink-0 mt-0.5 border border-[#10B981]/20">
                          <Check size={12} strokeWidth={3} />
                        </div>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                );
              }
              return null;
            })}
          </div>

          {/* Quick Registration Widget inside the article */}
          <div className="mt-12 p-6 sm:p-8 rounded-3xl bg-white/[0.02] border border-white/8 relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 shadow-xl">
            <div className="absolute inset-0 bg-[#5c3efe]/5 pointer-events-none" />
            <div>
              <h4 className="text-lg font-black text-white mb-2">Облік авто безкоштовно</h4>
              <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
                Створіть свій цифровий гараж за 30 секунд. Своєчасний облік ТО економить тисячі гривень.
              </p>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="px-5 py-3 text-xs font-black uppercase tracking-widest text-white rounded-xl bg-gradient-to-r from-[#5c3efe] to-[#7c5cff] border-0 cursor-pointer shadow-md shadow-[#5c3efe]/25 hover:shadow-lg hover:shadow-[#5c3efe]/35 active:-translate-y-0 hover:-translate-y-[1px] transition-all whitespace-nowrap"
            >
              Спробувати AutoLog →
            </button>
          </div>
        </article>

        {/* Article Navigation Footer */}
        <div className="mt-8 flex justify-center">
          <Link
            to="/blog"
            className="px-5 py-3 rounded-xl bg-white/[0.03] border border-white/8 text-xs font-black uppercase tracking-widest text-white no-underline inline-flex items-center gap-2 hover:bg-white/[0.05] transition-all"
          >
            <ArrowLeft size={14} />
            Повернутися до Блогу
          </Link>
        </div>
      </main>

      {/* Main Footer Info */}
      <footer className="relative z-10 py-8 px-6 text-center border-t border-white/5 bg-[#050512]">
        <p className="text-xs text-gray-500">
          © {new Date().getFullYear()} AutoLog. Усі права захищено. Зроблено з любов’ю для водіїв України.
        </p>
      </footer>
    </div>
  );
}
