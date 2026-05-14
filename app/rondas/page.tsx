"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import {
  CheckCircle2,
  Eye,
  Image as ImageIcon,
  Loader2,
  MapPinned,
  MapPin,
  Play,
  Plus,
  Radar,
  RefreshCw,
  Search,
  StopCircle,
  X,
} from "lucide-react";

import { AuthGuard } from "../../components/AuthGuard";
import { Sidebar } from "../../components/Sidebar";
import { db } from "../../lib/firebase";

type PontoRonda = {
  data: string;
  latitude: number;
  longitude: number;
};

type FotoRonda = {
  url: string;
  data: string;
  tipo?: string;
};

type Ronda = {
  id: string;
  re: string;
  vigilante: string;
  posto: string;
  turno: string;
  status: string;
  observacoes: string;
  inicioEm?: string;
  finalizadaEm?: string;
  pontos?: PontoRonda[];
  fotos?: FotoRonda[];
};

type Vigilante = {
  id: string;
  re: string;
  nome: string;
  status: string;
};

type Posto = {
  id: string;
  nome: string;
};

export default function RondasPage() {
  const [rondas, setRondas] = useState<Ronda[]>([]);
  const [vigilantes, setVigilantes] = useState<Vigilante[]>([]);
  const [postos, setPostos] = useState<Posto[]>([]);

  const [vigilanteSelecionadoId, setVigilanteSelecionadoId] = useState("");
  const [postoSelecionadoId, setPostoSelecionadoId] = useState("");

  const [re, setRe] = useState("");
  const [vigilante, setVigilante] = useState("");
  const [posto, setPosto] = useState("");
  const [turno, setTurno] = useState("Diurno");
  const [status, setStatus] = useState("Pendente");
  const [observacoes, setObservacoes] = useState("");

  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(false);
  const [rondaSelecionada, setRondaSelecionada] = useState<Ronda | null>(null);

  function atualizarRondasEmTela(lista: Ronda[]) {
    setRondas(lista);

    setRondaSelecionada((selecionadaAtual) => {
      if (!selecionadaAtual) return null;

      const atualizada = lista.find((item) => item.id === selecionadaAtual.id);

      return atualizada || null;
    });
  }

  async function carregarRondas() {
    const q = query(collection(db, "rondas"), orderBy("criadoEm", "desc"));
    const snapshot = await getDocs(q);

    const lista = snapshot.docs.map((docItem) => ({
      id: docItem.id,
      ...docItem.data(),
    })) as Ronda[];

    atualizarRondasEmTela(lista);
  }

  async function carregarVigilantes() {
    const q = query(collection(db, "vigilantes"), orderBy("nome", "asc"));
    const snapshot = await getDocs(q);

    const lista = snapshot.docs.map((docItem) => ({
      id: docItem.id,
      ...docItem.data(),
    })) as Vigilante[];

    setVigilantes(lista);
  }

  async function carregarPostos() {
    const q = query(collection(db, "postos"), orderBy("nome", "asc"));
    const snapshot = await getDocs(q);

    const lista = snapshot.docs.map((docItem) => ({
      id: docItem.id,
      ...docItem.data(),
    })) as Posto[];

    setPostos(lista);
  }

  useEffect(() => {
    carregarVigilantes();
    carregarPostos();

    const q = query(collection(db, "rondas"), orderBy("criadoEm", "desc"));

    const cancelarEscuta = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      })) as Ronda[];

      atualizarRondasEmTela(lista);
    });

    return () => cancelarEscuta();
  }, []);

  const rondasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) return rondas;

    return rondas.filter((ronda) => {
      return (
        (ronda.re || "").toLowerCase().includes(termo) ||
        (ronda.vigilante || "").toLowerCase().includes(termo) ||
        (ronda.posto || "").toLowerCase().includes(termo) ||
        (ronda.turno || "").toLowerCase().includes(termo) ||
        (ronda.status || "").toLowerCase().includes(termo) ||
        (ronda.observacoes || "").toLowerCase().includes(termo)
      );
    });
  }, [busca, rondas]);

  const totalPontos = useMemo(() => {
    return rondas.reduce(
      (total, ronda) => total + (ronda.pontos?.length || 0),
      0,
    );
  }, [rondas]);

  const rondasEmAndamento = useMemo(() => {
    return rondas.filter((ronda) => ronda.status === "Em andamento").length;
  }, [rondas]);

  const rondaParaMapa =
    rondaSelecionada ||
    rondasFiltradas.find((item) => (item.pontos?.length || 0) > 0) ||
    null;

  function selecionarVigilante(id: string) {
    setVigilanteSelecionadoId(id);

    const escolhido = vigilantes.find((item) => item.id === id);

    if (!escolhido) {
      setRe("");
      setVigilante("");
      return;
    }

    setRe(escolhido.re || "");
    setVigilante(escolhido.nome || "");
  }

  function selecionarPosto(id: string) {
    setPostoSelecionadoId(id);

    const escolhido = postos.find((item) => item.id === id);

    if (!escolhido) {
      setPosto("");
      return;
    }

    setPosto(escolhido.nome || "");
  }

  function obterLocalizacao(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("GPS não disponível."));
        return;
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      });
    });
  }

  async function cadastrarRonda(e: React.FormEvent) {
    e.preventDefault();

    if (!re || !vigilante || !posto) {
      alert("Selecione o vigilante e o posto.");
      return;
    }

    try {
      setLoading(true);

      await addDoc(collection(db, "rondas"), {
        re,
        vigilante,
        posto,
        turno,
        status,
        observacoes,
        pontos: [],
        fotos: [],
        criadoEm: serverTimestamp(),
      });

      setVigilanteSelecionadoId("");
      setPostoSelecionadoId("");
      setRe("");
      setVigilante("");
      setPosto("");
      setTurno("Diurno");
      setStatus("Pendente");
      setObservacoes("");

      await carregarRondas();

      alert("Ronda registrada com sucesso!");
    } catch (error) {
      console.error(error);
      alert("Erro ao registrar ronda.");
    } finally {
      setLoading(false);
    }
  }

  async function iniciarRonda(ronda: Ronda) {
    try {
      const posicao = await obterLocalizacao();

      await updateDoc(doc(db, "rondas", ronda.id), {
        status: "Em andamento",
        inicioEm: new Date().toLocaleString("pt-BR"),
        pontos: arrayUnion({
          data: new Date().toLocaleString("pt-BR"),
          latitude: posicao.coords.latitude,
          longitude: posicao.coords.longitude,
        }),
        atualizadoEm: serverTimestamp(),
      });

      await carregarRondas();

      alert("Ronda iniciada!");
    } catch (error) {
      console.error(error);
      alert("Erro ao iniciar ronda. Verifique a permissão de localização.");
    }
  }

  async function registrarPonto(ronda: Ronda) {
    try {
      const posicao = await obterLocalizacao();

      await updateDoc(doc(db, "rondas", ronda.id), {
        pontos: arrayUnion({
          data: new Date().toLocaleString("pt-BR"),
          latitude: posicao.coords.latitude,
          longitude: posicao.coords.longitude,
        }),
        atualizadoEm: serverTimestamp(),
      });

      await carregarRondas();

      alert("Ponto GPS registrado!");
    } catch (error) {
      console.error(error);
      alert("Erro ao registrar ponto. Verifique a permissão de localização.");
    }
  }

  async function finalizarRonda(ronda: Ronda) {
    try {
      const posicao = await obterLocalizacao();

      await updateDoc(doc(db, "rondas", ronda.id), {
        status: "Concluída",
        finalizadaEm: new Date().toLocaleString("pt-BR"),
        pontos: arrayUnion({
          data: new Date().toLocaleString("pt-BR"),
          latitude: posicao.coords.latitude,
          longitude: posicao.coords.longitude,
        }),
        atualizadoEm: serverTimestamp(),
      });

      await carregarRondas();

      alert("Ronda finalizada!");
    } catch (error) {
      console.error(error);
      alert("Erro ao finalizar ronda. Verifique a permissão de localização.");
    }
  }

  async function excluirRonda(id: string) {
    const confirmar = confirm("Deseja remover esta ronda?");

    if (!confirmar) return;

    try {
      await deleteDoc(doc(db, "rondas", id));

      if (rondaSelecionada?.id === id) {
        setRondaSelecionada(null);
      }

      await carregarRondas();

      alert("Ronda removida!");
    } catch (error) {
      console.error(error);
      alert("Erro ao remover.");
    }
  }

  function corStatus(valor: string) {
    if (valor === "Concluída") return "bg-emerald-500/10 text-emerald-300";
    if (valor === "Arquivada") return "bg-slate-500/10 text-slate-300";
    if (valor === "Atrasada") return "bg-red-500/10 text-red-300";
    if (valor === "Em andamento") return "bg-blue-500/10 text-blue-300";

    return "bg-yellow-500/10 text-yellow-300";
  }

  return (
    <AuthGuard>
      <main className="flex min-h-screen bg-slate-950">
        <Sidebar />

        <section className="flex-1 px-4 py-5 sm:p-6">
          <div className="mb-5 rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl sm:mb-8 sm:flex sm:flex-col sm:gap-4 sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h1 className="text-3xl font-black text-white sm:text-4xl">
                Rondas
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-400 sm:text-base">
                Controle operacional com GPS, fotos e mapa em tempo real.
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-0 sm:flex sm:flex-row">
              <div className="flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-xs font-bold text-emerald-300 sm:px-5 sm:text-sm xl:w-auto">
                <Radar size={16} />
                Tempo real ativo
              </div>

              <button
                type="button"
                onClick={carregarRondas}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-xs font-bold text-slate-200 transition hover:bg-slate-800 sm:px-5 sm:text-sm xl:w-auto"
              >
                <RefreshCw size={16} />
                Atualizar
              </button>
            </div>
          </div>

          <div className="mb-5 grid grid-cols-3 gap-3 sm:mb-6 sm:gap-4 md:grid-cols-3">
            <ResumoCard
              label="Rondas registradas"
              value={rondas.length}
              icon={<Radar size={20} />}
            />
            <ResumoCard
              label="Em andamento"
              value={rondasEmAndamento}
              icon={<Play size={20} />}
            />
            <ResumoCard
              label="Pontos GPS"
              value={totalPontos}
              icon={<MapPin size={20} />}
            />
          </div>

          <div className="mb-5 rounded-3xl border border-slate-800 bg-slate-900 p-4 shadow-xl sm:mb-6 sm:p-6">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-black text-white sm:text-xl">
                  <MapPinned size={20} className="text-red-400" />
                  Mapa operacional
                </h2>

                <p className="mt-1 text-xs leading-5 text-slate-400 sm:text-sm">
                  {rondaParaMapa
                    ? `${rondaParaMapa.vigilante} • ${rondaParaMapa.posto}`
                    : "Selecione uma ronda com pontos GPS para visualizar no mapa."}
                </p>
              </div>

              {rondaSelecionada && (
                <button
                  type="button"
                  onClick={() => setRondaSelecionada(null)}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-slate-700 px-4 py-3 text-xs font-bold text-slate-300 transition hover:bg-slate-800 sm:py-2 sm:text-sm"
                >
                  <X size={16} />
                  Limpar seleção
                </button>
              )}
            </div>

            <RondaMapa ronda={rondaParaMapa} />

            {rondaParaMapa && (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-5 sm:gap-4 md:grid-cols-4">
                <InfoMapa
                  label="Status"
                  value={rondaParaMapa.status || "Não informado"}
                />
                <InfoMapa
                  label="Pontos GPS"
                  value={`${rondaParaMapa.pontos?.length || 0}`}
                />
                <InfoMapa
                  label="Fotos"
                  value={`${rondaParaMapa.fotos?.length || 0}`}
                />
                <InfoMapa
                  label="Último sinal"
                  value={
                    rondaParaMapa.pontos?.[rondaParaMapa.pontos.length - 1]
                      ?.data || "Sem sinal"
                  }
                />
              </div>
            )}

            {rondaParaMapa?.fotos && rondaParaMapa.fotos.length > 0 && (
              <div className="mt-5">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
                  <ImageIcon size={16} />
                  Evidências fotográficas
                </h3>

                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {rondaParaMapa.fotos.map((foto, index) => (
                    <a
                      key={`${foto.url}-${index}`}
                      href={foto.url}
                      target="_blank"
                      rel="noreferrer"
                      className="group overflow-hidden rounded-2xl border border-slate-800 bg-slate-950"
                    >
                      <img
                        src={foto.url}
                        alt={`Foto da ronda ${index + 1}`}
                        className="h-28 w-full object-cover transition group-hover:scale-105"
                      />

                      <div className="p-3">
                        <p className="text-xs font-bold text-slate-200">
                          {foto.tipo
                            ? `Foto: ${foto.tipo}`
                            : `Foto ${index + 1}`}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          {foto.data || "Sem data"}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-5 xl:grid-cols-3">
            <form
              onSubmit={cadastrarRonda}
              className="rounded-3xl border border-slate-800 bg-slate-900 p-4 shadow-xl sm:p-6 xl:col-span-1"
            >
              <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-white sm:mb-5 sm:text-xl">
                <Plus size={20} />
                Nova ronda
              </h2>

              <div className="space-y-3 sm:space-y-4">
                <select
                  value={vigilanteSelecionadoId}
                  onChange={(e) => selecionarVigilante(e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-red-500"
                >
                  <option value="">Selecione o vigilante</option>

                  {vigilantes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.re ? `RE ${item.re} - ` : ""}
                      {item.nome}
                      {item.status ? ` (${item.status})` : ""}
                    </option>
                  ))}
                </select>

                <input
                  value={re}
                  readOnly
                  placeholder="RE preenchido automaticamente"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-300 outline-none"
                />

                <input
                  value={vigilante}
                  readOnly
                  placeholder="Nome preenchido automaticamente"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-300 outline-none"
                />

                <select
                  value={postoSelecionadoId}
                  onChange={(e) => selecionarPosto(e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-red-500"
                >
                  <option value="">Selecione o posto</option>

                  {postos.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nome}
                    </option>
                  ))}
                </select>

                <input
                  value={posto}
                  readOnly
                  placeholder="Posto preenchido automaticamente"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-300 outline-none"
                />

                <select
                  value={turno}
                  onChange={(e) => setTurno(e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-red-500"
                >
                  <option>Diurno</option>
                  <option>Noturno</option>
                  <option>Madrugada</option>
                  <option>Extra</option>
                </select>

                <textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Observações da ronda"
                  rows={4}
                  className="w-full resize-none rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-red-500"
                />

                <button
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-500 disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Salvando...
                    </>
                  ) : (
                    "Registrar ronda"
                  )}
                </button>
              </div>
            </form>

            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4 shadow-xl sm:p-6 xl:col-span-2">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-black text-white sm:text-xl">
                    Rondas registradas
                  </h2>

                  <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                    {rondasFiltradas.length} encontrada(s)
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
                    placeholder="Pesquisar RE, vigilante..."
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 py-3 pl-11 pr-4 text-white outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:mt-6 sm:gap-4 md:grid-cols-2">
                {rondasFiltradas.length === 0 && (
                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 text-slate-400">
                    Nenhuma ronda encontrada.
                  </div>
                )}

                {rondasFiltradas.map((ronda) => (
                  <div
                    key={ronda.id}
                    className={`relative rounded-3xl border p-4 transition sm:p-5 ${
                      rondaSelecionada?.id === ronda.id
                        ? "border-red-500/60 bg-red-500/5"
                        : "border-slate-800 bg-slate-950"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => excluirRonda(ronda.id)}
                      className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-red-500/10 text-red-400 transition hover:bg-red-600 hover:text-white"
                    >
                      ×
                    </button>

                    <div className="flex items-start gap-3 pr-8 sm:gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-800 text-red-400 sm:h-14 sm:w-14">
                        <Radar size={20} />
                      </div>

                      <div>
                        <h3 className="text-sm font-black text-white sm:text-base">
                          {ronda.vigilante}
                        </h3>

                        <p className="text-xs font-bold text-red-300 sm:text-sm">
                          RE: {ronda.re || "Não informado"}
                        </p>

                        <p className="mt-1 flex items-center gap-1 text-xs text-slate-400 sm:text-sm">
                          <MapPin size={14} />
                          {ronda.posto}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-300 sm:mt-5 sm:block sm:space-y-2 sm:text-sm">
                      <p>
                        <span className="text-slate-500">Turno:</span>{" "}
                        {ronda.turno}
                      </p>

                      {ronda.inicioEm && (
                        <p>
                          <span className="text-slate-500">Início:</span>{" "}
                          {ronda.inicioEm}
                        </p>
                      )}

                      {ronda.finalizadaEm && (
                        <p>
                          <span className="text-slate-500">Finalizada:</span>{" "}
                          {ronda.finalizadaEm}
                        </p>
                      )}

                      <p>
                        <span className="text-slate-500">Pontos GPS:</span>{" "}
                        {ronda.pontos?.length || 0}
                      </p>

                      <p>
                        <span className="text-slate-500">Fotos:</span>{" "}
                        {ronda.fotos?.length || 0}
                      </p>

                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${corStatus(
                          ronda.status,
                        )}`}
                      >
                        {ronda.status}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-5 sm:grid-cols-1">
                      <button
                        type="button"
                        onClick={() => setRondaSelecionada(ronda)}
                        className="flex items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-3 text-xs font-bold text-red-200 transition hover:bg-red-500/20 sm:px-4 sm:text-sm"
                      >
                        <Eye size={16} />
                        Ver no mapa
                      </button>

                      {ronda.status === "Pendente" && (
                        <button
                          type="button"
                          onClick={() => iniciarRonda(ronda)}
                          className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-3 py-3 text-xs font-bold text-white transition hover:bg-blue-500 sm:px-4 sm:text-sm"
                        >
                          <Play size={16} />
                          Iniciar ronda
                        </button>
                      )}

                      {ronda.status === "Em andamento" && (
                        <>
                          <button
                            type="button"
                            onClick={() => registrarPonto(ronda)}
                            className="flex items-center justify-center gap-2 rounded-2xl border border-slate-700 px-3 py-3 text-xs font-bold text-slate-200 transition hover:bg-slate-800 sm:px-4 sm:text-sm"
                          >
                            <MapPin size={16} />
                            Registrar ponto GPS
                          </button>

                          <button
                            type="button"
                            onClick={() => finalizarRonda(ronda)}
                            className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-3 py-3 text-xs font-bold text-white transition hover:bg-emerald-500 sm:px-4 sm:text-sm"
                          >
                            <StopCircle size={16} />
                            Finalizar ronda
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
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

function InfoMapa({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3 sm:p-4">
      <p className="text-[11px] text-slate-500 sm:text-xs">{label}</p>
      <h3 className="mt-1 text-xs font-bold text-white sm:text-base">
        {value}
      </h3>
    </div>
  );
}

function RondaMapa({ ronda }: { ronda: Ronda | null }) {
  const mapaRef = useRef<HTMLDivElement | null>(null);
  const instanciaRef = useRef<any>(null);
  const camadasRef = useRef<any[]>([]);

  useEffect(() => {
    let ativo = true;

    async function montarMapa() {
      if (!mapaRef.current) return;

      const leaflet = await import("leaflet");

      if (!ativo || !mapaRef.current) return;

      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      const pontosValidos =
        ronda?.pontos?.filter(
          (ponto) =>
            typeof ponto.latitude === "number" &&
            typeof ponto.longitude === "number",
        ) || [];

      const centro = pontosValidos[0]
        ? ([pontosValidos[0].latitude, pontosValidos[0].longitude] as [
            number,
            number,
          ])
        : ([-23.55052, -46.633308] as [number, number]);

      if (!instanciaRef.current) {
        instanciaRef.current = leaflet.map(mapaRef.current, {
          center: centro,
          zoom: pontosValidos.length > 0 ? 17 : 11,
          zoomControl: true,
        });

        leaflet
          .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 20,
            attribution: "&copy; OpenStreetMap",
          })
          .addTo(instanciaRef.current);
      }

      camadasRef.current.forEach((camada) => camada.remove());
      camadasRef.current = [];

      if (pontosValidos.length === 0) {
        instanciaRef.current.setView(centro, 11);
        return;
      }

      const coordenadas = pontosValidos.map(
        (ponto) => [ponto.latitude, ponto.longitude] as [number, number],
      );

      coordenadas.forEach((coordenada, index) => {
        const ponto = pontosValidos[index];

        const marcador = leaflet
          .circleMarker(coordenada, {
            radius: index === coordenadas.length - 1 ? 9 : 7,
            color: index === coordenadas.length - 1 ? "#dc2626" : "#2563eb",
            fillColor: index === coordenadas.length - 1 ? "#dc2626" : "#2563eb",
            fillOpacity: 0.9,
            weight: 3,
          })
          .addTo(instanciaRef.current)
          .bindPopup(
            `<strong>${index === 0 ? "Início" : `Ponto ${index + 1}`}</strong><br/>${ponto.data || "Sem data"}<br/>${ronda?.posto || ""}`,
          );

        camadasRef.current.push(marcador);
      });

      if (coordenadas.length > 1) {
        const linha = leaflet
          .polyline(coordenadas, {
            color: "#dc2626",
            weight: 4,
            opacity: 0.85,
          })
          .addTo(instanciaRef.current);

        camadasRef.current.push(linha);

        instanciaRef.current.fitBounds(linha.getBounds(), {
          padding: [30, 30],
        });
      } else {
        instanciaRef.current.setView(coordenadas[0], 18);
      }

      setTimeout(() => {
        instanciaRef.current?.invalidateSize();
      }, 250);
    }

    montarMapa();

    return () => {
      ativo = false;
    };
  }, [ronda]);

  useEffect(() => {
    return () => {
      if (instanciaRef.current) {
        instanciaRef.current.remove();
        instanciaRef.current = null;
      }
    };
  }, []);

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950">
      <div ref={mapaRef} className="h-[260px] w-full sm:h-[360px]" />

      {!ronda && (
        <div className="border-t border-slate-800 p-4 text-sm text-slate-400">
          Nenhuma ronda com GPS selecionada.
        </div>
      )}
    </div>
  );
}
