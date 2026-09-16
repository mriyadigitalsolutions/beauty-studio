import { defaultLocale, locales } from '@/content/locales';
import { localePath } from '@/lib/i18n';
import styles from './page.module.css';

const LOCALE_NAMES: Record<string, string> = { de: 'Deutsch', en: 'English', ru: 'Русский' };

/**
 * `/` is a static distributor, not a redirect: a static export has no
 * middleware. With JavaScript the inline script picks the best of the three
 * languages out of `navigator.languages`; without it the meta refresh and the
 * three visible links do the same job.
 */
const redirectScript = `(function(){try{var supported=${JSON.stringify([...locales])};
var accepted=navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language||''];
for(var i=0;i<accepted.length;i++){var base=String(accepted[i]).trim().toLowerCase().split(/[-_;]/)[0];
if(supported.indexOf(base)>-1){location.replace('/'+base+'/');return;}}
location.replace('/${defaultLocale}/');}catch(e){location.replace('/${defaultLocale}/');}})();`;

export default function LocaleDistributor() {
  return (
    <div className={styles.screen}>
      <script dangerouslySetInnerHTML={{ __html: redirectScript }} />
      <meta httpEquiv="refresh" content={`2; url=${localePath(defaultLocale)}`} />
      <h1>Laser hair removal</h1>
      <p>Choose your language · Sprache wählen · Выберите язык</p>
      <ul className={styles.links}>
        {locales.map((locale) => (
          <li key={locale}>
            <a href={localePath(locale)} hrefLang={locale}>
              {LOCALE_NAMES[locale]}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
