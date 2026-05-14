"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock3,
  Radar,
  ShieldAlert,
  ShieldCheck,
  Users,
} from "lucide-react";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  Tooltip,
} from "recharts";

import { collection, getDocs } from "firebase/firestore";

import { AuthGuard } from "../../components/AuthGuard";
import { Sidebar } from "../../components/Sidebar";
import { db } from "../../lib/firebase";

export default function DashboardPage() {
  const [totalVigilantes, setTotalVigilantes] = useState(0);
  const [totalPostos, setTotalPostos] = useState(0);
  const [totalRondas, setTotalRondas] = useState(0);
  const [totalOcorrencias, setTotalOcorrencias] = useState(0);

  const [ativos, setAtivos] = useState(0);
  const [ferias, setFerias] = useState(0);
  const [afastados, setAfastados] = useState(0);

  const [rondasPendentes, setRondasPendentes] = useState(0);
  const [rondasAndamento, setRondasAndamento] = useState(0);
  const [rondasConcluidas, setRondasConcluidas] = useState(0);

  const [ocorrenciasAbertas, setOcorrenciasAbertas] = useState(0);
  const [ocorrenciasFinalizadas, setOcorrenciasFinalizadas] = useState(0);

  const [postosAltoRisco, setPostosAltoRisco] = useState(0);

  async function carregarDashboard() {
    const vigilantesSnapshot = await getDocs(collection(db, "vigilantes"));
    const postosSnapshot = await getDocs(collection(db, "postos"));
    const rondasSnapshot = await getDocs(collection(db, "rondas"));
    const ocorrenciasSnapshot = await getDocs(collection(db, "ocorrencias"));

    const vigilantes = vigilantesSnapshot.docs.map((doc) => doc.data());
    const postos = postosSnapshot.docs.map((doc) => doc.data());
    const rondas = rondasSnapshot.docs.map((doc) => doc.data());
    const ocorrencias = ocorrenciasSnapshot.docs.map((doc) => doc.data());

    setTotalVigilantes(vigilantesSnapshot.size);
    setTotalPostos(postosSnapshot.size);
    setTotalRondas(rondasSnapshot.size);
    setTotalOcorrencias(ocorrenciasSnapshot.size);

    setAtivos(vigilantes.filter((v: any) => v.status === "Ativo").length);
    setFerias(vigilantes.filter((v: any) => v.status === "Férias").length);
    setAfastados(vigilantes.filter((v: any) => v.status === "Afastado").length);

    setRondasPendentes(
      rondas.filter((r: any) => r.status === "Pendente").length,
    );

    setRondasAndamento(
      rondas.filter((r: any) => r.status === "Em andamento").length,
    );

    setRondasConcluidas(
      rondas.filter((r: any) => r.status === "Concluída").length,
    );

    setOcorrenciasAbertas(
      ocorrencias.filter((o: any) => o.status === "Aberta").length,
    );

    setOcorrenciasFinalizadas(
      ocorrencias.filter((o: any) => o.status === "Finalizada").length,
    );

    setPostosAltoRisco(postos.filter((p: any) => p.risco === "Alto").length);
  }

  useEffect(() => {
    carregarDashboard();
  }, []);

  return (
    <AuthGuard>
      <main className="flex min-h-screen bg-slate-950">
        <Sidebar />

        <section className="flex-1 px-4 py-5 sm:p-6">
          <div className="mb-5 rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl sm:mb-8 sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
            <h1 className="text-3xl font-black text-white sm:text-4xl">
              Dashboard
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-400 sm:text-base">
              Monitoramento operacional em tempo real.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-2 xl:grid-cols-4">
            <Card
              href="/vigilantes"
              title="Vigilantes"
              value={totalVigilantes}
              icon={<Users size={24} />}
            />

            <Card
              href="/postos"
              title="Postos"
              value={totalPostos}
              icon={<Building2 size={24} />}
            />

            <Card
              href="/rondas"
              title="Rondas"
              value={totalRondas}
              icon={<Radar size={24} />}
            />

            <Card
              href="/ocorrencias"
              title="Ocorrências"
              value={totalOcorrencias}
              icon={<AlertTriangle size={24} />}
            />
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3 sm:mt-10 sm:gap-5 lg:grid-cols-3">
            <StatusCard
              href="/vigilantes?status=Ativo"
              title="Vigilantes ativos"
              value={ativos}
              color="bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
            />

            <StatusCard
              href="/vigilantes?status=Férias"
              title="Vigilantes em férias"
              value={ferias}
              color="bg-blue-500/10 text-blue-300 border-blue-500/20"
            />

            <StatusCard
              href="/vigilantes?status=Afastado"
              title="Vigilantes afastados"
              value={afastados}
              color="bg-red-500/10 text-red-300 border-red-500/20"
            />
          </div>

          <div className="mt-3 grid grid-cols-3 gap-3 sm:mt-5 sm:gap-5 lg:grid-cols-3">
            <StatusCard
              href="/rondas?status=Pendente"
              title="Rondas pendentes"
              value={rondasPendentes}
              color="bg-yellow-500/10 text-yellow-300 border-yellow-500/20"
            />

            <StatusCard
              href="/rondas?status=Em andamento"
              title="Rondas em andamento"
              value={rondasAndamento}
              color="bg-blue-500/10 text-blue-300 border-blue-500/20"
            />

            <StatusCard
              href="/rondas?status=Concluída"
              title="Rondas concluídas"
              value={rondasConcluidas}
              color="bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
            />
          </div>

          <div className="mt-3 grid grid-cols-3 gap-3 sm:mt-5 sm:gap-5 lg:grid-cols-3">
            <StatusCard
              href="/ocorrencias?status=Aberta"
              title="Ocorrências abertas"
              value={ocorrenciasAbertas}
              color="bg-red-500/10 text-red-300 border-red-500/20"
            />

            <StatusCard
              href="/ocorrencias?status=Finalizada"
              title="Ocorrências finalizadas"
              value={ocorrenciasFinalizadas}
              color="bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
            />

            <StatusCard
              href="/postos?risco=Alto"
              title="Postos alto risco"
              value={postosAltoRisco}
              color="bg-orange-500/10 text-orange-300 border-orange-500/20"
            />
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-2">
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4 shadow-xl sm:p-6">
              <div className="mb-5">
                <h2 className="text-lg font-black text-white sm:text-xl">
                  Status das rondas
                </h2>

                <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                  Visão operacional em tempo real das rondas.
                </p>
              </div>

              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      {
                        name: "Pendentes",
                        total: rondasPendentes,
                      },
                      {
                        name: "Andamento",
                        total: rondasAndamento,
                      },
                      {
                        name: "Concluídas",
                        total: rondasConcluidas,
                      },
                    ]}
                  >
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "#cbd5e1", fontSize: 12 }}
                    />

                    <Tooltip />

                    <Bar
                      dataKey="total"
                      radius={[10, 10, 0, 0]}
                      fill="#dc2626"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4 shadow-xl sm:p-6">
              <div className="mb-5">
                <h2 className="text-lg font-black text-white sm:text-xl">
                  Ocorrências operacionais
                </h2>

                <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                  Distribuição das ocorrências no sistema.
                </p>
              </div>

              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        {
                          name: "Abertas",
                          value: ocorrenciasAbertas,
                        },
                        {
                          name: "Finalizadas",
                          value: ocorrenciasFinalizadas,
                        },
                      ]}
                      dataKey="value"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={5}
                    >
                      <Cell fill="#ef4444" />
                      <Cell fill="#22c55e" />
                    </Pie>

                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-red-500/10 p-3 text-center">
                  <p className="text-xs font-bold text-red-300">Em aberto</p>

                  <h3 className="mt-1 text-2xl font-black text-white">
                    {ocorrenciasAbertas}
                  </h3>
                </div>

                <div className="rounded-2xl bg-emerald-500/10 p-3 text-center">
                  <p className="text-xs font-bold text-emerald-300">
                    Finalizadas
                  </p>

                  <h3 className="mt-1 text-2xl font-black text-white">
                    {ocorrenciasFinalizadas}
                  </h3>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-xl sm:mt-10 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-600 sm:h-12 sm:w-12">
                <ShieldCheck size={20} />
              </div>

              <div>
                <h2 className="text-lg font-black text-white sm:text-xl">
                  Central Operacional
                </h2>

                <p className="text-xs leading-5 text-slate-400 sm:text-sm">
                  Thanos Command online e monitorando toda a operação em tempo
                  real.
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-6 sm:gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Info
                label="Status do sistema"
                value="Operacional"
                icon={<ShieldCheck size={18} />}
              />

              <Info
                label="Monitoramento"
                value="Ativo"
                icon={<Radar size={18} />}
              />

              <Info
                label="Banco de dados"
                value="Firebase Online"
                icon={<CheckCircle2 size={18} />}
              />

              <Info
                label="Última atualização"
                value={new Date().toLocaleTimeString("pt-BR")}
                icon={<Clock3 size={18} />}
              />
            </div>
          </div>

          <Link
            href={
              ocorrenciasAbertas > 0
                ? "/ocorrencias?status=Aberta"
                : "/ocorrencias"
            }
            className="mt-5 block rounded-3xl border border-red-500/10 bg-gradient-to-br from-red-500/10 to-slate-900 p-5 shadow-xl transition hover:border-red-500/40 hover:from-red-500/20 sm:mt-10 sm:p-6"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-600/20 text-red-300 sm:h-12 sm:w-12">
                <ShieldAlert size={20} />
              </div>

              <div>
                <h2 className="text-lg font-black text-white sm:text-xl">
                  Alerta Operacional
                </h2>

                <p className="text-xs leading-5 text-slate-300 sm:text-sm">
                  {ocorrenciasAbertas > 0
                    ? `${ocorrenciasAbertas} ocorrência(s) aguardando tratativa operacional. Clique para visualizar.`
                    : "Nenhuma ocorrência crítica no momento."}
                </p>
              </div>
            </div>
          </Link>
        </section>
      </main>
    </AuthGuard>
  );
}

function Card({
  title,
  value,
  icon,
  href,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-3xl border border-slate-800 bg-slate-900 p-4 shadow-xl transition hover:border-red-500/40 hover:bg-slate-800 sm:p-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 sm:text-sm">
            {title}
          </p>

          <h2 className="mt-2 text-4xl font-black text-white sm:mt-3">
            {value}
          </h2>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 sm:h-14 sm:w-14">
          {icon}
        </div>
      </div>
    </Link>
  );
}

function StatusCard({
  title,
  value,
  color,
  href,
}: {
  title: string;
  value: number;
  color: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={`rounded-3xl border p-3 transition hover:scale-[1.01] sm:p-6 ${color}`}
    >
      <p className="min-h-9 text-[11px] font-bold leading-4 sm:min-h-0 sm:text-sm sm:font-medium">
        {title}
      </p>

      <h2 className="mt-2 text-3xl font-black sm:mt-4 sm:text-5xl">{value}</h2>

      <p className="mt-2 hidden text-xs opacity-80 sm:block">
        Clique para visualizar
      </p>
    </Link>
  );
}

function Info({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-slate-950 p-4 sm:p-5">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}

        <p className="text-xs sm:text-sm">{label}</p>
      </div>

      <h3 className="mt-2 text-sm font-bold text-white sm:mt-3 sm:text-lg">
        {value}
      </h3>
    </div>
  );
}
