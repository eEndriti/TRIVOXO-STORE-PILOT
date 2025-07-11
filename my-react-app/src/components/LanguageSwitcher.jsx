import { useTranslation } from 'react-i18next';
import { Button, ButtonGroup,Image } from 'react-bootstrap';
import alFlag from '../../public/alFlag.png';
import UKFlag from '../../public/UKFlag.png';

export const LanguageSwitcher = () => {
  const {t} = useTranslation('others')
  const { i18n } = useTranslation();
  const currentLang = i18n.language;

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const languages = [
    { code: 'sq', label: 'Shqip', flag: alFlag },
    { code: 'en', label: 'English', flag: UKFlag },
  ];

  return (
    <ButtonGroup aria-label="Language selector" className="gap-2 m-5 pt-5 align-content-end">
      {languages.map((lang) => (
        <Button
          key={lang.code}
          variant={currentLang === lang.code ? 'outline-primary' : 'outline-secondary'}
          onClick={() => changeLanguage(lang.code)}
          active={currentLang === lang.code}
          title={lang.label}
          className="d-flex align-items-center justify-content-center p-1 border rounded"
          style={{ width: '48px', height: '32px', padding: 0 }}
        >
          <Image
            src={lang.flag}
            alt={lang.label}
            fluid
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'cover',
              borderRadius: '4px',
            }}
          />
          {currentLang != 'en'? 
            <>
              <p className={` m-3 ${currentLang === lang.code ? 'text-light' : 'text-dark'}`}>{ lang.label == 'Shqip' ? 'Shqip' : 'Anglisht' }</p>
            </> 
            : <p className={` m-3 ${currentLang === lang.code ? 'text-light' : 'text-dark'}`}>{ lang.label == 'Shqip' ? t('Shqip') : t('Anglisht') }</p>}
        </Button>
      ))}
    </ButtonGroup>
  );
};
