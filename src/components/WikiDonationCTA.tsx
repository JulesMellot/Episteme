"use client";

import { useState } from "react";

type DonationCopy = {
  title: string;
  body: string;
  button: string;
  close: string;
};

const DISMISS_STORAGE_KEY = "episteme_wiki_donation_cta_hidden_until";
const ONE_WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;

const DONATION_COPY_BY_LANGUAGE: Record<string, DonationCopy> = {
  ar: {
    title: "ادعم ويكيبيديا",
    body: "هذه المقالة موجودة بفضل مساهمات المتطوعين. إذا استطعت، ساعد ويكيبيديا على البقاء حرة ومتاحة للجميع.",
    button: "تبرع لويكيبيديا",
    close: "إغلاق",
  },
  de: {
    title: "Wikipedia unterstützen",
    body: "Dieser Artikel existiert dank ehrenamtlicher Beiträge. Wenn du kannst, hilf mit, Wikipedia frei und für alle zugänglich zu halten.",
    button: "Für Wikipedia spenden",
    close: "Schließen",
  },
  en: {
    title: "Support Wikipedia",
    body: "This article exists thanks to volunteer contributions. If you can, help keep Wikipedia free and accessible to everyone.",
    button: "Donate to Wikipedia",
    close: "Close",
  },
  es: {
    title: "Apoya a Wikipedia",
    body: "Este artículo existe gracias a contribuciones voluntarias. Si puedes, ayuda a que Wikipedia siga siendo libre y accesible para todos.",
    button: "Donar a Wikipedia",
    close: "Cerrar",
  },
  fr: {
    title: "Soutenir Wikipédia",
    body: "Cet article existe grâce aux contributions bénévoles. Si vous le pouvez, aidez Wikipédia à rester libre et accessible à tous.",
    button: "Faire un don à Wikipédia",
    close: "Fermer",
  },
  hi: {
    title: "विकिपीडिया का समर्थन करें",
    body: "यह लेख स्वयंसेवकों के योगदान से संभव है। यदि आप कर सकते हैं, तो विकिपीडिया को सबके लिए मुक्त और सुलभ बनाए रखने में मदद करें।",
    button: "विकिपीडिया को दान दें",
    close: "बंद करें",
  },
  it: {
    title: "Sostieni Wikipedia",
    body: "Questo articolo esiste grazie ai contributi volontari. Se puoi, aiuta Wikipedia a restare libera e accessibile a tutti.",
    button: "Dona a Wikipedia",
    close: "Chiudi",
  },
  ja: {
    title: "Wikipedia を支援する",
    body: "この記事はボランティアの貢献によって成り立っています。可能であれば、Wikipedia を誰でも自由に使える状態で保つためにご支援ください。",
    button: "Wikipedia に寄付する",
    close: "閉じる",
  },
  ko: {
    title: "위키백과 후원하기",
    body: "이 문서는 자원봉사자들의 기여로 만들어졌습니다. 가능하시다면 위키백과가 모두에게 자유롭고 접근 가능하도록 후원해 주세요.",
    button: "위키백과에 기부하기",
    close: "닫기",
  },
  nl: {
    title: "Steun Wikipedia",
    body: "Dit artikel bestaat dankzij vrijwillige bijdragen. Als je kunt, help dan Wikipedia vrij en voor iedereen toegankelijk te houden.",
    button: "Doneer aan Wikipedia",
    close: "Sluiten",
  },
  pl: {
    title: "Wesprzyj Wikipedię",
    body: "Ten artykuł istnieje dzięki wkładowi wolontariuszy. Jeśli możesz, pomóż utrzymać Wikipedię wolną i dostępną dla wszystkich.",
    button: "Przekaż darowiznę",
    close: "Zamknij",
  },
  pt: {
    title: "Apoie a Wikipédia",
    body: "Este artigo existe graças a contribuições voluntárias. Se puder, ajude a manter a Wikipédia livre e acessível para todos.",
    button: "Doar para a Wikipédia",
    close: "Fechar",
  },
  ru: {
    title: "Поддержать Википедию",
    body: "Эта статья существует благодаря вкладу волонтеров. Если можете, помогите сохранить Википедию свободной и доступной для всех.",
    button: "Пожертвовать Википедии",
    close: "Закрыть",
  },
  sv: {
    title: "Stöd Wikipedia",
    body: "Den här artikeln finns tack vare frivilliga bidrag. Om du kan, hjälp Wikipedia att förbli fri och tillgänglig för alla.",
    button: "Donera till Wikipedia",
    close: "Stäng",
  },
  tr: {
    title: "Vikipedi'yi destekleyin",
    body: "Bu makale gönüllü katkılar sayesinde var. Mümkünse, Vikipedi'nin özgür ve herkes için erişilebilir kalmasına yardımcı olun.",
    button: "Vikipedi'ye bağış yap",
    close: "Kapat",
  },
  uk: {
    title: "Підтримати Вікіпедію",
    body: "Ця стаття існує завдяки внескам волонтерів. Якщо можете, допоможіть зберегти Вікіпедію вільною та доступною для всіх.",
    button: "Пожертвувати Вікіпедії",
    close: "Закрити",
  },
  zh: {
    title: "支持维基百科",
    body: "这篇文章由志愿者贡献而成。如果可以，请帮助维基百科保持自由并让所有人都能访问。",
    button: "向维基百科捐赠",
    close: "关闭",
  },
};

function getDonationCopy(languageTag: string): DonationCopy {
  const normalizedTag = languageTag.toLowerCase();
  const baseLanguage = normalizedTag.split("-")[0];
  return DONATION_COPY_BY_LANGUAGE[normalizedTag] ?? DONATION_COPY_BY_LANGUAGE[baseLanguage] ?? DONATION_COPY_BY_LANGUAGE.en;
}

type WikiDonationCTAProps = {
  browserLanguage?: string;
};

function isDismissed(): boolean {
  if (typeof window === "undefined") return false;
  const hiddenUntilRaw = window.localStorage.getItem(DISMISS_STORAGE_KEY);
  if (!hiddenUntilRaw) return false;

  const hiddenUntil = Number(hiddenUntilRaw);
  if (!Number.isFinite(hiddenUntil)) {
    window.localStorage.removeItem(DISMISS_STORAGE_KEY);
    return false;
  }

  if (Date.now() >= hiddenUntil) {
    window.localStorage.removeItem(DISMISS_STORAGE_KEY);
    return false;
  }

  return true;
}

export function WikiDonationCTA({ browserLanguage = "en" }: WikiDonationCTAProps) {
  const [isVisible, setIsVisible] = useState(() => !isDismissed());
  const copy = getDonationCopy(browserLanguage);
  const donateHref = `https://donate.wikimedia.org/?uselang=${encodeURIComponent(browserLanguage)}`;

  if (!isVisible) return null;

  return (
    <section className="fixed bottom-4 right-4 z-[90] w-[calc(100vw-2rem)] max-w-[360px] rounded-3xl border border-emerald-300/70 dark:border-emerald-700/70 bg-emerald-50/95 dark:bg-emerald-950/90 backdrop-blur supports-[backdrop-filter]:bg-emerald-50/80 dark:supports-[backdrop-filter]:bg-emerald-950/70 p-5 shadow-2xl">
      <button
        type="button"
        aria-label={copy.close}
        onClick={() => {
          if (typeof window !== "undefined") {
            const hiddenUntil = Date.now() + ONE_WEEK_IN_MS;
            window.localStorage.setItem(DISMISS_STORAGE_KEY, String(hiddenUntil));
          }
          setIsVisible(false);
        }}
        className="absolute top-2 right-2 inline-flex min-h-9 min-w-9 items-center justify-center rounded-full text-emerald-900/80 dark:text-emerald-100/80 hover:bg-emerald-200/60 dark:hover:bg-emerald-800/70 transition-colors"
      >
        x
      </button>
      <h2 className="text-lg sm:text-xl font-semibold text-emerald-900 dark:text-emerald-100 tracking-tight">
        {copy.title}
      </h2>
      <p className="mt-2 text-sm text-emerald-800/90 dark:text-emerald-200/90 leading-relaxed">
        {copy.body}
      </p>
      <a
        href={donateHref}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-medium bg-emerald-700 text-white hover:bg-emerald-800 dark:bg-emerald-500 dark:text-emerald-950 dark:hover:bg-emerald-400 transition-colors"
      >
        {copy.button}
      </a>
    </section>
  );
}
