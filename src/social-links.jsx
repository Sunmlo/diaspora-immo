export const SOCIAL_LINKS = [
  { name: 'Facebook', url: 'https://www.facebook.com/profile.php?id=61595033995983', icon: 'facebook' },
  { name: 'Instagram', url: 'https://www.instagram.com/sokile.afrique/', icon: 'instagram' },
  { name: 'TikTok', url: 'https://www.tiktok.com/@sokile02', icon: 'tiktok' },
  { name: 'YouTube', url: 'https://www.youtube.com/@SokileAfrique', icon: 'youtube' },
];

function SocialIcon({ name }) {
  return <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true" focusable="false">
    {name === 'facebook' && <path d="M14 21v-8h3l.5-4H14V7c0-1 .4-1.5 1.5-1.5H18V2.2A27 27 0 0 0 15 2c-3 0-5 1.8-5 5v2H7v4h3v8z" />}
    {name === 'instagram' && <><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="17.5" cy="6.5" r="1.2" /></>}
    {name === 'tiktok' && <path d="M14 2h3c.3 2.6 1.8 4.2 4 4.5v3a9 9 0 0 1-4-1.3v7.3a6 6 0 1 1-6-6v3a3 3 0 1 0 3 3z" />}
    {name === 'youtube' && <><rect x="2" y="5" width="20" height="14" rx="4" /><path d="m10 9 6 3-6 3z" fill="#251a16" /></>}
  </svg>;
}

export function SocialLinks() {
  return <section className="sok-social" aria-label="Les réseaux sociaux de Sokilé">
    <h2>Suivez Sokilé</h2>
    <p>Inspirations, conseils et actualités pour votre projet immobilier en Afrique.</p>
    <nav className="sok-social-links" aria-label="Suivre Sokilé sur les réseaux sociaux">
      {SOCIAL_LINKS.map(({ name, url, icon }) => <a key={name} href={url} target="_blank" rel="noopener noreferrer" aria-label={`Sokilé sur ${name} (nouvel onglet)`}>
        <SocialIcon name={icon} /><span>{name}</span><span className="sok-social-arrow" aria-hidden="true">↗</span>
      </a>)}
    </nav>
  </section>;
}
