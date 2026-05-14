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
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:justify-center lg:py-10">
        <div className="mb-5 flex items-center gap-3 rounded-3xl border border-slate-800 bg-slate-900/70 p-4 shadow-xl lg:mb-10 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-600 shadow-lg shadow-red-600/30">
            <ShieldCheck size={28} />
          </div>

          <div>
            <h1 className="text-xl font-black tracking-tight sm:text-2xl">
              Thanos Command
            </h1>
            <p className="text-xs text-slate-400 sm:text-sm">
              Central inteligente de segurança privada
            </p>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2 lg:items-center lg:gap-10">
          <div className="rounded-[2rem] border border-slate-800 bg-slate-900/60 p-5 shadow-2xl lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
            <span className="mb-4 inline-flex rounded-full border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300 sm:text-sm">
              Central operacional em tempo real
            </span>

            <h2 className="max-w-3xl text-3xl font-black leading-tight tracking-tight sm:text-4xl md:text-6xl">
              Controle sua operação com visão total.
            </h2>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-lg sm:leading-8">
              Gerencie vigilantes, postos, rondas, ocorrências, presença,
              emergências e relatórios em um sistema moderno, rápido e
              profissional.
            </p>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row lg:mt-8">
              <Link
                href="/login"
                className="rounded-2xl bg-red-600 px-6 py-4 text-center text-sm font-black text-white shadow-lg shadow-red-600/30 transition hover:bg-red-500 sm:text-base"
              >
                Entrar no sistema
              </Link>

              <Link
                href="/ronda-operacional"
                className="rounded-2xl border border-slate-700 bg-slate-950 px-6 py-4 text-center text-sm font-black text-slate-200 transition hover:bg-slate-800 sm:text-base"
              >
                Acesso do vigilante
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <Card
              icon={<Users size={20} />}
              title="Vigilantes"
              text="Equipe, escalas e status."
            />
            <Card
              icon={<MapPinned size={20} />}
              title="Postos"
              text="Clientes, riscos e cobertura."
            />
            <Card
              icon={<Radar size={20} />}
              title="Rondas"
              text="GPS, horários e evidências."
            />
            <Card
              icon={<Siren size={20} />}
              title="Emergências"
              text="Alertas críticos."
            />
            <Card
              icon={<FileText size={20} />}
              title="Relatórios"
              text="PDFs profissionais."
            />
            <Card
              icon={<ShieldCheck size={20} />}
              title="Gestão 360"
              text="Painel premium."
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
    <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl transition hover:border-red-500/40 sm:p-6">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-800 text-red-400 sm:h-12 sm:w-12">
        {icon}
      </div>

      <h3 className="text-sm font-black sm:text-lg">{title}</h3>

      <p className="mt-2 text-xs leading-5 text-slate-400 sm:text-sm sm:leading-6">
        {text}
      </p>
    </div>
  );
}
