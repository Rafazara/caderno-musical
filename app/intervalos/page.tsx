import { IntervalStudio } from './interval-studio';
import Link from "next/link";
export default function Page(){return <><IntervalStudio/><aside className="mt-10 border-t border-rule pt-6"><p className="type-label text-brass">Próximo passo</p><p className="mt-2 text-sm text-ink-muted">Agora que você entende terças e quintas, pode combiná-las para formar tríades.</p><Link href="/acordes" className="mt-3 inline-block text-sm font-medium text-brass">Abrir Acordes →</Link></aside></>;}
