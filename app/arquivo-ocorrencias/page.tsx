"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import {
  Archive,
  Clock3,
  Eye,
  MapPin,
  RotateCcw,
  Search,
  ShieldAlert,
  UserRound,
} from "lucide-react";

import { AuthGuard } from "@/components/AuthGuard";
import { Sidebar } from "@/components/Sidebar";
import { db } from "@/lib/firebase";

type Localizacao = {
  latitude: number;
  longitude: number;
};

type Ocorrencia = {
  id: string;
  tipo: string;
  posto: string;
  prioridade: string;
  descricao: string;
  status: string;
  fotoUrl?: string;
  re?: string;
  vigilante?: string;
  origem?: string;
  data?: string;
  latitude?: number;
  longitude?: number;
  localizacao?: Localizacao;
};

function obterCoordenadaOcorrencia(ocorrencia: Ocorrencia | null) {
  if (!ocorrencia) return null;

  if (
    typeof ocorrencia.latitude === "number" &&
    typeof ocorrencia.longitude === "number"
  ) {
    return {
      latitude: ocorrencia.latitude,
      longitude: ocorrencia.longitude,
    };
  }

  if (
    typeof ocorrencia.localizacao?.latitude === "number" &&
    typeof ocorrencia.localizacao?.longitude === "number"
  ) {
    return {
      latitude: ocorrencia.localizacao.latitude,
      longitude: ocorrencia.localizacao.longitude,
    };
  }

  return null;
}

export default function ArquivoOcorrenciasPage() {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [busca, setBusca] = useState("");
  const [filtroPeriodo, setFiltroPeriodo] = useState("Todos");
  const [filtroPrioridade, setFiltroPrioridade] = useState("Todas");
  const [paginaAtual, setPaginaAtual] = useState(1);

  const ITENS_POR_PAGINA = 6;

  const [ocorrenciaAberta, setOcorrenciaAberta] = useState<Ocorrencia | null>(
    null,
  );

  useEffect(() => {
    const q = query(collection(db, "ocorrencias"), orderBy("criadoEm", "desc"));

    const cancelarEscuta = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      })) as Ocorrencia[];

      setOcorrencias(lista.filter((item) => item.status === "Arquivada"));
    });

    return () => cancelarEscuta();
  }, []);

  const ocorrenciasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return ocorrencias.filter((ocorrencia) => {
      const dataOcorrencia = ocorrencia.data || "";

      const agora = new Date();
      const hoje = agora.toLocaleDateString("pt-BR");

      let periodoValido = true;

      if (filtroPeriodo === "Hoje") {
        periodoValido = dataOcorrencia.includes(hoje);
      }

      if (filtroPeriodo === "7 dias") {
        const seteDiasAtras = new Date();
        seteDiasAtras.setDate(agora.getDate() - 7);

        periodoValido =
          !!dataOcorrencia &&
          new Date(
            dataOcorrencia.split(" ")[0].split("/").reverse().join("-"),
          ) >= seteDiasAtras;
      }

      if (filtroPeriodo === "30 dias") {
        const trintaDiasAtras = new Date();
        trintaDiasAtras.setDate(agora.getDate() - 30);

        periodoValido =
          !!dataOcorrencia &&
          new Date(
            dataOcorrencia.split(" ")[0].split("/").reverse().join("-"),
          ) >= trintaDiasAtras;
      }

      const prioridadeValida =
        filtroPrioridade === "Todas" ||
        ocorrencia.prioridade === filtroPrioridade;

      const buscaValida =
        !termo ||
        (ocorrencia.tipo || "").toLowerCase().includes(termo) ||
        (ocorrencia.posto || "").toLowerCase().includes(termo) ||
        (ocorrencia.prioridade || "").toLowerCase().includes(termo) ||
        (ocorrencia.status || "").toLowerCase().includes(termo) ||
        (ocorrencia.descricao || "").toLowerCase().includes(termo) ||
        (ocorrencia.re || "").toLowerCase().includes(termo) ||
        (ocorrencia.vigilante || "").toLowerCase().includes(termo) ||
        (ocorrencia.data || "").toLowerCase().includes(termo);

      return periodoValido && prioridadeValida && buscaValida;
    });
  }, [busca, ocorrencias, filtroPeriodo, filtroPrioridade]);

  useEffect(() => {
    setPaginaAtual(1);
  }, [busca, filtroPeriodo, filtroPrioridade]);

  const totalPaginas = Math.ceil(
    ocorrenciasFiltradas.length / ITENS_POR_PAGINA,
  );

  const ocorrenciasPaginadas = useMemo(() => {
    const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
    const fim = inicio + ITENS_POR_PAGINA;

    return ocorrenciasFiltradas.slice(inicio, fim);
  }, [ocorrenciasFiltradas, paginaAtual]);

  const comGps = useMemo(() => {
    return ocorrencias.filter((item) => obterCoordenadaOcorrencia(item)).length;
  }, [ocorrencias]);

  const criticas = useMemo(() => {
    return ocorrencias.filter(
      (item) => item.prioridade === "Crítica" || item.prioridade === "Alta",
    ).length;
  }, [ocorrencias]);

  async function restaurarOcorrencia(ocorrencia: Ocorrencia) {
    const confirmar = confirm(
      "Deseja restaurar esta ocorrência para a tela operacional?",
    );

    if (!confirmar) return;

    try {
      await updateDoc(doc(db, "ocorrencias", ocorrencia.id), {
        status: "Aberta",
        atualizadoEm: serverTimestamp(),
      });

      alert("Ocorrência restaurada com sucesso!");
    } catch (error) {
      console.error(error);
      alert("Erro ao restaurar ocorrência.");
    }
  }

  function abrirGoogleMaps(ocorrencia: Ocorrencia) {
    const coordenada = obterCoordenadaOcorrencia(ocorrencia);

    if (!coordenada) {
      alert("Esta ocorrência não possui localização GPS.");
      return;
    }

    window.open(
      `https://www.google.com/maps?q=${coordenada.latitude},${coordenada.longitude}`,
      "_blank",
    );
  }

  function corPrioridade(valor: string) {
    if (valor === "Crítica") return "bg-red-600 text-white";
    if (valor === "Alta") return "bg-red-500/10 text-red-300";
    if (valor === "Média") return "bg-yellow-500/10 text-yellow-300";
    return "bg-emerald-500/10 text-emerald-300";
  }

  return (
    <AuthGuard>
      <main className="flex min-h-screen bg-slate-950">
        <Sidebar />

        <section className="flex-1 px-4 py-5 sm:p-6">
          <div className="mb-5 rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl sm:mb-8 sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none xl:flex xl:items-end xl:justify-between">
            <div>
              <h1 className="text-3xl font-black text-white sm:text-4xl">
                Arquivo Operacional
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-400 sm:text-base">
                Histórico de ocorrências arquivadas para consulta, auditoria e
                controle operacional.
              </p>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-xs font-bold text-slate-300 sm:mt-0 sm:text-sm">
              Somente ocorrências arquivadas
            </div>
          </div>

          <div className="mb-5 grid grid-cols-3 gap-3 sm:mb-6 sm:gap-4">
            <ResumoCard
              label="Arquivadas"
              value={ocorrencias.length}
              icon={<Archive size={20} />}
            />

            <ResumoCard
              label="Alta prioridade"
              value={criticas}
              icon={<ShieldAlert size={20} />}
            />

            <ResumoCard
              label="Com GPS"
              value={comGps}
              icon={<MapPin size={20} />}
            />
          </div>

          {ocorrenciaAberta && (
            <div className="mb-5 rounded-3xl border border-slate-800 bg-slate-900 p-4 shadow-xl sm:p-6">
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-black text-white sm:text-xl">
                    Detalhe da ocorrência
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-slate-400 sm:text-sm">
                    {ocorrenciaAberta.tipo} • {ocorrenciaAberta.posto}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setOcorrenciaAberta(null)}
                  className="rounded-2xl border border-slate-700 px-4 py-3 text-xs font-bold text-slate-300 transition hover:bg-slate-800 sm:text-sm"
                >
                  Fechar detalhe
                </button>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 lg:col-span-2">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${corPrioridade(
                        ocorrenciaAberta.prioridade,
                      )}`}
                    >
                      {ocorrenciaAberta.prioridade}
                    </span>

                    <span className="rounded-full bg-slate-500/10 px-3 py-1 text-xs font-bold text-slate-300">
                      {ocorrenciaAberta.status}
                    </span>
                  </div>

                  <p className="text-sm leading-7 text-slate-300">
                    {ocorrenciaAberta.descricao || "Sem descrição."}
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-400 sm:text-sm">
                    <Info
                      label="Vigilante"
                      value={ocorrenciaAberta.vigilante || "-"}
                    />
                    <Info label="RE" value={ocorrenciaAberta.re || "-"} />
                    <Info label="Posto" value={ocorrenciaAberta.posto || "-"} />
                    <Info label="Data" value={ocorrenciaAberta.data || "-"} />
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => abrirGoogleMaps(ocorrenciaAberta)}
                      className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs font-bold text-red-200 transition hover:bg-red-500/20 sm:text-sm"
                    >
                      Abrir GPS no Google Maps
                    </button>

                    <button
                      type="button"
                      onClick={() => restaurarOcorrencia(ocorrenciaAberta)}
                      className="rounded-2xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white transition hover:bg-emerald-500 sm:text-sm"
                    >
                      Restaurar para operação
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  {ocorrenciaAberta.fotoUrl ? (
                    <a
                      href={ocorrenciaAberta.fotoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block overflow-hidden rounded-2xl"
                    >
                      <img
                        src={ocorrenciaAberta.fotoUrl}
                        alt={ocorrenciaAberta.tipo}
                        className="h-56 w-full object-cover"
                      />
                      <p className="mt-3 text-xs font-bold text-slate-300">
                        Clique para ampliar a evidência
                      </p>
                    </a>
                  ) : (
                    <div className="flex h-56 items-center justify-center rounded-2xl bg-slate-900 text-slate-500">
                      Sem foto
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4 shadow-xl sm:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-black text-white sm:text-xl">
                  Ocorrências arquivadas
                </h2>

                <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                  {ocorrenciasFiltradas.length} ocorrência(s) encontrada(s)
                </p>
              </div>

              <div className="relative w-full md:max-w-xs">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Pesquisar no arquivo..."
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 py-3 pl-11 pr-4 text-sm text-white outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 md:w-auto">
                <select
                  value={filtroPeriodo}
                  onChange={(e) => setFiltroPeriodo(e.target.value)}
                  className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-red-500"
                >
                  <option>Todos</option>
                  <option>Hoje</option>
                  <option>7 dias</option>
                  <option>30 dias</option>
                </select>

                <select
                  value={filtroPrioridade}
                  onChange={(e) => setFiltroPrioridade(e.target.value)}
                  className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-red-500"
                >
                  <option>Todas</option>
                  <option>Baixa</option>
                  <option>Média</option>
                  <option>Alta</option>
                  <option>Crítica</option>
                </select>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:mt-6 sm:gap-4 md:grid-cols-2">
              {ocorrenciasFiltradas.length === 0 && (
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 text-slate-400">
                  Nenhuma ocorrência arquivada encontrada.
                </div>
              )}

              {ocorrenciasPaginadas.map((ocorrencia) => (
                <div
                  key={ocorrencia.id}
                  className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-xl"
                >
                  {ocorrencia.fotoUrl ? (
                    <img
                      src={ocorrencia.fotoUrl}
                      alt={ocorrencia.tipo}
                      className="h-32 w-full object-cover sm:h-40"
                    />
                  ) : (
                    <div className="flex h-32 w-full items-center justify-center bg-slate-900 text-slate-500 sm:h-40">
                      <Archive size={38} />
                    </div>
                  )}

                  <div className="min-w-0 p-4 sm:p-5">
                    <div className="mb-3 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="text-sm font-black text-white sm:text-base">
                        {ocorrencia.tipo}
                      </h3>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${corPrioridade(
                          ocorrencia.prioridade,
                        )}`}
                      >
                        {ocorrencia.prioridade}
                      </span>
                    </div>

                    <p className="mb-2 flex items-center gap-2 text-xs text-slate-400 sm:text-sm">
                      <MapPin size={15} />
                      {ocorrencia.posto}
                    </p>

                    {ocorrencia.vigilante && (
                      <p className="mb-2 flex items-center gap-2 text-xs text-slate-400 sm:text-sm">
                        <UserRound size={15} />
                        {ocorrencia.vigilante}{" "}
                        {ocorrencia.re ? `• RE ${ocorrencia.re}` : ""}
                      </p>
                    )}

                    {ocorrencia.data && (
                      <p className="mb-3 flex items-center gap-2 text-xs text-slate-500 sm:text-sm">
                        <Clock3 size={15} />
                        {ocorrencia.data}
                      </p>
                    )}

                    <p className="line-clamp-3 text-xs leading-6 text-slate-300 sm:text-sm">
                      {ocorrencia.descricao}
                    </p>

                    <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => setOcorrenciaAberta(ocorrencia)}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-3 text-xs font-bold text-red-200 transition hover:bg-red-500/20 sm:text-sm"
                      >
                        <Eye size={16} />
                        Ver detalhes
                      </button>

                      <button
                        type="button"
                        onClick={() => restaurarOcorrencia(ocorrencia)}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-3 py-3 text-xs font-bold text-white transition hover:bg-emerald-500 sm:text-sm"
                      >
                        <RotateCcw size={16} />
                        Restaurar
                      </button>
                    </div>

                    <span className="mt-3 inline-flex rounded-full bg-slate-500/10 px-3 py-1 text-xs font-bold text-slate-300">
                      Arquivada
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {totalPaginas > 1 && (
              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <button
                  type="button"
                  disabled={paginaAtual === 1}
                  onClick={() =>
                    setPaginaAtual((prev) => Math.max(prev - 1, 1))
                  }
                  className="w-full rounded-2xl border border-slate-700 px-4 py-3 text-sm font-bold text-slate-300 transition hover:bg-slate-800 disabled:opacity-40 sm:w-auto"
                >
                  Anterior
                </button>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  {Array.from({ length: totalPaginas }).map((_, index) => {
                    const pagina = index + 1;

                    return (
                      <button
                        key={pagina}
                        type="button"
                        onClick={() => setPaginaAtual(pagina)}
                        className={`h-10 w-10 rounded-2xl text-sm font-black transition ${
                          paginaAtual === pagina
                            ? "bg-red-600 text-white"
                            : "border border-slate-700 text-slate-300 hover:bg-slate-800"
                        }`}
                      >
                        {pagina}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  disabled={paginaAtual === totalPaginas}
                  onClick={() =>
                    setPaginaAtual((prev) => Math.min(prev + 1, totalPaginas))
                  }
                  className="w-full rounded-2xl border border-slate-700 px-4 py-3 text-sm font-bold text-slate-300 transition hover:bg-slate-800 disabled:opacity-40 sm:w-auto"
                >
                  Próxima
                </button>

                <p className="text-xs font-bold text-slate-500 sm:ml-2">
                  Página {paginaAtual} de {totalPaginas}
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
    </AuthGuard>
  );
}

function ResumoCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-3 shadow-xl sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="min-h-8 text-[11px] font-bold leading-4 text-slate-400 sm:min-h-0 sm:text-sm">
            {label}
          </p>
          <h3 className="mt-1 text-3xl font-black text-white sm:mt-2">
            {value}
          </h3>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 sm:h-12 sm:w-12">
          {icon}
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3">
      <p className="text-[11px] text-slate-500 sm:text-xs">{label}</p>
      <h3 className="mt-1 text-xs font-bold text-white sm:text-sm">{value}</h3>
    </div>
  );
}
