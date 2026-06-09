"use client";

import i18n from "i18next";

import { initReactI18next } from "react-i18next";

import en from "./locales/en/translation.json";

import es from "./locales/es/translation.json";

import hi from "./locales/hi/translation.json";

import pt from "./locales/pt/translation.json";

import zh from "./locales/zh/translation.json";

import fr from "./locales/fr/translation.json";

i18n
.use(initReactI18next)
.init({

resources:{
en:{translation:en},
es:{translation:es},
hi:{translation:hi},
pt:{translation:pt},
zh:{translation:zh},
fr:{translation:fr},
},

lng:"en",

fallbackLng:"en",

interpolation:{
escapeValue:false
}

});

export default i18n;