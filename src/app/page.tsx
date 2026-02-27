import { resumeData } from "@/data/resume";
import { GlassCard } from "@/components/GlassCard";
import { HeroAvatarCanvas } from "@/components/Three/HeroAvatar";
import Scene from "@/components/Three/Scene";

export default function Home() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: resumeData.title,
    jobTitle: 'Software Engineer',
    url: 'https://ajay-dharmaraj.vercel.app',
    sameAs: [
      resumeData.contact.links.linkedin,
      resumeData.contact.links.github,
    ]
  };

  return (
    <div className="relative">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Scene />
      
      {/* Scrollable Content Container */}
      <div className="relative container mx-auto px-4 sm:px-6 md:px-12 pb-24 ">
        
        {/* Page 1: Hero */}
        <section className="w-full flex flex-col md:flex-row items-center justify-between relative mb-24 md:mb-40">
          
          {/* Text Content - Left Side */}
          <div className="w-full md:w-3/4 flex flex-col items-start justify-center pt-8 md:pt-16 h-full">
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-9xl font-black tracking-tighter mb-4 uppercase leading-none drop-shadow-md text-center md:text-left w-full">
              {resumeData.title.split(" ")[0]}<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-500 dark:from-white dark:to-gray-500 break-words">
                {resumeData.title.split(" ").slice(1).join(" ")}
              </span>
            </h1>
            <h2 className="text-xl md:text-2xl lg:text-3xl text-gray-800 dark:text-gray-300 font-semibold mb-6 capitalize text-center md:text-left w-full">
{resumeData.availability.toUpperCase()}
            </h2>
            {/* Removed the pill tag and any extra skills text as requested */}
          </div>

          {/* The Transparent Avatar Canvas embedded alongside the text - Right Side */}
          <div className="w-full md:w-1/2 flex justify-center md:justify-end mt-2 md:mt-0 relative z-20">
            <div className="w-full max-w-[400px] lg:max-w-[500px] aspect-[3/4] relative">
              <HeroAvatarCanvas />
            </div>
          </div>

        </section>

        {/* Narrative Portfolio Sections */}
        <div className="relative z-20 w-full mx-auto flex flex-col items-center gap-24 md:gap-40 mt-8 md:mt-16">
          
          {/* About */}
          <section className="relative w-full flex items-center justify-center">
            <div className="w-full max-w-4xl z-10">
              <GlassCard delay={0.2} className="p-6 md:p-10">
                 <h2 className="text-3xl md:text-5xl font-black mb-4 md:mb-6">{resumeData.about.title}</h2>
                 <p className="text-lg md:text-2xl text-gray-900 dark:text-gray-300 leading-relaxed font-medium">
                   {resumeData.about.description}
                 </p>
              </GlassCard>
            </div>
          </section>

          {/* Experience */}
          <section className="relative w-full flex flex-col items-center gap-4 md:gap-8">
            <div className="w-full max-w-4xl z-10">
              <div className="mb-6 md:mb-8">
                <h2 className="text-4xl md:text-6xl font-black drop-shadow-sm">{resumeData.experience.title}</h2>
              </div>
              <div className="space-y-6 md:space-y-8 relative">
                {resumeData.experience.list.map((exp, i) => (
                  <GlassCard key={i} delay={0.2 + i * 0.1} className="p-6 md:p-10">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4 md:mb-6">
                      <div>
                        <h3 className="text-2xl md:text-3xl font-bold">{exp.company}</h3>
                        <p className="text-gray-800 dark:text-gray-400 font-semibold text-lg md:text-xl mt-1">{exp.role}</p>
                      </div>
                      <div className="inline-flex items-center self-start md:self-center px-4 py-1.5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-full text-xs md:text-sm font-mono font-bold tracking-wide">
                        {exp.period}
                      </div>
                    </div>
                    <ul className="space-y-3 md:space-y-4">
                      {exp.achievements.map((item, j) => (
                        <li key={j} className="flex items-start gap-3 md:gap-4 text-gray-900 dark:text-gray-300 font-medium">
                          <span className="h-2 w-2 md:h-2.5 md:w-2.5 shrink-0 rounded-full bg-black dark:bg-white mt-2" />
                          <span className="leading-relaxed text-base md:text-lg">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </GlassCard>
                ))}
              </div>
            </div>
          </section>
          
          {/* Projects & Education */}
          <section className="relative w-full flex flex-col items-center gap-8 md:gap-12 z-10">
            <div className="w-full max-w-4xl">
              <div className="mb-4">
                <h2 className="text-4xl md:text-6xl font-black drop-shadow-sm">{resumeData.projects.title}</h2>
              </div>
              
              <div className="grid grid-cols-1 gap-6 md:gap-8">
                {resumeData.projects.list.map((proj, i) => (
                  <GlassCard key={i} delay={0.1 * i} className="p-6 md:p-10 group">
                    <h3 className="text-xl md:text-2xl font-black mb-3 md:mb-4 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">{proj.name}</h3>
                    <p className="text-gray-900 dark:text-gray-300 leading-relaxed font-medium text-base md:text-lg">
                      {proj.description}
                    </p>
                  </GlassCard>
                ))}
              </div>

              <div className="mt-12 md:mt-16">
                <h2 className="text-3xl md:text-5xl font-black drop-shadow-sm mb-6 md:mb-8">{resumeData.education.title}</h2>
                <GlassCard delay={0.2} className="p-6 md:p-10">
                  <h3 className="text-2xl md:text-3xl font-bold">{resumeData.education.degree}</h3>
                  <p className="text-gray-800 dark:text-gray-400 font-semibold text-lg md:text-xl mt-2">{resumeData.education.school}</p>
                  <div className="flex flex-wrap items-center gap-3 md:gap-4 mt-4 md:mt-6 text-xs md:text-sm font-mono text-gray-900 dark:text-gray-200 font-bold">
                    <span className="bg-black/10 dark:bg-white/10 px-3 md:px-4 py-1.5 md:py-2 rounded-full border border-black/20 dark:border-white/20">{resumeData.education.period}</span>
                    <span className="bg-black/10 dark:bg-white/10 px-3 md:px-4 py-1.5 md:py-2 rounded-full border border-black/20 dark:border-white/20">{resumeData.education.details}</span>
                  </div>
                </GlassCard>
              </div>
            </div>
          </section>

          {/* Contact */}
          <section className="py-16 md:py-32 w-full flex justify-center z-10">
             <GlassCard delay={0.2} className="text-center w-full max-w-4xl py-12 md:py-16 px-6 md:px-10">
                <h2 className="text-4xl md:text-7xl font-black mb-4 md:mb-8">{resumeData.contact.title}</h2>
                <p className="text-lg md:text-2xl text-gray-900 dark:text-gray-400 mb-8 md:mb-12 font-medium">
                  {resumeData.contact.description}
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center">
                  <a 
                    href={resumeData.contact.links.linkedin} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    aria-label={`Visit ${resumeData.title}'s LinkedIn Profile`}
                    className="px-6 md:px-10 py-4 md:py-5 bg-black dark:bg-white text-white dark:text-black font-bold text-base md:text-lg rounded-full hover:scale-105 transition-transform shadow-xl"
                  >
                    {resumeData.contact.buttons.primary}
                  </a>
                  <a 
                    href={resumeData.contact.links.github} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    aria-label={`Visit ${resumeData.title}'s GitHub Profile`}
                    className="px-6 md:px-10 py-4 md:py-5 bg-white/50 dark:bg-black/50 border border-black/20 dark:border-white/20 font-bold text-base md:text-lg rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors shadow-lg backdrop-blur-md"
                  >
                    {resumeData.contact.buttons.secondary}
                  </a>
                </div>
             </GlassCard>
          </section>
        </div>
      </div>
    </div>
  );
}
