import {
  Bell,
  Building2,
  Database,
  Lock,
  ShieldCheck,
  UserCog,
} from "lucide-react";

import { AuthGuard } from "../../components/AuthGuard";
import { Sidebar } from "../../components/Sidebar";

export default function Page() {
  return (
    <AuthGuard>
      <main className="flex min-h-screen bg-slate-950">
        <Sidebar />

        <section className="flex-1 p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-black text-white">Configurações</h1>

            <p className="mt-2 text-slate-400">
              Área administrativa para ajustes gerais do sistema.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <ConfigCard
              title="Empresa"
              description="Dados da empresa, nome do sistema, logo e informações institucionais."
              icon={<Building2 size={24} />}
            />

            <ConfigCard
              title="Usuários e permissões"
              description="Controle de acesso, níveis administrativos e segurança dos usuários."
              icon={<UserCog size={24} />}
            />

            <ConfigCard
              title="Segurança"
              description="Configurações de autenticação, proteção de rotas e regras operacionais."
              icon={<Lock size={24} />}
            />

            <ConfigCard
              title="Notificações"
              description="Alertas de ocorrências, rondas, atrasos e avisos importantes."
              icon={<Bell size={24} />}
            />

            <ConfigCard
              title="Banco de dados"
              description="Status do Firebase, estrutura dos dados e futuras opções de backup."
              icon={<Database size={24} />}
            />

            <ConfigCard
              title="Status do sistema"
              description="Sistema operacional, módulos ativos e monitoramento geral."
              icon={<ShieldCheck size={24} />}
            />
          </div>

          <div className="mt-10 rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-bold text-white">Thanos Command</h2>

            <p className="mt-2 text-slate-400">
              Esta área será usada para centralizar configurações importantes do
              sistema, como dados da empresa, permissões, segurança,
              notificações e integrações futuras.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <Info label="Versão" value="1.0.0" />
              <Info label="Status" value="Operacional" />
              <Info label="Banco de dados" value="Firebase Online" />
            </div>
          </div>
        </section>
      </main>
    </AuthGuard>
  );
}

function ConfigCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 transition hover:border-red-500/40 hover:bg-slate-800">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
        {icon}
      </div>

      <h2 className="text-lg font-bold text-white">{title}</h2>

      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>

      <p className="mt-5 text-xs font-bold uppercase tracking-wide text-red-300">
        Em desenvolvimento
      </p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-950 p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <h3 className="mt-2 font-bold text-white">{value}</h3>
    </div>
  );
}
