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
  Building2,
  Edit,
  Loader2,
  MapPinned,
  Plus,
  Search,
  X,
} from "lucide-react";

import { AuthGuard } from "../../components/AuthGuard";
import { Sidebar } from "../../components/Sidebar";
import { db } from "../../lib/firebase";

type Posto = {
  id: string;
  nome: string;
  endereco: string;
  responsavel: string;
  telefone: string;
  risco: string;
  observacoes: string;
};

export default function PostosPage() {
  const [postos, setPostos] = useState<Posto[]>([]);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const [nome, setNome] = useState("");
  const [endereco, setEndereco] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [telefone, setTelefone] = useState("");
  const [risco, setRisco] = useState("Baixo");
  const [observacoes, setObservacoes] = useState("");
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(false);

  async function carregarPostos() {
    const q = query(collection(db, "postos"), orderBy("criadoEm", "desc"));
    const snapshot = await getDocs(q);

    const lista = snapshot.docs.map((docItem) => ({
      id: docItem.id,
      ...docItem.data(),
    })) as Posto[];

    setPostos(lista);
  }

  useEffect(() => {
    carregarPostos();
  }, []);

  const postosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) return postos;

    return postos.filter((posto) => {
      return (
        posto.nome.toLowerCase().includes(termo) ||
        posto.endereco.toLowerCase().includes(termo) ||
        posto.responsavel.toLowerCase().includes(termo) ||
        posto.telefone.toLowerCase().includes(termo) ||
        posto.risco.toLowerCase().includes(termo) ||
        posto.observacoes.toLowerCase().includes(termo)
      );
    });
  }, [busca, postos]);

  function limparFormulario() {
    setEditandoId(null);
    setNome("");
    setEndereco("");
    setResponsavel("");
    setTelefone("");
    setRisco("Baixo");
    setObservacoes("");
  }

  function editarPosto(posto: Posto) {
    setEditandoId(posto.id);
    setNome(posto.nome);
    setEndereco(posto.endereco);
    setResponsavel(posto.responsavel);
    setTelefone(posto.telefone);
    setRisco(posto.risco);
    setObservacoes(posto.observacoes || "");
  }

  async function salvarPosto(e: React.FormEvent) {
    e.preventDefault();

    if (!nome || !endereco || !responsavel || !telefone) {
      alert("Preencha os campos obrigatórios.");
      return;
    }

    try {
      setLoading(true);

      if (editandoId) {
        await updateDoc(doc(db, "postos", editandoId), {
          nome,
          endereco,
          responsavel,
          telefone,
          risco,
          observacoes,
          atualizadoEm: serverTimestamp(),
        });

        alert("Posto atualizado com sucesso!");
      } else {
        await addDoc(collection(db, "postos"), {
          nome,
          endereco,
          responsavel,
          telefone,
          risco,
          observacoes,
          criadoEm: serverTimestamp(),
        });

        alert("Posto cadastrado com sucesso!");
      }

      limparFormulario();
      await carregarPostos();
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar posto.");
    } finally {
      setLoading(false);
    }
  }

  async function excluirPosto(id: string) {
    const confirmar = confirm("Deseja remover este posto?");

    if (!confirmar) return;

    try {
      await deleteDoc(doc(db, "postos", id));
      await carregarPostos();
      alert("Posto removido com sucesso!");
    } catch (error) {
      console.error(error);
      alert("Erro ao remover posto.");
    }
  }

  function corDoRisco(riscoAtual: string) {
    if (riscoAtual === "Alto") return "bg-red-500/10 text-red-300";
    if (riscoAtual === "Médio") return "bg-yellow-500/10 text-yellow-300";
    return "bg-emerald-500/10 text-emerald-300";
  }

  return (
    <AuthGuard>
      <main className="flex min-h-screen bg-slate-950">
        <Sidebar />

        <section className="flex-1 p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-black text-white">Postos</h1>

            <p className="mt-2 text-slate-400">
              Cadastro de clientes, endereços e locais protegidos.
            </p>
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <form
              onSubmit={salvarPosto}
              className="rounded-3xl border border-slate-800 bg-slate-900 p-6 xl:col-span-1"
            >
              <h2 className="mb-5 flex items-center gap-2 text-xl font-bold text-white">
                {editandoId ? <Edit size={20} /> : <Plus size={20} />}
                {editandoId ? "Editar posto" : "Novo posto"}
              </h2>

              <div className="space-y-4">
                <input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Nome do cliente/local"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-red-500"
                />

                <input
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  placeholder="Endereço completo"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-red-500"
                />

                <input
                  value={responsavel}
                  onChange={(e) => setResponsavel(e.target.value)}
                  placeholder="Responsável no local"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-red-500"
                />

                <input
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="Telefone do responsável"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-red-500"
                />

                <select
                  value={risco}
                  onChange={(e) => setRisco(e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-red-500"
                >
                  <option>Baixo</option>
                  <option>Médio</option>
                  <option>Alto</option>
                </select>

                <textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Observações operacionais"
                  rows={4}
                  className="w-full resize-none rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-red-500"
                />

                <button
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-4 font-bold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-500 disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Salvando...
                    </>
                  ) : editandoId ? (
                    "Salvar alteração"
                  ) : (
                    "Cadastrar posto"
                  )}
                </button>

                {editandoId && (
                  <button
                    type="button"
                    onClick={limparFormulario}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-700 px-5 py-4 font-bold text-slate-300 transition hover:bg-slate-800 hover:text-white"
                  >
                    <X size={18} />
                    Cancelar edição
                  </button>
                )}
              </div>
            </form>

            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 xl:col-span-2">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Postos cadastrados
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    {postosFiltrados.length} posto(s) encontrado(s)
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
                    placeholder="Pesquisar posto..."
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 py-3 pl-11 pr-4 text-white outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {postosFiltrados.length === 0 && (
                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 text-slate-400">
                    Nenhum posto encontrado.
                  </div>
                )}

                {postosFiltrados.map((posto) => (
                  <div
                    key={posto.id}
                    className="relative rounded-3xl border border-slate-800 bg-slate-950 p-5"
                  >
                    <button
                      type="button"
                      onClick={() => excluirPosto(posto.id)}
                      className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-red-500/10 text-red-400 transition hover:bg-red-600 hover:text-white"
                      title="Remover posto"
                    >
                      ×
                    </button>

                    <button
                      type="button"
                      onClick={() => editarPosto(posto)}
                      className="absolute right-12 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-slate-700/60 text-slate-300 transition hover:bg-slate-600 hover:text-white"
                      title="Editar posto"
                    >
                      <Edit size={14} />
                    </button>

                    <div className="flex items-start gap-4 pr-16">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-red-400">
                        <Building2 />
                      </div>

                      <div>
                        <h3 className="font-bold text-white">{posto.nome}</h3>

                        <p className="mt-1 flex items-center gap-1 text-sm text-slate-400">
                          <MapPinned size={14} />
                          {posto.endereco}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 space-y-2 text-sm text-slate-300">
                      <p>
                        <span className="text-slate-500">Responsável:</span>{" "}
                        {posto.responsavel}
                      </p>

                      <p>
                        <span className="text-slate-500">Telefone:</span>{" "}
                        {posto.telefone}
                      </p>

                      {posto.observacoes && (
                        <p>
                          <span className="text-slate-500">Obs:</span>{" "}
                          {posto.observacoes}
                        </p>
                      )}

                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${corDoRisco(
                          posto.risco,
                        )}`}
                      >
                        Risco {posto.risco}
                      </span>
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
