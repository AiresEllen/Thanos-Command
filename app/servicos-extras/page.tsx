"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import {
  BriefcaseBusiness,
  CalendarDays,
  Clock3,
  Edit,
  Loader2,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { AuthGuard } from "../../components/AuthGuard";
import { Sidebar } from "../../components/Sidebar";
import { db } from "../../lib/firebase";

type Vigilante = {
  id: string;
  re: string;
  nome: string;
  telefone: string;
  posto: string;
  escala: string;
  status: string;
};

type ServicoExtra = {
  id: string;
  nomePacote: string;
  re: string;
  vigilante: string;
  telefone: string;
  postoAtual: string;
  escalaAtual: string;
  statusVigilante: string;
  localExtra: string;
  data: string;
  horaInicio: string;
  horaFim: string;
  valor: string;
  observacoes: string;
};

export default function ServicosExtrasPage() {
  const [vigilantes, setVigilantes] = useState<Vigilante[]>([]);
  const [servicos, setServicos] = useState<ServicoExtra[]>([]);

  const [buscaVigilante, setBuscaVigilante] = useState("");
  const [vigilanteSelecionadoId, setVigilanteSelecionadoId] = useState("");
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const [nomePacote, setNomePacote] = useState("");
  const [re, setRe] = useState("");
  const [vigilante, setVigilante] = useState("");
  const [telefone, setTelefone] = useState("");
  const [postoAtual, setPostoAtual] = useState("");
  const [escalaAtual, setEscalaAtual] = useState("");
  const [statusVigilante, setStatusVigilante] = useState("");

  const [localExtra, setLocalExtra] = useState("");
  const [data, setData] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFim, setHoraFim] = useState("");
  const [valor, setValor] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [buscaServico, setBuscaServico] = useState("");
  const [filtroPeriodo, setFiltroPeriodo] = useState("Todos");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [loading, setLoading] = useState(false);

  const ITENS_POR_PAGINA = 6;

  async function carregarVigilantes() {
    const q = query(collection(db, "vigilantes"), orderBy("nome", "asc"));
    const snapshot = await getDocs(q);

    const lista = snapshot.docs.map((docItem) => ({
      id: docItem.id,
      ...docItem.data(),
    })) as Vigilante[];

    setVigilantes(lista);
  }

  async function carregarServicos() {
    const q = query(
      collection(db, "servicosExtras"),
      orderBy("criadoEm", "desc"),
    );
    const snapshot = await getDocs(q);

    const lista = snapshot.docs.map((docItem) => ({
      id: docItem.id,
      ...docItem.data(),
    })) as ServicoExtra[];

    setServicos(lista);
  }

  useEffect(() => {
    carregarVigilantes();
    carregarServicos();
  }, []);

  const vigilantesFiltrados = useMemo(() => {
    const termo = buscaVigilante.trim().toLowerCase();

    if (!termo) return vigilantes;

    return vigilantes.filter((item) => {
      return (
        (item.re || "").toLowerCase().includes(termo) ||
        (item.nome || "").toLowerCase().includes(termo) ||
        (item.posto || "").toLowerCase().includes(termo) ||
        (item.escala || "").toLowerCase().includes(termo) ||
        (item.status || "").toLowerCase().includes(termo)
      );
    });
  }, [buscaVigilante, vigilantes]);

  const servicosFiltrados = useMemo(() => {
    const termo = buscaServico.trim().toLowerCase();

    return servicos.filter((item) => {
      const hoje = new Date();
      let periodoValido = true;

      if (filtroPeriodo === "Hoje") {
        const dataHoje = hoje.toISOString().split("T")[0];
        periodoValido = item.data === dataHoje;
      }

      if (filtroPeriodo === "7 dias") {
        const seteDiasAtras = new Date();
        seteDiasAtras.setDate(hoje.getDate() - 7);

        periodoValido = !!item.data && new Date(item.data) >= seteDiasAtras;
      }

      if (filtroPeriodo === "30 dias") {
        const trintaDiasAtras = new Date();
        trintaDiasAtras.setDate(hoje.getDate() - 30);

        periodoValido = !!item.data && new Date(item.data) >= trintaDiasAtras;
      }

      const buscaValida =
        !termo ||
        (item.nomePacote || "").toLowerCase().includes(termo) ||
        (item.re || "").toLowerCase().includes(termo) ||
        (item.vigilante || "").toLowerCase().includes(termo) ||
        (item.localExtra || "").toLowerCase().includes(termo) ||
        (item.data || "").toLowerCase().includes(termo) ||
        (item.postoAtual || "").toLowerCase().includes(termo);

      return periodoValido && buscaValida;
    });
  }, [buscaServico, servicos, filtroPeriodo]);

  useEffect(() => {
    setPaginaAtual(1);
  }, [buscaServico, filtroPeriodo]);

  const totalPaginas = Math.ceil(servicosFiltrados.length / ITENS_POR_PAGINA);

  const servicosPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
    const fim = inicio + ITENS_POR_PAGINA;

    return servicosFiltrados.slice(inicio, fim);
  }, [servicosFiltrados, paginaAtual]);

  function selecionarVigilante(id: string) {
    setVigilanteSelecionadoId(id);

    const escolhido = vigilantes.find((item) => item.id === id);

    if (!escolhido) {
      setRe("");
      setVigilante("");
      setTelefone("");
      setPostoAtual("");
      setEscalaAtual("");
      setStatusVigilante("");
      return;
    }

    setRe(escolhido.re || "");
    setVigilante(escolhido.nome || "");
    setTelefone(escolhido.telefone || "");
    setPostoAtual(escolhido.posto || "");
    setEscalaAtual(escolhido.escala || "");
    setStatusVigilante(escolhido.status || "");
  }

  function limparFormulario() {
    setEditandoId(null);
    setBuscaVigilante("");
    setVigilanteSelecionadoId("");
    setNomePacote("");
    setRe("");
    setVigilante("");
    setTelefone("");
    setPostoAtual("");
    setEscalaAtual("");
    setStatusVigilante("");
    setLocalExtra("");
    setData("");
    setHoraInicio("");
    setHoraFim("");
    setValor("");
    setObservacoes("");
  }

  function editarServico(servico: ServicoExtra) {
    setEditandoId(servico.id);
    setNomePacote(servico.nomePacote || "");
    setRe(servico.re || "");
    setVigilante(servico.vigilante || "");
    setTelefone(servico.telefone || "");
    setPostoAtual(servico.postoAtual || "");
    setEscalaAtual(servico.escalaAtual || "");
    setStatusVigilante(servico.statusVigilante || "");
    setLocalExtra(servico.localExtra || "");
    setData(servico.data || "");
    setHoraInicio(servico.horaInicio || "");
    setHoraFim(servico.horaFim || "");
    setValor(servico.valor || "");
    setObservacoes(servico.observacoes || "");
    setBuscaVigilante(servico.vigilante || "");
    setVigilanteSelecionadoId("");
  }

  async function salvarServico(e: React.FormEvent) {
    e.preventDefault();

    if (!nomePacote || !re || !vigilante || !localExtra || !data) {
      alert("Preencha o pacote, vigilante, local do extra e data.");
      return;
    }

    try {
      setLoading(true);

      const dados = {
        nomePacote,
        re,
        vigilante,
        telefone,
        postoAtual,
        escalaAtual,
        statusVigilante,
        localExtra,
        data,
        horaInicio,
        horaFim,
        valor,
        observacoes,
        atualizadoEm: serverTimestamp(),
      };

      if (editandoId) {
        await updateDoc(doc(db, "servicosExtras", editandoId), dados);
        alert("Serviço extra atualizado com sucesso!");
      } else {
        await addDoc(collection(db, "servicosExtras"), {
          ...dados,
          criadoEm: serverTimestamp(),
        });
        alert("Serviço extra cadastrado com sucesso!");
      }

      limparFormulario();
      await carregarServicos();
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar serviço extra.");
    } finally {
      setLoading(false);
    }
  }

  async function excluirServico(id: string) {
    const confirmar = confirm("Deseja remover este serviço extra?");

    if (!confirmar) return;

    try {
      await deleteDoc(doc(db, "servicosExtras", id));
      await carregarServicos();
      alert("Serviço extra removido com sucesso!");
    } catch (error) {
      console.error(error);
      alert("Erro ao remover serviço extra.");
    }
  }

  return (
    <AuthGuard>
      <main className="flex min-h-screen bg-slate-950">
        <Sidebar />

        <section className="flex-1 px-4 py-5 sm:p-6">
          <div className="mb-5 rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl sm:mb-8 sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
            <h1 className="text-3xl font-black text-white sm:text-4xl">
              Serviços Extras
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-400 sm:text-base">
              Cadastre pacotes de serviços adicionais vinculados aos vigilantes.
            </p>
          </div>

          <div className="grid gap-5 xl:grid-cols-3">
            <form
              onSubmit={salvarServico}
              className="rounded-3xl border border-slate-800 bg-slate-900 p-4 shadow-xl sm:p-6 xl:col-span-1"
            >
              <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-white sm:mb-5 sm:text-xl">
                {editandoId ? <Edit size={20} /> : <Plus size={20} />}
                {editandoId ? "Editar extra" : "Novo extra"}
              </h2>

              <div className="space-y-3 sm:space-y-4">
                <input
                  value={nomePacote}
                  onChange={(e) => setNomePacote(e.target.value)}
                  placeholder="Nome do pacote"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-red-500"
                />

                <div className="relative">
                  <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  />

                  <input
                    value={buscaVigilante}
                    onChange={(e) => setBuscaVigilante(e.target.value)}
                    placeholder="Buscar vigilante por nome ou RE"
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 py-3 pl-11 pr-4 text-sm text-white outline-none focus:border-red-500"
                  />
                </div>

                <select
                  value={vigilanteSelecionadoId}
                  onChange={(e) => selecionarVigilante(e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-red-500"
                >
                  <option value="">Selecione o vigilante</option>
                  {vigilantesFiltrados.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.re ? `RE ${item.re} - ` : ""}
                      {item.nome}
                    </option>
                  ))}
                </select>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input
                    value={re}
                    readOnly
                    placeholder="RE"
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-300 outline-none"
                  />
                  <input
                    value={statusVigilante}
                    readOnly
                    placeholder="Status"
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-300 outline-none"
                  />
                </div>

                <input
                  value={vigilante}
                  readOnly
                  placeholder="Nome do vigilante"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-300 outline-none"
                />
                <input
                  value={telefone}
                  readOnly
                  placeholder="Telefone"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-300 outline-none"
                />
                <input
                  value={postoAtual}
                  readOnly
                  placeholder="Posto atual"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-300 outline-none"
                />
                <input
                  value={escalaAtual}
                  readOnly
                  placeholder="Escala atual"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-300 outline-none"
                />

                <input
                  value={localExtra}
                  onChange={(e) => setLocalExtra(e.target.value)}
                  placeholder="Local onde fará o extra"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-red-500"
                />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    type="date"
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-red-500"
                  />
                  <input
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    placeholder="Valor"
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-red-500"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    type="time"
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-red-500"
                  />
                  <input
                    value={horaFim}
                    onChange={(e) => setHoraFim(e.target.value)}
                    type="time"
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-red-500"
                  />
                </div>

                <textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Observações do serviço extra"
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
                    "Cadastrar extra"
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
                    Pacotes cadastrados
                  </h2>

                  <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                    {servicosFiltrados.length} serviço(s) encontrado(s)
                  </p>
                </div>

                <div className="relative w-full md:max-w-xs">
                  <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    value={buscaServico}
                    onChange={(e) => setBuscaServico(e.target.value)}
                    placeholder="Pesquisar serviço..."
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 py-3 pl-11 pr-4 text-sm text-white outline-none focus:border-red-500"
                  />
                </div>

                <select
                  value={filtroPeriodo}
                  onChange={(e) => setFiltroPeriodo(e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-red-500 md:max-w-[180px]"
                >
                  <option>Todos</option>
                  <option>Hoje</option>
                  <option>7 dias</option>
                  <option>30 dias</option>
                </select>
              </div>

              <div className="mt-5 grid gap-3 sm:mt-6 sm:gap-4 md:grid-cols-2">
                {servicosFiltrados.length === 0 && (
                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 text-slate-400">
                    Nenhum serviço extra encontrado.
                  </div>
                )}

                {servicosPaginados.map((servico) => (
                  <div
                    key={servico.id}
                    className="relative rounded-3xl border border-slate-800 bg-slate-950 p-4 shadow-xl sm:p-5"
                  >
                    <div className="absolute right-3 top-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => editarServico(servico)}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-700/60 text-slate-300 transition hover:bg-slate-600 hover:text-white"
                        title="Editar serviço"
                      >
                        <Edit size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => excluirServico(servico.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500/10 text-red-400 transition hover:bg-red-600 hover:text-white"
                        title="Remover serviço"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="flex items-start gap-3 pr-20 sm:gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-800 text-red-400 sm:h-14 sm:w-14">
                        <BriefcaseBusiness size={22} />
                      </div>

                      <div>
                        <h3 className="text-sm font-black text-white sm:text-base">
                          {servico.nomePacote}
                        </h3>
                        <p className="mt-1 text-xs font-bold text-red-300 sm:text-sm">
                          RE: {servico.re || "Não informado"}
                        </p>
                        <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                          {servico.vigilante}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-300 sm:mt-5 sm:block sm:space-y-2 sm:text-sm">
                      <p>
                        <span className="text-slate-500">Local:</span>{" "}
                        {servico.localExtra}
                      </p>
                      <p>
                        <span className="text-slate-500">Posto atual:</span>{" "}
                        {servico.postoAtual || "-"}
                      </p>
                      <p className="flex items-center gap-1">
                        <CalendarDays size={14} className="text-slate-500" />
                        {servico.data || "-"}
                      </p>
                      <p className="flex items-center gap-1">
                        <Clock3 size={14} className="text-slate-500" />
                        {servico.horaInicio || "--:--"} às{" "}
                        {servico.horaFim || "--:--"}
                      </p>
                      <p>
                        <span className="text-slate-500">Escala:</span>{" "}
                        {servico.escalaAtual || "-"}
                      </p>
                      <p>
                        <span className="text-slate-500">Valor:</span>{" "}
                        {servico.valor || "-"}
                      </p>
                      {servico.observacoes && (
                        <p className="col-span-2">
                          <span className="text-slate-500">Obs:</span>{" "}
                          {servico.observacoes}
                        </p>
                      )}
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
          </div>
        </section>
      </main>
    </AuthGuard>
  );
}
