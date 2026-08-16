import {
    MessageCircle, BookOpen, CheckCircle, Database, ClipboardList,
    Users, FileText, AlertTriangle, Link2, Globe, Star, Shield,
    Phone, Mail, Newspaper, BarChart3, Info,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * Peta kunci ikon (disimpan sebagai string di database) ke komponen
 * lucide-react yang sebenarnya. Dipakai bersama oleh dropdown pemilihan
 * ikon di form admin DAN tampilan kartu link publik — supaya keduanya
 * selalu konsisten satu sama lain.
 */
export const PESTA_KOJA_ICON_MAP: Record<string, LucideIcon> = {
    'message-circle': MessageCircle,
    'book-open': BookOpen,
    'check-circle': CheckCircle,
    database: Database,
    'clipboard-list': ClipboardList,
    users: Users,
    'file-text': FileText,
    'alert-triangle': AlertTriangle,
    link: Link2,
    globe: Globe,
    star: Star,
    shield: Shield,
    phone: Phone,
    mail: Mail,
    newspaper: Newspaper,
    'bar-chart': BarChart3,
    info: Info,
};

export const PESTA_KOJA_ICON_OPTIONS = Object.keys(PESTA_KOJA_ICON_MAP);

export function getPestaKojaIcon(key: string): LucideIcon {
    return PESTA_KOJA_ICON_MAP[key] ?? Link2;
}
