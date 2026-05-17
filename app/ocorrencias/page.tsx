"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  addDoc,
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
  AlertTriangle,
  Camera,
  Clock3,
  Edit,
  Eye,
  FileWarning,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Plus,
  Search,
  ShieldAlert,
  UserRound,
  X,
} from "lucide-react";

import { AuthGuard } from "../../components/AuthGuard";
import { Sidebar } from "../../components/Sidebar";
import { db } from "../../lib/firebase";
import { uploadImage } from "../../services/cloudinary";

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

type Posto = {
  id: string;
  nome: string;
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

export default function OcorrenciasPage() {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [postos, setPostos] = useState<Posto[]>([]);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [ocorrenciaSelecionada, setOcorrenciaSelecionada] =
    useState<Ocorrencia | null>(null);

  const [tipo, setTipo] = useState("Ronda irregular");
  const [postoSelecionadoId, setPostoSelecionadoId] = useState("");
  const [posto, setPosto] = useState("");
  const [prioridade, setPrioridade] = useState("Baixa");
  const [status, setStatus] = useState("Aberta");
  const [descricao, setDescricao] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [fotoAtualUrl, setFotoAtualUrl] = useState("");
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(false);

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
    carregarPostos();

    const q = query(collection(db, "ocorrencias"), orderBy("criadoEm", "desc"));

    const cancelarEscuta = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      })) as Ocorrencia[];

      setOcorrencias(lista);

      setOcorrenciaSelecionada((selecionadaAtual) => {
        if (!selecionadaAtual) return lista[0] || null;

        return (
          lista.find((item) => item.id === selecionadaAtual.id) ||
          lista[0] ||
          null
        );
      });
    });

    return () => cancelarEscuta();
  }, []);

  const ocorrenciasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) return ocorrencias;

    return ocorrencias.filter((ocorrencia) => {
      return (
        (ocorrencia.tipo || "").toLowerCase().includes(termo) ||
        (ocorrencia.posto || "").toLowerCase().includes(termo) ||
        (ocorrencia.prioridade || "").toLowerCase().includes(termo) ||
        (ocorrencia.status || "").toLowerCase().includes(termo) ||
        (ocorrencia.descricao || "").toLowerCase().includes(termo) ||
        (ocorrencia.re || "").toLowerCase().includes(termo) ||
        (ocorrencia.vigilante || "").toLowerCase().includes(termo)
      );
    });
  }, [busca, ocorrencias]);

  const abertas = useMemo(() => {
    return ocorrencias.filter((item) => item.status === "Aberta").length;
  }, [ocorrencias]);

  const criticas = useMemo(() => {
    return ocorrencias.filter(
      (item) => item.prioridade === "Crítica" || item.prioridade === "Alta",
    ).length;
  }, [ocorrencias]);

  const comGps = useMemo(() => {
    return ocorrencias.filter((item) => obterCoordenadaOcorrencia(item)).length;
  }, [ocorrencias]);

  function selecionarPosto(id: string) {
    setPostoSelecionadoId(id);

    const escolhido = postos.find((item) => item.id === id);

    if (!escolhido) {
      setPosto("");
      return;
    }

    setPosto(escolhido.nome || "");
  }

  function escolherFoto(file: File | null) {
    if (!file) return;

    setFoto(file);
    setPreview(URL.createObjectURL(file));
  }

  function limparFormulario() {
    setEditandoId(null);
    setTipo("Ronda irregular");
    setPostoSelecionadoId("");
    setPosto("");
    setPrioridade("Baixa");
    setStatus("Aberta");
    setDescricao("");
    setFoto(null);
    setPreview("");
    setFotoAtualUrl("");
  }

  function editarOcorrencia(ocorrencia: Ocorrencia) {
    setEditandoId(ocorrencia.id);
    setTipo(ocorrencia.tipo);
    setPosto(ocorrencia.posto);
    setPostoSelecionadoId("");
    setPrioridade(ocorrencia.prioridade);
    setStatus(ocorrencia.status);
    setDescricao(ocorrencia.descricao);
    setFoto(null);
    setPreview("");
    setFotoAtualUrl(ocorrencia.fotoUrl || "");
  }

  async function salvarOcorrencia(e: React.FormEvent) {
    e.preventDefault();

    if (!posto || !descricao) {
      alert("Selecione o posto e preencha a descrição da ocorrência.");
      return;
    }

    try {
      setLoading(true);

      let fotoUrl = fotoAtualUrl;

      if (foto) {
        fotoUrl = await uploadImage(foto);
      }

      if (editandoId) {
        await updateDoc(doc(db, "ocorrencias", editandoId), {
          tipo,
          posto,
          prioridade,
          status,
          descricao,
          fotoUrl,
          atualizadoEm: serverTimestamp(),
        });

        alert("Ocorrência atualizada com sucesso!");
      } else {
        await addDoc(collection(db, "ocorrencias"), {
          tipo,
          posto,
          prioridade,
          status,
          descricao,
          fotoUrl,
          origem: "Painel gestor",
          data: new Date().toLocaleString("pt-BR"),
          criadoEm: serverTimestamp(),
          atualizadoEm: serverTimestamp(),
        });

        alert("Ocorrência registrada com sucesso!");
      }

      limparFormulario();
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar ocorrência.");
    } finally {
      setLoading(false);
    }
  }

  async function excluirOcorrencia(id: string) {
    const confirmar = confirm("Deseja remover esta ocorrência?");

    if (!confirmar) return;

    try {
      await deleteDoc(doc(db, "ocorrencias", id));

      if (ocorrenciaSelecionada?.id === id) {
        setOcorrenciaSelecionada(null);
      }

      alert("Ocorrência removida com sucesso!");
    } catch (error) {
      console.error(error);
      alert("Erro ao remover ocorrência.");
    }
  }

  async function alterarStatus(ocorrencia: Ocorrencia, novoStatus: string) {
    try {
      await updateDoc(doc(db, "ocorrencias", ocorrencia.id), {
        status: novoStatus,
        atualizadoEm: serverTimestamp(),
      });
    } catch (error) {
      console.error(error);
      alert("Erro ao alterar status da ocorrência.");
    }
  }

  function corStatus(valor: string) {
    if (valor === "Aberta") return "bg-red-500/10 text-red-300";
    if (valor === "Finalizada") return "bg-emerald-500/10 text-emerald-300";
    if (valor === "Arquivada") return "bg-slate-500/10 text-slate-300";

    return "bg-yellow-500/10 text-yellow-300";
  }

  function corPrioridade(valor: string) {
    if (valor === "Crítica") return "bg-red-600 text-white";
    if (valor === "Alta") return "bg-red-500/10 text-red-300";
    if (valor === "Média") return "bg-yellow-500/10 text-yellow-300";
    return "bg-emerald-500/10 text-emerald-300";
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

  return (
    <AuthGuard>
      <main className="flex min-h-screen bg-slate-950">
        <Sidebar />

        <section className="flex-1 px-4 py-5 sm:p-6">
          <div className="mb-5 rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl sm:mb-8 sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none xl:flex xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h1 className="text-3xl font-black text-white sm:text-4xl">
                Ocorrências
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-400 sm:text-base">
                Central de ocorrências com evidências, GPS e monitoramento em
                tempo real.
              </p>
            </div>

            <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-xs font-bold text-emerald-300 sm:mt-0 sm:text-sm">
              Atualização em tempo real ativa
            </div>
          </div>

          <div className="mb-5 grid grid-cols-3 gap-3 sm:mb-6 sm:gap-4 md:grid-cols-3">
            <ResumoCard
              label="Ocorrências abertas"
              value={abertas}
              icon={<ShieldAlert size={20} />}
            />

            <ResumoCard
              label="Alta prioridade"
              value={criticas}
              icon={<AlertTriangle size={20} />}
            />

            <ResumoCard
              label="Com GPS"
              value={comGps}
              icon={<MapPin size={20} />}
            />
          </div>

          <div className="mb-5 rounded-3xl border border-slate-800 bg-slate-900 p-4 shadow-xl sm:mb-6 sm:p-6">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-black text-white sm:text-xl">
                  <MapPin size={20} className="text-red-400" />
                  Mapa da ocorrência
                </h2>

                <p className="mt-1 text-xs leading-5 text-slate-400 sm:text-sm">
                  {ocorrenciaSelecionada
                    ? `${ocorrenciaSelecionada.tipo} • ${ocorrenciaSelecionada.posto}`
                    : "Selecione uma ocorrência com GPS para visualizar."}
                </p>
              </div>

              {ocorrenciaSelecionada && (
                <button
                  type="button"
                  onClick={() => abrirGoogleMaps(ocorrenciaSelecionada)}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-3 text-xs font-bold text-red-200 transition hover:bg-red-500/20 sm:px-4 sm:text-sm"
                >
                  <MapPin size={16} />
                  Abrir no Google Maps
                </button>
              )}
            </div>

            <OcorrenciaMapa ocorrencia={ocorrenciaSelecionada} />

            {ocorrenciaSelecionada && (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-5 sm:gap-4 md:grid-cols-4">
                <InfoMapa
                  label="Vigilante"
                  value={ocorrenciaSelecionada.vigilante || "Não informado"}
                />
                <InfoMapa
                  label="RE"
                  value={ocorrenciaSelecionada.re || "Não informado"}
                />
                <InfoMapa
                  label="Prioridade"
                  value={ocorrenciaSelecionada.prioridade || "Não informado"}
                />
                <InfoMapa
                  label="Data"
                  value={ocorrenciaSelecionada.data || "Não informado"}
                />
              </div>
            )}

            {ocorrenciaSelecionada?.fotoUrl && (
              <div className="mt-5">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
                  <ImageIcon size={16} />
                  Evidência fotográfica
                </h3>

                <a
                  href={ocorrenciaSelecionada.fotoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 md:max-w-sm"
                >
                  <img
                    src={ocorrenciaSelecionada.fotoUrl}
                    alt={ocorrenciaSelecionada.tipo}
                    className="h-44 w-full object-cover sm:h-52"
                  />

                  <div className="p-3 text-xs font-bold text-slate-300">
                    Clique para ampliar
                  </div>
                </a>
              </div>
            )}
          </div>

          <div className="grid gap-5 xl:grid-cols-3">
            <form
              onSubmit={salvarOcorrencia}
              className="rounded-3xl border border-slate-800 bg-slate-900 p-4 shadow-xl sm:p-6 xl:col-span-1"
            >
              <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-white sm:mb-5 sm:text-xl">
                {editandoId ? <Edit size={20} /> : <Plus size={20} />}
                {editandoId ? "Editar ocorrência" : "Nova ocorrência"}
              </h2>

              <label className="mb-4 flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-slate-700 bg-slate-950 p-4 text-center sm:mb-5 sm:p-6">
                {preview ? (
                  <img
                    src={preview}
                    alt="Preview da ocorrência"
                    className="h-28 w-full rounded-2xl object-cover sm:h-36"
                  />
                ) : fotoAtualUrl ? (
                  <img
                    src={fotoAtualUrl}
                    alt="Foto atual da ocorrência"
                    className="h-28 w-full rounded-2xl object-cover sm:h-36"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-800 text-slate-400 sm:h-28 sm:w-28">
                    <Camera size={34} />
                  </div>
                )}

                <span className="mt-3 text-sm font-medium text-slate-300">
                  {editandoId
                    ? "Trocar evidência/foto"
                    : "Adicionar evidência/foto"}
                </span>

                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => escolherFoto(e.target.files?.[0] || null)}
                />
              </label>

              <div className="space-y-3 sm:space-y-4">
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-red-500"
                >
                  <option>Ronda irregular</option>
                  <option>Suspeita</option>
                  <option>Invasão</option>
                  <option>Furto/Roubo</option>
                  <option>Briga/Conflito</option>
                  <option>Portão/Acesso irregular</option>
                  <option>Dano patrimonial</option>
                  <option>Emergência médica</option>
                  <option>Incêndio</option>
                  <option>Falha operacional</option>
                  <option>Outro</option>
                </select>

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
                  value={prioridade}
                  onChange={(e) => setPrioridade(e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-red-500"
                >
                  <option>Baixa</option>
                  <option>Média</option>
                  <option>Alta</option>
                  <option>Crítica</option>
                </select>

                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-red-500"
                >
                  <option>Aberta</option>
                  <option>Finalizada</option>
                  <option>Arquivada</option>
                </select>

                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Descreva a ocorrência com detalhes"
                  rows={4}
                  className="w-full resize-none rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-red-500"
                />

                <button
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-500 disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Salvando...
                    </>
                  ) : editandoId ? (
                    "Salvar alteração"
                  ) : (
                    "Registrar ocorrência"
                  )}
                </button>

                {editandoId && (
                  <button
                    type="button"
                    onClick={limparFormulario}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-700 px-5 py-3 text-sm font-bold text-slate-300 transition hover:bg-slate-800 hover:text-white"
                  >
                    <X size={18} />
                    Cancelar edição
                  </button>
                )}
              </div>
            </form>

            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4 shadow-xl sm:p-6 xl:col-span-2">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-black text-white sm:text-xl">
                    Ocorrências registradas
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
                    placeholder="Pesquisar ocorrência..."
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 py-3 pl-11 pr-4 text-white outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:mt-6 sm:gap-4 md:grid-cols-2">
                {ocorrenciasFiltradas.length === 0 && (
                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 text-slate-400">
                    Nenhuma ocorrência encontrada.
                  </div>
                )}

                {ocorrenciasFiltradas.map((ocorrencia) => (
                  <div
                    key={ocorrencia.id}
                    className={`relative overflow-hidden rounded-3xl border shadow-xl transition ${
                      ocorrenciaSelecionada?.id === ocorrencia.id
                        ? "border-red-500/60 bg-red-500/5"
                        : "border-slate-800 bg-slate-950"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => excluirOcorrencia(ocorrencia.id)}
                      className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-red-500/20 text-red-300 backdrop-blur transition hover:bg-red-600 hover:text-white"
                      title="Remover ocorrência"
                    >
                      ×
                    </button>

                    <button
                      type="button"
                      onClick={() => editarOcorrencia(ocorrencia)}
                      className="absolute right-12 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-slate-700/70 text-slate-200 backdrop-blur transition hover:bg-slate-600 hover:text-white"
                      title="Editar ocorrência"
                    >
                      <Edit size={14} />
                    </button>

                    {ocorrencia.fotoUrl ? (
                      <img
                        src={ocorrencia.fotoUrl}
                        alt={ocorrencia.tipo}
                        className="h-32 w-full object-cover sm:h-40"
                      />
                    ) : (
                      <div className="flex h-32 w-full items-center justify-center bg-slate-900 text-slate-500 sm:h-40">
                        <AlertTriangle size={40} />
                      </div>
                    )}

                    <div className="min-w-0 p-4 sm:p-5">
                      <div className="mb-3 flex flex-col items-start gap-2 pr-16 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
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
                        <AlertTriangle size={15} />
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

                      <p className="text-xs leading-6 text-slate-300 sm:text-sm">
                        {ocorrencia.descricao}
                      </p>

                      <div className="mt-4 space-y-2">
                        <button
                          type="button"
                          onClick={() => setOcorrenciaSelecionada(ocorrencia)}
                          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-3 text-xs font-bold text-red-200 transition hover:bg-red-500/20 sm:px-4 sm:text-sm"
                        >
                          <Eye size={16} />
                          Ver no mapa
                        </button>

                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {ocorrencia.status !== "Finalizada" && (
                            <button
                              type="button"
                              onClick={() =>
                                alterarStatus(ocorrencia, "Finalizada")
                              }
                              className="w-full rounded-2xl bg-emerald-600 px-3 py-3 text-xs font-bold text-white transition hover:bg-emerald-500 sm:px-4 sm:text-sm"
                            >
                              Finalizar
                            </button>
                          )}

                          {ocorrencia.status !== "Arquivada" && (
                            <button
                              type="button"
                              onClick={() =>
                                alterarStatus(ocorrencia, "Arquivada")
                              }
                              className="w-full rounded-2xl border border-slate-700 px-3 py-3 text-xs font-bold text-slate-300 transition hover:bg-slate-800 sm:px-4 sm:text-sm"
                            >
                              Arquivar
                            </button>
                          )}
                        </div>

                        <span
                          className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ${corStatus(
                            ocorrencia.status,
                          )}`}
                        >
                          {ocorrencia.status}
                        </span>
                      </div>
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

function OcorrenciaMapa({ ocorrencia }: { ocorrencia: Ocorrencia | null }) {
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

      const coordenadaOcorrencia = obterCoordenadaOcorrencia(ocorrencia);

      const centro = coordenadaOcorrencia
        ? ([coordenadaOcorrencia.latitude, coordenadaOcorrencia.longitude] as [
            number,
            number,
          ])
        : ([-23.55052, -46.633308] as [number, number]);

      if (!instanciaRef.current) {
        instanciaRef.current = leaflet.map(mapaRef.current, {
          center: centro,
          zoom: coordenadaOcorrencia ? 18 : 11,
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

      if (!coordenadaOcorrencia) {
        instanciaRef.current.setView(centro, 11);
        return;
      }

      const marcador = leaflet
        .circleMarker(centro, {
          radius: 11,
          color: "#dc2626",
          fillColor: "#dc2626",
          fillOpacity: 0.9,
          weight: 4,
        })
        .addTo(instanciaRef.current)
        .bindPopup(
          `<strong>${ocorrencia?.tipo || "Ocorrência"}</strong><br/>${ocorrencia?.posto || ""}<br/>${ocorrencia?.data || ""}`,
        );

      const raio = leaflet
        .circle(centro, {
          radius: 35,
          color: "#dc2626",
          fillColor: "#dc2626",
          fillOpacity: 0.08,
          weight: 2,
        })
        .addTo(instanciaRef.current);

      camadasRef.current.push(marcador, raio);

      instanciaRef.current.setView(centro, 18);

      setTimeout(() => {
        instanciaRef.current?.invalidateSize();
      }, 250);
    }

    montarMapa();

    return () => {
      ativo = false;
    };
  }, [ocorrencia]);

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
      <div ref={mapaRef} className="h-[240px] w-full sm:h-[340px]" />

      {!obterCoordenadaOcorrencia(ocorrencia) && (
        <div className="border-t border-slate-800 p-4 text-sm text-slate-400">
          Nenhuma localização GPS disponível para esta ocorrência.
        </div>
      )}
    </div>
  );
}
