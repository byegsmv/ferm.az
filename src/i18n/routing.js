import {defineRouting} from 'next-intl/routing';
import {createNavigation} from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['az', 'en', 'ru'],
  defaultLocale: 'az',
  localePrefix: 'as-needed',
  localeDetection: false
});

export const {Link, redirect, usePathname, useRouter, useLocale} = createNavigation(routing);
