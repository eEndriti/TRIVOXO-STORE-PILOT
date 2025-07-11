import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import layoutSq from './locales/sq/layout.json';
import layoutEn from './locales/en/layout.json';
import chartsSq from './locales/sq/charts.json';
import chartsEn from './locales/en/charts.json';
import faqjaKryesoreSq from './locales/sq/faqjaKryesore.json';
import faqjaKryesoreEn from './locales/en/faqjaKryesore.json';
import parametratSq from './locales/sq/parametrat.json';
import parametratEn from './locales/en/parametrat.json';
import shpenzimiSq from './locales/sq/shpenzimi.json';
import shpenzimiEn from './locales/en/shpenzimi.json';
import stokuSq from './locales/sq/stoku.json';
import stokuEn from './locales/en/stoku.json';
import subjektiSq from './locales/sq/subjekti.json';
import subjektiEn from './locales/en/subjekti.json';
import administrimiSq from './locales/sq/administrimi.json';
import administrimiEn from './locales/en/administrimi.json';
import shitjeblerjeSq from './locales/sq/shitjeblerje.json';
import shitjeblerjeEn from './locales/en/shitjeblerje.json';
import othersSq from './locales/sq/others.json';
import othersEq from './locales/en/others.json';



i18n
  .use(initReactI18next)
  .init({
    resources: {
      sq: { 
        layout : layoutSq,
        charts: chartsSq,
        faqjaKryesore:faqjaKryesoreSq,
        parametrat:parametratSq,
        shpenzimi:shpenzimiSq,
        stoku:stokuSq,
        subjekti:subjektiSq,
        administrimi:administrimiSq,
        shitjeblerje:shitjeblerjeSq,
        others:othersSq
      },
      en: { 
        layout : layoutEn,
        charts: chartsEn,
        faqjaKryesore:faqjaKryesoreEn,
        parametrat:parametratEn,
        shpenzimi:shpenzimiEn,
        stoku:stokuEn,
        subjekti:subjektiEn,
        administrimi:administrimiEn,
        shitjeblerje:shitjeblerjeEn,
        others:othersEq
       },
    },
    lng: 'en', // default language
    ns: ['layout', 'charts','faqjaKryesore','parametrat','shpenzimi','stoku','others'],
    fallbackLng: 'sq',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
