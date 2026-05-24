import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { PAGE_METADATA, BLOG_ARTICLES } from '../../constants/seo';
import { ArrowRight, BookOpen, Clock, Calendar, ChevronRight } from 'lucide-react';

export default function BlogView() {
  const navigate = useNavigate();
  const meta = PAGE_METADATA['/blog'];

  useEffect(() => {
    if (meta) {
      document.title = meta.title;
      let descMeta = document.querySelector('meta[name="description"]');
      if (!descMeta) {
        descMeta = document.createElement('meta');
        descMeta.setAttribute('name', 'description');
        document.head.appendChild(descMeta);
      }
      descMeta.setAttribute('content', meta.description);
    }
  }, [meta]);

  return (
    <div className="h-screen overflow-y-auto custom-scrollbar bg-[#06061a] text-[#e8eaf6] font-sans relative overflow-x-hidden flex flex-col">
      <Helmet>
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
        <link rel="canonical" href={meta.canonical} />
        <meta property="og:title" content={meta.title} />
        <meta property="og:description" content={meta.description} />
        <meta property="og:url" content={meta.canonical} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://www.autolog.com.ua/logo.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://www.autolog.com.ua/logo.png" />
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "AutoLog Блог",
              "url": "${meta.canonical}"
            }
          `}
        </script>
      </Helmet>

      {/* Decorative Blob Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-radial from-[#5c3efe]/20 to-transparent blur-[80px] pointer-events-none z-0" />
      <div className="absolute bottom-[20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-radial from-[#7c5cff]/15 to-transparent blur-[80px] pointer-events-none z-0" />

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
            <Link to="/" className="text-sm font-semibold text-gray-350 hover:text-white transition-colors no-underline">
              Головна
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

      {/* Hero Section */}
      <section className="relative z-10 py-16 px-6 border-b border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider text-[#7C5CFF] bg-[#5C3EFE]/12 border border-[#5C3EFE]/20">
            Наш Блог
          </span>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mt-6 mb-4 text-white">
            {meta.h1}
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Поради з експлуатації, аналіз вартості обслуговування авто в Україні, детальні інструкції та експертні гайди для розумних водіїв.
          </p>
        </div>
      </section>

      {/* Articles Grid Section */}
      <main className="relative z-10 flex-1 py-16 px-6 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {BLOG_ARTICLES.map((article) => (
            <article
              key={article.slug}
              className="group relative flex flex-col rounded-3xl p-6 bg-white/[0.03] border border-white/8 backdrop-blur-md shadow-2xl hover:border-[#5C3EFE]/45 hover:bg-white/[0.04] transition-all duration-300"
            >
              {/* Decorative top-right glow */}
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-radial from-[#5c3efe]/5 to-transparent blur-md opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/25">
                  {article.category}
                </span>
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Calendar size={13} />
                  <span>{article.date}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-400 ml-auto">
                  <Clock size={13} />
                  <span>{article.readTime}</span>
                </div>
              </div>

              <h2 className="text-xl font-bold text-white mb-3 group-hover:text-[#7C5CFF] transition-colors leading-snug">
                <Link to={`/blog/${article.slug}`} className="no-underline text-inherit">
                  {article.title}
                </Link>
              </h2>

              <p className="text-sm text-gray-400 leading-relaxed mb-6 flex-1">
                {article.summary}
              </p>

              <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{article.emoji}</span>
                  <span className="text-xs font-semibold text-gray-400">AutoLog Академія</span>
                </div>
                <Link
                  to={`/blog/${article.slug}`}
                  className="flex items-center gap-1 text-xs font-black uppercase tracking-widest text-[#7C5CFF] group-hover:text-white transition-colors no-underline"
                >
                  Читати
                  <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </main>

      {/* CTA Footer Banner */}
      <section className="relative z-10 py-16 px-6 bg-gradient-to-b from-transparent to-[#0a0525] border-t border-white/5 mt-auto">
        <div className="max-w-3xl mx-auto text-center bg-white/[0.02] border border-white/8 backdrop-blur-md rounded-[32px] p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#5c3efe]/8 to-[#7c5cff]/8 pointer-events-none" />
          <h3 className="text-2xl sm:text-3xl font-black text-white mb-4">
            Втомилися від паперових записів?
          </h3>
          <p className="text-sm sm:text-base text-gray-400 max-w-lg mx-auto leading-relaxed mb-8">
            Зареєструйтеся в AutoLog безкоштовно та почніть вести сервісну книжку автомобіля онлайн прямо зараз.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3.5 text-sm font-black uppercase tracking-wider text-white rounded-xl bg-gradient-to-r from-[#5c3efe] to-[#7c5cff] border-0 cursor-pointer shadow-lg shadow-[#5c3efe]/35 hover:shadow-xl hover:shadow-[#5c3efe]/50 hover:-translate-y-[1px] active:translate-y-0 transition-all inline-flex items-center gap-2"
          >
            Створити безкоштовний кабінет
            <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* Main Footer Info */}
      <footer className="relative z-10 py-8 px-6 text-center border-t border-white/5 bg-[#050512]">
        <p className="text-xs text-gray-500">
          © {new Date().getFullYear()} AutoLog. Усі права захищено. Зроблено з любов’ю для водіїв України.
        </p>
      </footer>
    </div>
  );
}
