import Link from "next/link";
import {
  ShieldCheck,
  Users,
  MapPinned,
  Siren,
  FileText,
  Radar,
} from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-6 py-10">
        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600 shadow-lg shadow-red-600/30">
            <ShieldCheck size={28} />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Thanos Command
            </h1>
            <p className="text-sm text-slate-400">
              Gestão inteligente para segurança privada
            </p>
          </div>
        </div>

        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="mb-5 inline-flex rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300">
              Central operacional em tempo real
            </span>

            <h2 className="max-w-3xl text-4xl font-black leading-tight tracking-tight md:text-6xl">
              Controle sua operação de segurança com visão total.
            </h2>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Gerencie vigilantes, postos, rondas, ocorrências, presença,
              emergências e relatórios em um sistema moderno, rápido e
              profissional.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="rounded-2xl bg-red-600 px-6 py-4 text-center font-bold text-white shadow-lg shadow-red-600/30 transition hover:bg-red-500"
              >
                Entrar no sistema
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card
              icon={<Users />}
              title="Vigilantes"
              text="Equipe, escalas, presença e status operacional."
            />
            <Card
              icon={<MapPinned />}
              title="Postos"
              text="Clientes, endereços, riscos e cobertura."
            />
            <Card
              icon={<Radar />}
              title="Rondas"
              text="Controle por horário, GPS e evidências."
            />
            <Card
              icon={<Siren />}
              title="Emergências"
              text="Alertas críticos com prioridade máxima."
            />
            <Card
              icon={<FileText />}
              title="Relatórios"
              text="PDFs profissionais para clientes e auditoria."
            />
            <Card
              icon={<ShieldCheck />}
              title="Gestão 360"
              text="Tudo centralizado em um painel premium."
            />
          </div>
        </div>
      </section>
    </main>
  );
}

function Card({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-red-400">
        {icon}
      </div>

      <h3 className="text-lg font-bold">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
    </div>
  );
}
