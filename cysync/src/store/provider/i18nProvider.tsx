import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';

import { I18nStrings } from '../../constants/i18n';

// Include other supported languages here when implemented
export type I18nLanguage = 'en';

// When we implement more languages, we can get this from local storage
const defaultLanguage: I18nLanguage = 'en';

export interface I18nContextInterface {
  language: I18nLanguage;
  setLanguage: React.Dispatch<React.SetStateAction<I18nLanguage>>;
  langStrings: I18nStrings;
}

export const I18nContext: React.Context<I18nContextInterface> =
  React.createContext<I18nContextInterface>({} as I18nContextInterface);

export const I18nProvider: React.FC = ({ children }) => {
  const [language, setLanguage] = useState<I18nLanguage>(defaultLanguage);
  const [langStrings, setLangStrings] = useState<I18nStrings>(
    require(`../../constants/i18n/${defaultLanguage}`).default
  );

  useEffect(() => {
    setLangStrings(require(`../../constants/i18n/${language}`).default);
  }, [language]);

  return (
    <I18nContext.Provider value={{ language, setLanguage, langStrings }}>
      {children}
    </I18nContext.Provider>
  );
};

I18nProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export function useI18n(): I18nContextInterface {
  return React.useContext(I18nContext);
}
