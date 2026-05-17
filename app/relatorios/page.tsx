"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";
import {
  CalendarDays,
  Download,
  FileText,
  MessageCircle,
  Search,
  Share2,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { AuthGuard } from "../../components/AuthGuard";
import { Sidebar } from "../../components/Sidebar";
import { db } from "../../lib/firebase";

type Ocorrencia = {
  id: string;
  tipo: string;
  posto: string;
  prioridade: string;
  status: string;
  descricao: string;
  criadoEm?: Timestamp;
  dataFormatada?: string;
};

type Posto = {
  id: string;
  nome: string;
  telefone?: string;
};

export default function RelatoriosPage() {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [postos, setPostos] = useState<Posto[]>([]);

  const [selecionadas, setSelecionadas] = useState<string[]>([]);
  const [telefoneWhatsApp, setTelefoneWhatsApp] = useState("");
  const [busca, setBusca] = useState("");
  const [postoSelecionado, setPostoSelecionado] = useState("");
  const [ultimoPdf, setUltimoPdf] = useState<Blob | null>(null);

  async function carregarOcorrencias() {
    const q = query(collection(db, "ocorrencias"), orderBy("criadoEm", "desc"));

    const snapshot = await getDocs(q);

    const lista = snapshot.docs.map((docItem) => {
      const data = docItem.data() as Omit<Ocorrencia, "id">;

      const dataFormatada =
        data.criadoEm instanceof Timestamp
          ? data.criadoEm.toDate().toLocaleDateString("pt-BR")
          : "Sem data";

      return {
        id: docItem.id,
        ...data,
        dataFormatada,
      };
    });

    setOcorrencias(lista);
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
    carregarOcorrencias();
    carregarPostos();
  }, []);

  useEffect(() => {
    if (!postoSelecionado) {
      setTelefoneWhatsApp("");
      return;
    }

    const posto = postos.find((item) => item.nome === postoSelecionado);

    setTelefoneWhatsApp(posto?.telefone || "");
  }, [postoSelecionado, postos]);

  const ocorrenciasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return ocorrencias.filter((item) => {
      const passouBusca =
        !termo ||
        item.tipo.toLowerCase().includes(termo) ||
        item.posto.toLowerCase().includes(termo) ||
        item.prioridade.toLowerCase().includes(termo) ||
        item.status.toLowerCase().includes(termo) ||
        item.descricao.toLowerCase().includes(termo) ||
        (item.dataFormatada || "").toLowerCase().includes(termo);

      const passouPosto = !postoSelecionado || item.posto === postoSelecionado;

      return passouBusca && passouPosto;
    });
  }, [busca, ocorrencias, postoSelecionado]);

  useEffect(() => {
    setSelecionadas(ocorrenciasFiltradas.map((item) => item.id));
  }, [ocorrenciasFiltradas]);

  const ocorrenciasSelecionadas = useMemo(() => {
    return ocorrencias.filter((item) => selecionadas.includes(item.id));
  }, [ocorrencias, selecionadas]);

  function alternarOcorrencia(id: string) {
    setSelecionadas((atual) =>
      atual.includes(id) ? atual.filter((item) => item !== id) : [...atual, id],
    );
  }

  function selecionarTodasFiltradas() {
    setSelecionadas(ocorrenciasFiltradas.map((item) => item.id));
  }

  function limparSelecao() {
    setSelecionadas([]);
  }

  function limparTelefoneParaWhatsApp(telefone: string) {
    const apenasNumeros = telefone.replace(/\D/g, "");

    if (apenasNumeros.startsWith("55")) {
      return apenasNumeros;
    }

    return `55${apenasNumeros}`;
  }

  function gerarPdfBlob() {
    const pdf = new jsPDF("p", "mm", "a4");

    const dataAtual = new Date().toLocaleDateString("pt-BR");

    const primeiraOcorrencia = ocorrenciasSelecionadas[0];

    pdf.setFillColor(7, 10, 18);
    pdf.rect(0, 0, 210, 44, "F");

    pdf.setFillColor(220, 38, 38);
    pdf.rect(0, 43, 210, 2, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(24);
    pdf.setTextColor(255, 255, 255);

    pdf.text("THANOS", 18, 20);

    pdf.setTextColor(220, 38, 38);
    pdf.text("COMMAND", 62, 20);

    pdf.setFontSize(15);
    pdf.setTextColor(255, 255, 255);

    pdf.text("RELATÓRIO OPERACIONAL", 120, 20);

    pdf.setFontSize(10);

    pdf.text(`Data: ${dataAtual}`, 120, 30);

    pdf.setTextColor(20, 20, 20);

    pdf.setFontSize(13);

    pdf.text(`Posto/Cliente: ${postoSelecionado || "Todos os postos"}`, 14, 58);

    pdf.setDrawColor(220, 38, 38);
    pdf.roundedRect(10, 52, 190, 18, 3, 3);

    pdf.setFontSize(10);
    pdf.setTextColor(90, 90, 90);

    pdf.text("Documento operacional confidencial • Thanos Command", 14, 64);

    autoTable(pdf, {
      startY: 68,
      margin: { left: 10, right: 10 },

      head: [["DATA", "TIPO", "POSTO", "PRIORIDADE", "STATUS"]],

      body:
        ocorrenciasSelecionadas.length > 0
          ? ocorrenciasSelecionadas.map((item) => [
              item.dataFormatada || "-",
              item.tipo || "-",
              item.posto || "-",
              item.prioridade || "-",
              item.status || "-",
            ])
          : [["-", "-", "-", "-", "-"]],

      styles: {
        fontSize: 9,
        cellPadding: 6,
      },

      headStyles: {
        fillColor: [5, 5, 5],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
    });

    let finalY = (pdf as any).lastAutoTable.finalY + 20;

    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");

    pdf.text("DESCRIÇÃO", 14, finalY);

    finalY += 10;

    pdf.setFont("helvetica", "normal");

    const descricao =
      primeiraOcorrencia?.descricao || "Nenhuma ocorrência selecionada.";

    const linhas = pdf.splitTextToSize(descricao, 175);

    pdf.text(linhas, 14, finalY);

    const totalPaginas = pdf.getNumberOfPages();

    for (let i = 1; i <= totalPaginas; i++) {
      pdf.setPage(i);

      pdf.setFontSize(9);
      pdf.setTextColor(120, 120, 120);

      pdf.text(`Thanos Command • Página ${i} de ${totalPaginas}`, 14, 290);
    }

    return pdf.output("blob");
  }

  function baixarPdf() {
    if (ocorrenciasSelecionadas.length === 0) {
      alert("Selecione pelo menos uma ocorrência.");
      return;
    }

    const blob = gerarPdfBlob();

    setUltimoPdf(blob);

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = `relatorio-${new Date()
      .toLocaleDateString("pt-BR")
      .replaceAll("/", "-")}.pdf`;

    link.click();

    URL.revokeObjectURL(url);
  }

  async function compartilharPdf() {
    if (ocorrenciasSelecionadas.length === 0) {
      alert("Selecione pelo menos uma ocorrência.");
      return;
    }

    const blob = ultimoPdf || gerarPdfBlob();

    setUltimoPdf(blob);

    const arquivo = new File([blob], "relatorio-thanos-command.pdf", {
      type: "application/pdf",
    });

    if (navigator.share && navigator.canShare?.({ files: [arquivo] })) {
      await navigator.share({
        title: "Relatório Thanos Command",
        text: "Segue relatório operacional em PDF.",
        files: [arquivo],
      });

      return;
    }

    alert("Compartilhamento direto disponível principalmente no celular.");
  }

  function abrirWhatsApp() {
    if (!telefoneWhatsApp) {
      alert("Telefone do posto não encontrado.");
      return;
    }

    const telefoneLimpo = limparTelefoneParaWhatsApp(telefoneWhatsApp);

    const mensagem = encodeURIComponent(
      `Olá, segue relatório operacional do posto ${postoSelecionado || ""}.`,
    );

    window.open(`https://wa.me/${telefoneLimpo}?text=${mensagem}`, "_blank");
  }

  return (
    <AuthGuard>
      <main className="flex min-h-screen bg-slate-950">
        <Sidebar />

        <section className="flex-1 px-4 py-5 sm:p-6">
          <div className="mb-5 rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl sm:mb-8 sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
            <h1 className="text-3xl font-black text-white sm:text-4xl">
              Relatórios
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-400 sm:text-base">
              Gere PDFs profissionais para clientes e operações.
            </p>
          </div>

          <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <ResumoCard
              title="Ocorrências"
              value={ocorrencias.length}
              color="red"
            />

            <ResumoCard
              title="Selecionadas"
              value={ocorrenciasSelecionadas.length}
              color="blue"
            />

            <ResumoCard title="Postos" value={postos.length} color="emerald" />

            <ResumoCard title="PDF Premium" value="Ativo" color="purple" />
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4 shadow-xl sm:p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 sm:mb-5 sm:h-14 sm:w-14">
                <FileText />
              </div>

              <h2 className="text-lg font-black text-white sm:text-xl">
                Relatório operacional
              </h2>

              <p className="mt-3 text-xs leading-6 text-slate-400 sm:text-sm">
                Gere relatórios por cliente/posto.
              </p>

              <select
                value={postoSelecionado}
                onChange={(e) => setPostoSelecionado(e.target.value)}
                className="mt-5 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-red-500"
              >
                <option value="">Todos os postos</option>

                {postos.map((item) => (
                  <option key={item.id} value={item.nome}>
                    {item.nome}
                  </option>
                ))}
              </select>

              <input
                value={telefoneWhatsApp}
                onChange={(e) => setTelefoneWhatsApp(e.target.value)}
                placeholder="WhatsApp do cliente"
                className="mt-4 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-red-500"
              />

              <div className="mt-5 space-y-3">
                <button
                  type="button"
                  onClick={baixarPdf}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-500"
                >
                  <Download size={18} />
                  Baixar PDF
                </button>

                <button
                  type="button"
                  onClick={compartilharPdf}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-700 px-5 py-3 text-sm font-bold text-slate-200 transition hover:bg-slate-800"
                >
                  <Share2 size={18} />
                  Compartilhar PDF
                </button>

                <button
                  type="button"
                  onClick={abrirWhatsApp}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-500"
                >
                  <MessageCircle size={18} />
                  Abrir WhatsApp
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4 shadow-xl sm:p-6 lg:col-span-2">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <h2 className="text-lg font-black text-white sm:text-xl">
                    Ocorrências
                  </h2>

                  <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                    {ocorrenciasSelecionadas.length} selecionada(s)
                  </p>
                </div>

                <div className="relative w-full md:w-72">
                  <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  />

                  <input
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Buscar ocorrência..."
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 py-3 pl-11 pr-4 text-sm text-white outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:flex">
                <button
                  type="button"
                  onClick={selecionarTodasFiltradas}
                  className="rounded-2xl border border-slate-700 px-4 py-3 text-xs font-bold text-slate-200 transition hover:bg-slate-800 sm:text-sm"
                >
                  Todas
                </button>

                <button
                  type="button"
                  onClick={limparSelecao}
                  className="rounded-2xl border border-slate-700 px-4 py-3 text-xs font-bold text-slate-200 transition hover:bg-slate-800 sm:text-sm"
                >
                  Limpar
                </button>
              </div>

              <div className="mt-5 space-y-3">
                {ocorrenciasFiltradas.length === 0 && (
                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 text-slate-400">
                    Nenhuma ocorrência encontrada.
                  </div>
                )}

                {ocorrenciasFiltradas.map((ocorrencia) => (
                  <label
                    key={ocorrencia.id}
                    className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-800 bg-slate-950 p-3 shadow-xl transition hover:border-red-500/50 sm:gap-4 sm:p-4"
                  >
                    <input
                      type="checkbox"
                      checked={selecionadas.includes(ocorrencia.id)}
                      onChange={() => alternarOcorrencia(ocorrencia.id)}
                      className="mt-1 h-5 w-5 accent-red-600"
                    />

                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2 text-[11px] font-bold text-slate-400 sm:text-xs">
                        <CalendarDays size={14} />
                        {ocorrencia.dataFormatada || "Sem data"}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <strong className="text-sm text-white sm:text-base">
                          {ocorrencia.tipo}
                        </strong>

                        <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-bold text-red-300">
                          {ocorrencia.status}
                        </span>

                        <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300">
                          {ocorrencia.prioridade}
                        </span>
                      </div>

                      <p className="mt-2 text-xs text-slate-400 sm:text-sm">
                        {ocorrencia.posto}
                      </p>

                      <p className="mt-2 line-clamp-2 text-xs leading-6 text-slate-300 sm:text-sm">
                        {ocorrencia.descricao}
                      </p>
                    </div>
                  </label>
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
  title,
  value,
  color,
}: {
  title: string;
  value: string | number;
  color: "red" | "blue" | "emerald" | "purple";
}) {
  const colors = {
    red: "from-red-500/10 border-red-500/20 text-red-300",
    blue: "from-blue-500/10 border-blue-500/20 text-blue-300",
    emerald: "from-emerald-500/10 border-emerald-500/20 text-emerald-300",
    purple: "from-purple-500/10 border-purple-500/20 text-purple-300",
  };

  return (
    <div
      className={`rounded-3xl border bg-gradient-to-br to-slate-900 p-4 shadow-xl ${colors[color]}`}
    >
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {title}
      </p>

      <h2 className="mt-3 text-3xl font-black text-white">{value}</h2>
    </div>
  );
}
