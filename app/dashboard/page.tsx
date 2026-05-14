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

        <section className="flex-1 p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-black text-white">Dashboard</h1>

            <p className="mt-2 text-slate-400">
              Monitoramento operacional em tempo real.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
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

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
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

          <div className="mt-5 grid gap-5 lg:grid-cols-3">
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

          <div className="mt-5 grid gap-5 lg:grid-cols-3">
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

          <div className="mt-10 rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600">
                <ShieldCheck />
              </div>

              <div>
                <h2 className="text-xl font-bold text-white">
                  Central Operacional
                </h2>

                <p className="text-sm text-slate-400">
                  Thanos Command online e monitorando toda a operação em tempo
                  real.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
            className="mt-10 block rounded-3xl border border-red-500/10 bg-gradient-to-br from-red-500/10 to-slate-900 p-6 transition hover:border-red-500/40 hover:from-red-500/20"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600/20 text-red-300">
                <ShieldAlert />
              </div>

              <div>
                <h2 className="text-xl font-bold text-white">
                  Alerta Operacional
                </h2>

                <p className="text-sm text-slate-300">
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
      className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl transition hover:border-red-500/40 hover:bg-slate-800"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">{title}</p>

          <h2 className="mt-3 text-4xl font-black text-white">{value}</h2>
        </div>

        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
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
      className={`rounded-3xl border p-6 transition hover:scale-[1.01] ${color}`}
    >
      <p className="text-sm font-medium">{title}</p>

      <h2 className="mt-4 text-5xl font-black">{value}</h2>

      <p className="mt-3 text-xs opacity-80">Clique para visualizar</p>
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
    <div className="rounded-2xl bg-slate-950 p-5">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}

        <p className="text-sm">{label}</p>
      </div>

      <h3 className="mt-3 text-lg font-bold text-white">{value}</h3>
    </div>
  );
}
