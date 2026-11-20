'use client';
import Link from 'next/link';
import Icon from './Icon';
import {useI18n} from './LanguageProvider';
export default function BackToAccount(){const {t}=useI18n();return <Link href="/account" className="back-link" aria-label={t('account.back')}><span aria-hidden="true"><Icon name="chevronLeft" size={18}/></span> {t('common.settings')}</Link>}
