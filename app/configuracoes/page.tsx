import {
  Bell,
  Building2,
  CheckCircle2,
  Database,
  FileText,
  Lock,
  Radar,
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

        <section className="flex-1 px-4 py-5 sm:p-6">
          <div className="mb-5 rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl sm:mb-8 sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
            <h1 className="text-3xl font-black text-white sm:text-4xl">
              Configurações
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-400 sm:text-base">
              Central administrativa do Thanos Command com visão de empresa,
              segurança, módulos ativos e recursos planejados.
            </p>
          </div>

          <div className="mb-5 grid grid-cols-2 gap-3 sm:mb-8 sm:gap-5 lg:grid-cols-4">
            <InfoResumo
              label="Sistema"
              value="Operacional"
              icon={<ShieldCheck size={18} />}
            />

            <InfoResumo
              label="Banco"
              value="Firebase"
              icon={<Database size={18} />}
            />

            <InfoResumo
              label="Versão"
              value="1.0.0"
              icon={<FileText size={18} />}
            />

            <InfoResumo
              label="Monitoramento"
              value="Ativo"
              icon={<Radar size={18} />}
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <ConfigCard
              title="Empresa"
              status="Ativo"
              description="Identificação institucional do sistema, nome da plataforma e informações base da operação."
              detail="Hoje o Thanos Command já opera com identidade visual própria e estrutura preparada para uso comercial."
              icon={<Building2 size={24} />}
            />

            <ConfigCard
              title="Usuários e permissões"
              status="Planejado"
              description="Controle futuro de perfis como administrador, supervisor, coordenador, vigilante e cliente."
              detail="A base atual já possui autenticação protegida. A próxima evolução será separar permissões por tipo de usuário."
              icon={<UserCog size={24} />}
            />

            <ConfigCard
              title="Segurança"
              status="Ativo"
              description="Proteção de rotas administrativas, autenticação e regras operacionais no Firebase."
              detail="O painel administrativo fica protegido por login e as regras do banco limitam acesso aos dados sensíveis."
              icon={<Lock size={24} />}
            />

            <ConfigCard
              title="Notificações"
              status="Planejado"
              description="Alertas futuros para ocorrências críticas, rondas sem atualização, emergências e avisos operacionais."
              detail="O sistema já está preparado para evoluir para notificações push reais usando Firebase."
              icon={<Bell size={24} />}
            />

            <ConfigCard
              title="Banco de dados"
              status="Ativo"
              description="Estrutura operacional com vigilantes, postos, rondas, ocorrências, arquivo e serviços extras."
              detail="Os dados são salvos no Firebase e organizados por coleções operacionais."
              icon={<Database size={24} />}
            />

            <ConfigCard
              title="Status do sistema"
              status="Ativo"
              description="Resumo geral da plataforma, módulos em funcionamento e disponibilidade operacional."
              detail="O sistema está online, com dashboard, rondas, ocorrências, GPS, arquivo e serviços extras."
              icon={<ShieldCheck size={24} />}
            />
          </div>

          <div className="mt-5 rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-xl sm:mt-8 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-black text-white">
                  Maturidade do sistema
                </h2>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                  O Thanos Command já possui estrutura operacional para controle
                  de segurança patrimonial, com módulos principais ativos e
                  recursos avançados planejados para evolução comercial.
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-300">
                MVP operacional pronto para validação
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <Info
                label="Módulos ativos"
                value="Dashboard, Vigilantes, Postos, Rondas, Ocorrências, Arquivo e Extras"
              />

              <Info
                label="Recursos técnicos"
                value="Firebase, Netlify, GitHub, GPS, mapas e realtime"
              />

              <Info
                label="Próximas evoluções"
                value="Permissões, notificações push, relatórios automáticos e painel do cliente"
              />
            </div>
          </div>

          <div className="mt-5 rounded-3xl border border-red-500/10 bg-gradient-to-br from-red-500/10 to-slate-900 p-5 shadow-xl sm:mt-8 sm:p-6">
            <h2 className="text-xl font-black text-white">
              Observação operacional
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-300">
              Esta tela não aparece mais como “em desenvolvimento”. Agora ela
              apresenta o status real de cada área: o que já está ativo, o que
              está planejado e como o sistema está estruturado para crescer.
            </p>
          </div>
        </section>
      </main>
    </AuthGuard>
  );
}

function ConfigCard({
  title,
  description,
  detail,
  icon,
  status,
}: {
  title: string;
  description: string;
  detail: string;
  icon: React.ReactNode;
  status: "Ativo" | "Planejado";
}) {
  const statusStyle =
    status === "Ativo"
      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
      : "border-blue-500/20 bg-blue-500/10 text-blue-300";

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-xl transition hover:border-red-500/40 hover:bg-slate-800 sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
          {icon}
        </div>

        <span
          className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wide ${statusStyle}`}
        >
          {status}
        </span>
      </div>

      <h2 className="text-lg font-black text-white">{title}</h2>

      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>

      <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950 p-4">
        <p className="text-xs leading-5 text-slate-300">{detail}</p>
      </div>
    </div>
  );
}

function InfoResumo({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4 shadow-xl">
      <div className="flex items-center gap-2 text-red-400">{icon}</div>

      <p className="mt-3 text-xs font-bold text-slate-400">{label}</p>

      <h3 className="mt-1 text-sm font-black text-white sm:text-lg">{value}</h3>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:p-5">
      <p className="text-xs font-bold text-slate-500 sm:text-sm">{label}</p>
      <h3 className="mt-2 text-sm font-bold leading-6 text-white sm:text-base">
        {value}
      </h3>
    </div>
  );
}
