"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
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
  Camera,
  Edit,
  Loader2,
  MessageCircle,
  Plus,
  Search,
  UserRound,
  X,
} from "lucide-react";

import { AuthGuard } from "../../components/AuthGuard";
import { Sidebar } from "../../components/Sidebar";
import { db } from "../../lib/firebase";
import { uploadImage } from "../../services/cloudinary";

type Vigilante = {
  id: string;
  re: string;
  nome: string;
  telefone: string;
  posto: string;
  escala: string;
  status: string;
  fotoUrl?: string;
  codigoAcesso?: string;
};

function VigilantesContent() {
  const searchParams = useSearchParams();
  const statusFiltro = searchParams.get("status");

  const [vigilantes, setVigilantes] = useState<Vigilante[]>([]);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const [re, setRe] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [posto, setPosto] = useState("");
  const [escala, setEscala] = useState("");
  const [status, setStatus] = useState("Ativo");
  const [codigoAcesso, setCodigoAcesso] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [fotoAtualUrl, setFotoAtualUrl] = useState("");
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(false);

  async function carregarVigilantes() {
    const q = query(collection(db, "vigilantes"), orderBy("criadoEm", "desc"));
    const snapshot = await getDocs(q);

    const lista = snapshot.docs.map((docItem) => ({
      id: docItem.id,
      ...docItem.data(),
    })) as Vigilante[];

    setVigilantes(lista);
  }

  useEffect(() => {
    carregarVigilantes();
  }, []);

  const vigilantesFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return vigilantes.filter((vigilante) => {
      const passouBusca =
        !termo ||
        (vigilante.re || "").toLowerCase().includes(termo) ||
        vigilante.nome.toLowerCase().includes(termo) ||
        vigilante.telefone.toLowerCase().includes(termo) ||
        vigilante.posto.toLowerCase().includes(termo) ||
        vigilante.escala.toLowerCase().includes(termo) ||
        vigilante.status.toLowerCase().includes(termo);

      const passouStatus = !statusFiltro || vigilante.status === statusFiltro;

      return passouBusca && passouStatus;
    });
  }, [busca, vigilantes, statusFiltro]);

  function escolherFoto(file: File | null) {
    if (!file) return;

    setFoto(file);
    setPreview(URL.createObjectURL(file));
  }

  function limparFormulario() {
    setEditandoId(null);
    setRe("");
    setNome("");
    setTelefone("");
    setPosto("");
    setEscala("");
    setStatus("Ativo");
    setCodigoAcesso("");
    setFoto(null);
    setPreview("");
    setFotoAtualUrl("");
  }

  function editarVigilante(vigilante: Vigilante) {
    setEditandoId(vigilante.id);
    setRe(vigilante.re || "");
    setNome(vigilante.nome);
    setTelefone(vigilante.telefone);
    setPosto(vigilante.posto);
    setEscala(vigilante.escala);
    setStatus(vigilante.status);
    setCodigoAcesso(vigilante.codigoAcesso || "");
    setFoto(null);
    setPreview("");
    setFotoAtualUrl(vigilante.fotoUrl || "");
  }

  function limparTelefoneParaWhatsApp(telefoneAtual: string) {
    const apenasNumeros = telefoneAtual.replace(/\D/g, "");

    if (apenasNumeros.startsWith("55")) {
      return apenasNumeros;
    }

    return `55${apenasNumeros}`;
  }

  function abrirWhatsApp(vigilante: Vigilante) {
    const telefoneLimpo = limparTelefoneParaWhatsApp(vigilante.telefone);

    let mensagem = "";

    if (vigilante.status === "Férias") {
      mensagem = `Olá ${vigilante.nome}, tudo bem? Passando para confirmar seu período de férias e alinhar qualquer informação necessária com a central operacional.`;
    }

    const texto = encodeURIComponent(mensagem);

    const url = mensagem
      ? `https://wa.me/${telefoneLimpo}?text=${texto}`
      : `https://wa.me/${telefoneLimpo}`;

    window.open(url, "_blank");
  }

  async function salvarVigilante(e: React.FormEvent) {
    e.preventDefault();

    if (!re || !nome || !telefone || !posto || !escala || !codigoAcesso) {
      alert(
        "Preencha todos os campos obrigatórios, incluindo o RE e o código de acesso.",
      );
      return;
    }

    try {
      setLoading(true);

      let fotoUrl = fotoAtualUrl;

      if (foto) {
        fotoUrl = await uploadImage(foto);
      }

      if (editandoId) {
        await updateDoc(doc(db, "vigilantes", editandoId), {
          re,
          nome,
          telefone,
          posto,
          escala,
          status,
          codigoAcesso,
          fotoUrl,
          atualizadoEm: serverTimestamp(),
        });

        alert("Vigilante atualizado com sucesso!");
      } else {
        await addDoc(collection(db, "vigilantes"), {
          re,
          nome,
          telefone,
          posto,
          escala,
          status,
          codigoAcesso,
          fotoUrl,
          criadoEm: serverTimestamp(),
        });

        alert("Vigilante cadastrado com sucesso!");
      }

      limparFormulario();
      await carregarVigilantes();
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar vigilante.");
    } finally {
      setLoading(false);
    }
  }

  async function excluirVigilante(id: string) {
    const confirmar = confirm("Deseja remover este vigilante?");

    if (!confirmar) return;

    try {
      await deleteDoc(doc(db, "vigilantes", id));
      await carregarVigilantes();
      alert("Vigilante removido com sucesso!");
    } catch (error) {
      console.error(error);
      alert("Erro ao remover vigilante.");
    }
  }

  function corStatus(statusAtual: string) {
    if (statusAtual === "Ativo") return "bg-emerald-500/10 text-emerald-300";
    if (statusAtual === "Folga") return "bg-yellow-500/10 text-yellow-300";
    if (statusAtual === "Afastado") return "bg-red-500/10 text-red-300";
    if (statusAtual === "Férias") return "bg-blue-500/10 text-blue-300";

    return "bg-slate-500/10 text-slate-300";
  }

  return (
    <AuthGuard>
      <main className="flex min-h-screen bg-slate-950">
        <Sidebar />

        <section className="flex-1 p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-black text-white">Vigilantes</h1>
            <p className="mt-2 text-slate-400">
              Cadastro e controle da equipe operacional.
            </p>

            {statusFiltro && (
              <p className="mt-3 inline-flex rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-300">
                Filtro aplicado: {statusFiltro}
              </p>
            )}
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <form
              onSubmit={salvarVigilante}
              className="rounded-3xl border border-slate-800 bg-slate-900 p-6 xl:col-span-1"
            >
              <h2 className="mb-5 flex items-center gap-2 text-xl font-bold text-white">
                {editandoId ? <Edit size={20} /> : <Plus size={20} />}
                {editandoId ? "Editar vigilante" : "Novo vigilante"}
              </h2>

              <label className="mb-5 flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-slate-700 bg-slate-950 p-6 text-center">
                {preview ? (
                  <img
                    src={preview}
                    alt="Preview"
                    className="h-28 w-28 rounded-full object-cover"
                  />
                ) : fotoAtualUrl ? (
                  <img
                    src={fotoAtualUrl}
                    alt="Foto atual"
                    className="h-28 w-28 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-full bg-slate-800 text-slate-400">
                    <Camera size={34} />
                  </div>
                )}

                <span className="mt-3 text-sm font-medium text-slate-300">
                  {editandoId ? "Trocar foto" : "Adicionar foto"}
                </span>

                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => escolherFoto(e.target.files?.[0] || null)}
                />
              </label>

              <div className="space-y-4">
                <input
                  value={re}
                  onChange={(e) => setRe(e.target.value)}
                  placeholder="RE do vigilante"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-red-500"
                />

                <input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Nome completo"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-red-500"
                />

                <input
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="Telefone"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-red-500"
                />

                <input
                  value={codigoAcesso}
                  onChange={(e) => setCodigoAcesso(e.target.value)}
                  placeholder="Código de acesso operacional"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-red-500"
                />

                <input
                  value={posto}
                  onChange={(e) => setPosto(e.target.value)}
                  placeholder="Posto atual"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-red-500"
                />

                <input
                  value={escala}
                  onChange={(e) => setEscala(e.target.value)}
                  placeholder="Escala. Ex: 12x36 Noturno"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-red-500"
                />

                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-red-500"
                >
                  <option>Ativo</option>
                  <option>Folga</option>
                  <option>Afastado</option>
                  <option>Férias</option>
                </select>

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
                    "Cadastrar vigilante"
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
                    Lista de vigilantes
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    {vigilantesFiltrados.length} vigilante(s) encontrado(s)
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
                    placeholder="Pesquisar por nome, RE, posto..."
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 py-3 pl-11 pr-4 text-white outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {vigilantesFiltrados.length === 0 && (
                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 text-slate-400">
                    Nenhum vigilante encontrado.
                  </div>
                )}

                {vigilantesFiltrados.map((vigilante) => (
                  <div
                    key={vigilante.id}
                    className="relative rounded-3xl border border-slate-800 bg-slate-950 p-5"
                  >
                    <button
                      type="button"
                      onClick={() => excluirVigilante(vigilante.id)}
                      className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-red-500/10 text-red-400 transition hover:bg-red-600 hover:text-white"
                      title="Remover vigilante"
                    >
                      ×
                    </button>

                    <button
                      type="button"
                      onClick={() => editarVigilante(vigilante)}
                      className="absolute right-12 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-slate-700/60 text-slate-300 transition hover:bg-slate-600 hover:text-white"
                      title="Editar vigilante"
                    >
                      <Edit size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={() => abrirWhatsApp(vigilante)}
                      className="absolute right-21 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-300 transition hover:bg-emerald-600 hover:text-white"
                      title="Chamar no WhatsApp"
                    >
                      <MessageCircle size={14} />
                    </button>

                    <div className="flex items-center gap-4 pr-24">
                      {vigilante.fotoUrl ? (
                        <img
                          src={vigilante.fotoUrl}
                          alt={vigilante.nome}
                          className="h-16 w-16 rounded-2xl object-cover"
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 text-slate-400">
                          <UserRound />
                        </div>
                      )}

                      <div>
                        <h3 className="font-bold text-white">
                          {vigilante.nome}
                        </h3>

                        <p className="text-sm font-bold text-red-300">
                          RE: {vigilante.re || "Não informado"}
                        </p>

                        <p className="text-sm text-slate-400">
                          {vigilante.telefone}
                        </p>

                        <p className="text-xs text-slate-500">
                          Código operacional:{" "}
                          {vigilante.codigoAcesso || "Não definido"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 space-y-2 text-sm text-slate-300">
                      <p>
                        <span className="text-slate-500">Posto:</span>{" "}
                        {vigilante.posto}
                      </p>

                      <p>
                        <span className="text-slate-500">Escala:</span>{" "}
                        {vigilante.escala}
                      </p>

                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${corStatus(
                          vigilante.status,
                        )}`}
                      >
                        {vigilante.status}
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

export default function VigilantesPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
          Carregando vigilantes...
        </main>
      }
    >
      <VigilantesContent />
    </Suspense>
  );
}
