"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Clock3,
  ImagePlus,
  Loader2,
  MapPin,
  Play,
  Radar,
  Search,
  ShieldCheck,
  StopCircle,
  UserRound,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";

import { db } from "../../lib/firebase";
import { uploadImage } from "../../services/cloudinary";

type PontoRonda = {
  data: string;
  latitude: number;
  longitude: number;
};

type FotoRonda = {
  url: string;
  data: string;
  tipo: "inicio" | "ponto" | "finalizacao";
};

type Vigilante = {
  id: string;
  re: string;
  nome: string;
  status: string;
  codigoAcesso?: string;
};

type Posto = {
  id: string;
  nome: string;
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
  arquivadaEm?: string;
  pontos?: PontoRonda[];
  fotos?: FotoRonda[];
};

type PendenciaOffline =
  | {
      id: string;
      tipo: "ponto";
      rondaId: string;
      ponto: PontoRonda;
    }
  | {
      id: string;
      tipo: "ocorrencia";
      dados: {
        re: string;
        vigilante: string;
        posto: string;
        tipo: string;
        prioridade: string;
        descricao: string;
        status: string;
        origem: string;
        latitude: number;
        longitude: number;
        localizacao: {
          latitude: number;
          longitude: number;
        };
        data: string;
        fotoBase64?: string;
      };
    };

export default function RondaOperacionalPage() {
  const [vigilantes, setVigilantes] = useState<Vigilante[]>([]);
  const [postos, setPostos] = useState<Posto[]>([]);
  const [rondas, setRondas] = useState<Ronda[]>([]);

  const [buscaRe, setBuscaRe] = useState("");
  const [codigoDigitado, setCodigoDigitado] = useState("");
  const [acessoLiberado, setAcessoLiberado] = useState(false);
  const [vigilanteSelecionadoId, setVigilanteSelecionadoId] = useState("");
  const [postoSelecionadoId, setPostoSelecionadoId] = useState("");

  const [re, setRe] = useState("");
  const [vigilante, setVigilante] = useState("");
  const [posto, setPosto] = useState("");
  const [turno, setTurno] = useState("Diurno");
  const [observacoes, setObservacoes] = useState("");

  const [foto, setFoto] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState("");

  const [modalOcorrenciaAberto, setModalOcorrenciaAberto] = useState(false);
  const [tipoOcorrencia, setTipoOcorrencia] = useState("Suspeita");
  const [prioridadeOcorrencia, setPrioridadeOcorrencia] = useState("Média");
  const [descricaoOcorrencia, setDescricaoOcorrencia] = useState("");
  const [fotoOcorrencia, setFotoOcorrencia] = useState<File | null>(null);
  const [fotoOcorrenciaPreview, setFotoOcorrenciaPreview] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingOcorrencia, setLoadingOcorrencia] = useState(false);
  const [carregandoDados, setCarregandoDados] = useState(true);
  const [paginaHistorico, setPaginaHistorico] = useState(1);
  const [online, setOnline] = useState(true);
  const [pendenciasOffline, setPendenciasOffline] = useState<
    PendenciaOffline[]
  >([]);

  const itensPorPaginaHistorico = 3;
  const chavePendenciasOffline = "thanos-command-pendencias-offline";

  function carregarPendenciasOffline() {
    if (typeof window === "undefined") return [];

    const pendenciasSalvas = localStorage.getItem(chavePendenciasOffline);

    if (!pendenciasSalvas) return [];

    try {
      return JSON.parse(pendenciasSalvas) as PendenciaOffline[];
    } catch (error) {
      console.error("Erro ao carregar pendências offline:", error);
      return [];
    }
  }

  function salvarPendenciasOffline(novasPendencias: PendenciaOffline[]) {
    setPendenciasOffline(novasPendencias);
    localStorage.setItem(
      chavePendenciasOffline,
      JSON.stringify(novasPendencias),
    );
  }

  function adicionarPendenciaOffline(pendencia: PendenciaOffline) {
    const pendenciasAtuais = carregarPendenciasOffline();
    const novasPendencias = [...pendenciasAtuais, pendencia];

    salvarPendenciasOffline(novasPendencias);
  }

  function criarIdOffline() {
    return `offline-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function arquivoParaBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const leitor = new FileReader();

      leitor.onload = () => resolve(String(leitor.result));
      leitor.onerror = reject;
      leitor.readAsDataURL(file);
    });
  }

  function base64ParaArquivo(base64: string, nomeArquivo: string) {
    const partes = base64.split(",");
    const mime = partes[0].match(/:(.*?);/)?.[1] || "image/jpeg";
    const binario = atob(partes[1]);
    const tamanho = binario.length;
    const bytes = new Uint8Array(tamanho);

    for (let i = 0; i < tamanho; i++) {
      bytes[i] = binario.charCodeAt(i);
    }

    return new File([bytes], nomeArquivo, { type: mime });
  }

  async function sincronizarPendenciasOffline() {
    if (!navigator.onLine) return;

    const pendenciasAtuais = carregarPendenciasOffline();

    if (pendenciasAtuais.length === 0) {
      setPendenciasOffline([]);
      return;
    }

    const pendenciasNaoSincronizadas: PendenciaOffline[] = [];

    for (const pendencia of pendenciasAtuais) {
      try {
        if (pendencia.tipo === "ponto") {
          await updateDoc(doc(db, "rondas", pendencia.rondaId), {
            pontos: arrayUnion(pendencia.ponto),
            atualizadoEm: serverTimestamp(),
          });
        }

        if (pendencia.tipo === "ocorrencia") {
          let fotoUrl = "";

          if (pendencia.dados.fotoBase64) {
            const arquivo = base64ParaArquivo(
              pendencia.dados.fotoBase64,
              `ocorrencia-${pendencia.id}.jpg`,
            );

            fotoUrl = await uploadImage(arquivo);
          }

          await addDoc(collection(db, "ocorrencias"), {
            re: pendencia.dados.re,
            vigilante: pendencia.dados.vigilante,
            posto: pendencia.dados.posto,
            tipo: pendencia.dados.tipo,
            prioridade: pendencia.dados.prioridade,
            descricao: pendencia.dados.descricao,
            status: pendencia.dados.status,
            origem: `${pendencia.dados.origem} • sincronizado offline`,
            fotoUrl,
            latitude: pendencia.dados.latitude,
            longitude: pendencia.dados.longitude,
            localizacao: pendencia.dados.localizacao,
            data: pendencia.dados.data,
            criadoEm: serverTimestamp(),
            atualizadoEm: serverTimestamp(),
          });
        }
      } catch (error) {
        console.error("Erro ao sincronizar pendência:", error);
        pendenciasNaoSincronizadas.push(pendencia);
      }
    }

    salvarPendenciasOffline(pendenciasNaoSincronizadas);
    await carregarDados();

    if (pendenciasNaoSincronizadas.length === 0) {
      alert("Pendências offline sincronizadas com sucesso.");
    }
  }

  function converterDataBrasileiraParaDate(dataTexto?: string) {
    if (!dataTexto) return null;

    const partes = dataTexto.split(",")[0]?.split("/");

    if (!partes || partes.length !== 3) return null;

    const [dia, mes, ano] = partes.map(Number);

    if (!dia || !mes || !ano) return null;

    return new Date(ano, mes - 1, dia);
  }

  function rondaDeveSerArquivada(ronda: Ronda) {
    if (ronda.status !== "Concluída") return false;

    const dataBase =
      converterDataBrasileiraParaDate(ronda.finalizadaEm) ||
      converterDataBrasileiraParaDate(ronda.inicioEm);

    if (!dataBase) return false;

    const hoje = new Date();
    const diferencaEmMs = hoje.getTime() - dataBase.getTime();
    const diferencaEmDias = diferencaEmMs / (1000 * 60 * 60 * 24);

    return diferencaEmDias >= 30;
  }

  async function carregarDados() {
    try {
      setCarregandoDados(true);

      const vigilantesQuery = query(
        collection(db, "vigilantes"),
        orderBy("nome", "asc"),
      );
      const postosQuery = query(
        collection(db, "postos"),
        orderBy("nome", "asc"),
      );
      const rondasQuery = query(
        collection(db, "rondas"),
        orderBy("criadoEm", "desc"),
      );

      const [vigilantesSnapshot, postosSnapshot, rondasSnapshot] =
        await Promise.all([
          getDocs(vigilantesQuery),
          getDocs(postosQuery),
          getDocs(rondasQuery),
        ]);

      const listaVigilantes = vigilantesSnapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      })) as Vigilante[];

      const listaPostos = postosSnapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      })) as Posto[];

      const listaRondas = rondasSnapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      })) as Ronda[];

      const rondasParaArquivar = listaRondas.filter(rondaDeveSerArquivada);

      if (rondasParaArquivar.length > 0) {
        await Promise.all(
          rondasParaArquivar.map((ronda) =>
            updateDoc(doc(db, "rondas", ronda.id), {
              status: "Arquivada",
              arquivadaEm: new Date().toLocaleString("pt-BR"),
              atualizadoEm: serverTimestamp(),
            }),
          ),
        );

        listaRondas.forEach((ronda) => {
          if (rondasParaArquivar.some((item) => item.id === ronda.id)) {
            ronda.status = "Arquivada";
            ronda.arquivadaEm = new Date().toLocaleString("pt-BR");
          }
        });
      }

      setVigilantes(listaVigilantes);
      setPostos(listaPostos);
      setRondas(listaRondas);
    } catch (error) {
      console.error(error);
      alert("Erro ao carregar dados operacionais.");
    } finally {
      setCarregandoDados(false);
    }
  }

  useEffect(() => {
    setOnline(navigator.onLine);
    setPendenciasOffline(carregarPendenciasOffline());
    carregarDados();

    function aoFicarOnline() {
      setOnline(true);
      sincronizarPendenciasOffline();
    }

    function aoFicarOffline() {
      setOnline(false);
    }

    window.addEventListener("online", aoFicarOnline);
    window.addEventListener("offline", aoFicarOffline);

    return () => {
      window.removeEventListener("online", aoFicarOnline);
      window.removeEventListener("offline", aoFicarOffline);
    };
  }, []);

  const vigilantesFiltrados = useMemo(() => {
    const termo = buscaRe.trim().toLowerCase();
    if (!termo) return vigilantes;

    return vigilantes.filter((item) => {
      return (
        (item.re || "").toLowerCase().includes(termo) ||
        (item.nome || "").toLowerCase().includes(termo)
      );
    });
  }, [buscaRe, vigilantes]);

  const rondaEmAndamento = useMemo(() => {
    if (!re) return null;

    return (
      rondas.find(
        (ronda) =>
          ronda.re === re &&
          ronda.status === "Em andamento" &&
          !ronda.finalizadaEm,
      ) || null
    );
  }, [re, rondas]);

  useEffect(() => {
    if (!rondaEmAndamento) return;

    const intervalo = setInterval(async () => {
      try {
        navigator.geolocation.getCurrentPosition(
          async (posicao) => {
            const ponto = {
              data: new Date().toLocaleString("pt-BR"),
              latitude: posicao.coords.latitude,
              longitude: posicao.coords.longitude,
            };

            if (!navigator.onLine) {
              adicionarPendenciaOffline({
                id: criarIdOffline(),
                tipo: "ponto",
                rondaId: rondaEmAndamento.id,
                ponto,
              });

              setOnline(false);
              return;
            }

            await updateDoc(doc(db, "rondas", rondaEmAndamento.id), {
              pontos: arrayUnion(ponto),
              atualizadoEm: serverTimestamp(),
            });

            await carregarDados();
          },
          (erro) => {
            console.error("Erro GPS tempo real:", erro);
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0,
          },
        );
      } catch (error) {
        console.error(error);
      }
    }, 30000);

    return () => clearInterval(intervalo);
  }, [rondaEmAndamento]);

  const minhasRondas = useMemo(() => {
    if (!re) return [];

    return rondas.filter(
      (ronda) => ronda.re === re && ronda.status !== "Arquivada",
    );
  }, [re, rondas]);

  const totalPaginasHistorico = Math.max(
    1,
    Math.ceil(minhasRondas.length / itensPorPaginaHistorico),
  );

  const minhasRondasRecentes = useMemo(() => {
    const inicio = (paginaHistorico - 1) * itensPorPaginaHistorico;
    const fim = inicio + itensPorPaginaHistorico;

    return minhasRondas.slice(inicio, fim);
  }, [minhasRondas, paginaHistorico]);

  useEffect(() => {
    setPaginaHistorico(1);
  }, [re]);

  useEffect(() => {
    if (paginaHistorico > totalPaginasHistorico) {
      setPaginaHistorico(totalPaginasHistorico);
    }
  }, [paginaHistorico, totalPaginasHistorico]);

  function validarAcessoOperacional() {
    const vigilanteEncontrado = vigilantes.find(
      (item) => item.re === re && item.codigoAcesso === codigoDigitado,
    );

    if (!vigilanteEncontrado) {
      alert("RE ou código operacional inválido.");
      return;
    }

    setVigilante(vigilanteEncontrado.nome || "");
    setAcessoLiberado(true);
    alert("Acesso operacional liberado!");
  }

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

  function selecionarFoto(arquivo?: File) {
    if (!arquivo) return;

    setFoto(arquivo);
    setFotoPreview(URL.createObjectURL(arquivo));
  }

  function removerFoto() {
    setFoto(null);
    setFotoPreview("");
  }

  async function enviarFoto(tipo: "inicio" | "ponto" | "finalizacao") {
    if (!foto) return null;

    const url = await uploadImage(foto);

    return {
      url,
      data: new Date().toLocaleString("pt-BR"),
      tipo,
    };
  }

  function obterLocalizacao(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("GPS não disponível neste aparelho."));
        return;
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      });
    });
  }

  function selecionarFotoOcorrencia(arquivo?: File) {
    if (!arquivo) return;

    setFotoOcorrencia(arquivo);
    setFotoOcorrenciaPreview(URL.createObjectURL(arquivo));
  }

  function limparOcorrencia() {
    setTipoOcorrencia("Suspeita");
    setPrioridadeOcorrencia("Média");
    setDescricaoOcorrencia("");
    setFotoOcorrencia(null);
    setFotoOcorrenciaPreview("");
  }

  function fecharModalOcorrencia() {
    setModalOcorrenciaAberto(false);
    limparOcorrencia();
  }

  async function abrirOcorrenciaRapida(e: React.FormEvent) {
    e.preventDefault();

    if (!re || !vigilante || !posto) {
      alert("Selecione seu RE e o posto antes de abrir uma ocorrência.");
      return;
    }

    if (!descricaoOcorrencia.trim()) {
      alert("Descreva a ocorrência antes de enviar.");
      return;
    }

    try {
      setLoadingOcorrencia(true);

      const posicao = await obterLocalizacao();

      const dadosOcorrencia = {
        re,
        vigilante,
        posto,
        tipo: tipoOcorrencia,
        prioridade: prioridadeOcorrencia,
        descricao: descricaoOcorrencia,
        status: "Aberta",
        origem: "Link operacional do vigilante",
        latitude: posicao.coords.latitude,
        longitude: posicao.coords.longitude,
        localizacao: {
          latitude: posicao.coords.latitude,
          longitude: posicao.coords.longitude,
        },
        data: new Date().toLocaleString("pt-BR"),
      };

      if (!navigator.onLine) {
        const fotoBase64 = fotoOcorrencia
          ? await arquivoParaBase64(fotoOcorrencia)
          : undefined;

        adicionarPendenciaOffline({
          id: criarIdOffline(),
          tipo: "ocorrencia",
          dados: {
            ...dadosOcorrencia,
            fotoBase64,
          },
        });

        setOnline(false);
        fecharModalOcorrencia();
        alert(
          "Sem internet. Ocorrência salva no celular para sincronizar depois.",
        );
        return;
      }

      let fotoUrl = "";

      if (fotoOcorrencia) {
        fotoUrl = await uploadImage(fotoOcorrencia);
      }

      await addDoc(collection(db, "ocorrencias"), {
        ...dadosOcorrencia,
        fotoUrl,
        criadoEm: serverTimestamp(),
        atualizadoEm: serverTimestamp(),
      });

      fecharModalOcorrencia();
      alert("Ocorrência enviada para a central com sucesso!");
    } catch (error) {
      console.error(error);
      alert("Erro ao enviar ocorrência. Verifique a permissão de localização.");
    } finally {
      setLoadingOcorrencia(false);
    }
  }

  async function iniciarRonda(e: React.FormEvent) {
    e.preventDefault();

    if (!re || !vigilante || !posto) {
      alert("Informe o vigilante e o posto antes de iniciar a ronda.");
      return;
    }

    if (rondaEmAndamento) {
      alert(
        "Você já possui uma ronda em andamento. Finalize antes de iniciar outra.",
      );
      return;
    }

    try {
      setLoading(true);
      const posicao = await obterLocalizacao();
      const fotoEnviada = await enviarFoto("inicio");

      await addDoc(collection(db, "rondas"), {
        re,
        vigilante,
        posto,
        turno,
        status: "Em andamento",
        observacoes,
        inicioEm: new Date().toLocaleString("pt-BR"),
        pontos: [
          {
            data: new Date().toLocaleString("pt-BR"),
            latitude: posicao.coords.latitude,
            longitude: posicao.coords.longitude,
          },
        ],
        fotos: fotoEnviada ? [fotoEnviada] : [],
        origem: "Link operacional do vigilante",
        criadoEm: serverTimestamp(),
        atualizadoEm: serverTimestamp(),
      });

      setObservacoes("");
      removerFoto();
      await carregarDados();
      alert("Ronda iniciada com sucesso!");
    } catch (error) {
      console.error(error);
      alert(
        "Não foi possível iniciar a ronda. Libere a localização do aparelho.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function registrarPonto() {
    if (!rondaEmAndamento) {
      alert("Nenhuma ronda em andamento encontrada.");
      return;
    }

    try {
      setLoading(true);
      const posicao = await obterLocalizacao();

      const ponto = {
        data: new Date().toLocaleString("pt-BR"),
        latitude: posicao.coords.latitude,
        longitude: posicao.coords.longitude,
      };

      if (!navigator.onLine) {
        adicionarPendenciaOffline({
          id: criarIdOffline(),
          tipo: "ponto",
          rondaId: rondaEmAndamento.id,
          ponto,
        });

        setOnline(false);
        removerFoto();
        alert("Sem internet. Ponto salvo para sincronizar depois.");
        return;
      }

      const fotoEnviada = await enviarFoto("ponto");

      await updateDoc(doc(db, "rondas", rondaEmAndamento.id), {
        pontos: arrayUnion(ponto),
        ...(fotoEnviada ? { fotos: arrayUnion(fotoEnviada) } : {}),
        atualizadoEm: serverTimestamp(),
      });

      removerFoto();
      await carregarDados();
      alert("Ponto GPS registrado com sucesso!");
    } catch (error) {
      console.error(error);
      alert(
        "Erro ao registrar ponto GPS. Verifique a permissão de localização.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function finalizarRonda() {
    if (!rondaEmAndamento) {
      alert("Nenhuma ronda em andamento encontrada.");
      return;
    }

    const confirmar = confirm("Deseja finalizar esta ronda agora?");
    if (!confirmar) return;

    try {
      setLoading(true);
      const posicao = await obterLocalizacao();
      const fotoEnviada = await enviarFoto("finalizacao");

      await updateDoc(doc(db, "rondas", rondaEmAndamento.id), {
        status: "Concluída",
        finalizadaEm: new Date().toLocaleString("pt-BR"),
        pontos: arrayUnion({
          data: new Date().toLocaleString("pt-BR"),
          latitude: posicao.coords.latitude,
          longitude: posicao.coords.longitude,
        }),
        ...(fotoEnviada ? { fotos: arrayUnion(fotoEnviada) } : {}),
        atualizadoEm: serverTimestamp(),
      });

      removerFoto();
      await carregarDados();
      alert("Ronda finalizada com sucesso!");
    } catch (error) {
      console.error(error);
      alert("Erro ao finalizar ronda. Verifique a permissão de localização.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-5 text-white sm:px-6">
      <section className="mx-auto w-full max-w-md pb-24">
        <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-5 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600 text-white">
              <ShieldCheck size={24} />
            </div>

            <div>
              <h1 className="text-xl font-black">Ronda Operacional</h1>
              <p className="text-xs text-slate-400">
                Thanos Command • Central operacional do vigilante
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
            <p className="text-sm font-bold text-red-200">
              Uso exclusivo do vigilante em serviço
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-300">
              Ative a localização do celular para iniciar, registrar pontos e
              finalizar a ronda.
            </p>
          </div>

          <div
            className={`mt-4 rounded-2xl border p-4 ${
              online
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                : "border-yellow-500/20 bg-yellow-500/10 text-yellow-300"
            }`}
          >
            <p className="flex items-center gap-2 text-sm font-black">
              {online ? <Wifi size={18} /> : <WifiOff size={18} />}
              {online ? "Online" : "Offline"}
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-300">
              {pendenciasOffline.length > 0
                ? `${pendenciasOffline.length} registro(s) aguardando sincronização.`
                : online
                  ? "Registros enviados normalmente para a central."
                  : "Sem internet. Pontos e ocorrências serão salvos no celular."}
            </p>

            {online && pendenciasOffline.length > 0 && (
              <button
                type="button"
                onClick={sincronizarPendenciasOffline}
                className="mt-3 w-full rounded-xl bg-emerald-600 px-4 py-3 text-xs font-black text-white"
              >
                Sincronizar pendências agora
              </button>
            )}
          </div>

          {acessoLiberado && (
            <button
              type="button"
              onClick={() => setModalOcorrenciaAberto(true)}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-4 text-base font-black text-white transition active:scale-[0.98]"
            >
              <AlertTriangle size={20} />
              Abrir ocorrência rápida
            </button>
          )}
        </div>

        {!acessoLiberado ? (
          <div className="mt-5 rounded-[2rem] border border-slate-800 bg-slate-900 p-5 shadow-xl">
            <h2 className="text-lg font-black text-white">
              Acesso operacional
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Informe seu RE e código operacional para liberar a ronda.
            </p>

            <div className="mt-5 space-y-4">
              <input
                value={re}
                onChange={(e) => setRe(e.target.value)}
                placeholder="RE do vigilante"
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-4 text-base text-white outline-none focus:border-red-500"
              />

              <input
                value={codigoDigitado}
                onChange={(e) => setCodigoDigitado(e.target.value)}
                type="password"
                placeholder="Código operacional"
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-4 text-base text-white outline-none focus:border-red-500"
              />

              <button
                type="button"
                onClick={validarAcessoOperacional}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-4 text-base font-black text-white transition active:scale-[0.98]"
              >
                <ShieldCheck size={20} />
                Liberar acesso operacional
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={iniciarRonda}
            className="mt-5 rounded-[2rem] border border-slate-800 bg-slate-900 p-5 shadow-xl"
          >
            <h2 className="flex items-center gap-2 text-lg font-black">
              <UserRound size={20} />
              Identificação
            </h2>

            <div className="mt-5 space-y-4">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  value={buscaRe}
                  onChange={(e) => setBuscaRe(e.target.value)}
                  placeholder="Buscar por RE ou nome"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 py-4 pl-11 pr-4 text-base text-white outline-none focus:border-red-500"
                />
              </div>

              <select
                value={vigilanteSelecionadoId}
                onChange={(e) => selecionarVigilante(e.target.value)}
                disabled={carregandoDados}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-4 text-base text-white outline-none focus:border-red-500 disabled:opacity-60"
              >
                <option value="">
                  {carregandoDados
                    ? "Carregando vigilantes..."
                    : "Selecione seu RE"}
                </option>
                {vigilantesFiltrados.map((item) => (
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
                placeholder="RE"
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-4 text-base text-slate-300 outline-none"
              />
              <input
                value={vigilante}
                readOnly
                placeholder="Nome do vigilante"
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-4 text-base text-slate-300 outline-none"
              />

              <select
                value={postoSelecionadoId}
                onChange={(e) => selecionarPosto(e.target.value)}
                disabled={carregandoDados}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-4 text-base text-white outline-none focus:border-red-500 disabled:opacity-60"
              >
                <option value="">
                  {carregandoDados
                    ? "Carregando postos..."
                    : "Selecione o posto"}
                </option>
                {postos.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nome}
                  </option>
                ))}
              </select>

              <input
                value={posto}
                readOnly
                placeholder="Posto"
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-4 text-base text-slate-300 outline-none"
              />

              <select
                value={turno}
                onChange={(e) => setTurno(e.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-4 text-base text-white outline-none focus:border-red-500"
              >
                <option>Diurno</option>
                <option>Noturno</option>
                <option>Madrugada</option>
                <option>Extra</option>
              </select>

              <div className="rounded-2xl border border-slate-700 bg-slate-950 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-bold text-white">
                      <Camera size={18} />
                      Foto da ronda
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Tire uma foto como evidência operacional.
                    </p>
                  </div>

                  {fotoPreview && (
                    <button
                      type="button"
                      onClick={removerFoto}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500/10 text-red-300"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>

                {fotoPreview && (
                  <img
                    src={fotoPreview}
                    alt="Prévia da foto da ronda"
                    className="mt-4 h-48 w-full rounded-2xl object-cover"
                  />
                )}

                <label className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-slate-600 px-4 py-4 text-sm font-black text-slate-200 transition active:scale-[0.98]">
                  <ImagePlus size={18} />
                  {fotoPreview ? "Trocar foto" : "Tirar ou anexar foto"}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => selecionarFoto(e.target.files?.[0])}
                  />
                </label>
              </div>

              <textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Observações iniciais, se necessário"
                rows={4}
                className="w-full resize-none rounded-2xl border border-slate-700 bg-slate-950 px-4 py-4 text-base text-white outline-none focus:border-red-500"
              />

              {!rondaEmAndamento && (
                <button
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-4 text-base font-black text-white transition active:scale-[0.98] disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} /> Aguarde...
                    </>
                  ) : (
                    <>
                      <Play size={20} /> Iniciar ronda
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        )}

        {acessoLiberado && rondaEmAndamento && (
          <div className="mt-5 rounded-[2rem] border border-blue-500/30 bg-blue-500/10 p-5 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/20 text-blue-300">
                <Radar size={24} />
              </div>
              <div>
                <h2 className="text-lg font-black text-blue-100">
                  Ronda em andamento
                </h2>
                <p className="mt-1 text-sm text-slate-300">
                  {rondaEmAndamento.posto}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-2 text-sm text-slate-300">
              <p className="flex items-center gap-2">
                <Clock3 size={16} className="text-slate-500" /> Início:{" "}
                {rondaEmAndamento.inicioEm || "Não informado"}
              </p>
              <p className="flex items-center gap-2">
                <MapPin size={16} className="text-slate-500" /> Pontos GPS:{" "}
                {rondaEmAndamento.pontos?.length || 0}
              </p>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-950 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 text-sm font-bold text-white">
                    <Camera size={18} />
                    Evidência fotográfica
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Use antes de registrar ponto ou finalizar.
                  </p>
                </div>

                {fotoPreview && (
                  <button
                    type="button"
                    onClick={removerFoto}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500/10 text-red-300"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              {fotoPreview && (
                <img
                  src={fotoPreview}
                  alt="Prévia da evidência"
                  className="mt-4 h-48 w-full rounded-2xl object-cover"
                />
              )}

              <label className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-slate-600 px-4 py-4 text-sm font-black text-slate-200 transition active:scale-[0.98]">
                <ImagePlus size={18} />
                {fotoPreview ? "Trocar foto" : "Tirar ou anexar foto"}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => selecionarFoto(e.target.files?.[0])}
                />
              </label>
            </div>

            <div className="mt-5 grid gap-3">
              <button
                type="button"
                onClick={registrarPonto}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-600 bg-slate-950 px-5 py-4 text-base font-black text-white transition active:scale-[0.98] disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <MapPin size={20} />
                )}{" "}
                Registrar ponto GPS
              </button>

              <button
                type="button"
                onClick={finalizarRonda}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 text-base font-black text-white transition active:scale-[0.98] disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <StopCircle size={20} />
                )}{" "}
                Finalizar ronda
              </button>
            </div>
          </div>
        )}

        {acessoLiberado && (
          <div className="mt-5 rounded-[2rem] border border-slate-800 bg-slate-900 p-5">
            <h2 className="flex items-center gap-2 text-lg font-black">
              <CheckCircle2 size={20} /> Minhas últimas rondas
            </h2>

            <div className="mt-4 space-y-3">
              {!re && (
                <p className="rounded-2xl bg-slate-950 p-4 text-sm text-slate-400">
                  Selecione seu RE para visualizar suas últimas rondas.
                </p>
              )}
              {re && minhasRondas.length === 0 && (
                <p className="rounded-2xl bg-slate-950 p-4 text-sm text-slate-400">
                  Nenhuma ronda ativa encontrada para este RE.
                </p>
              )}

              {minhasRondasRecentes.map((ronda) => (
                <div
                  key={ronda.id}
                  className="rounded-2xl border border-slate-800 bg-slate-950 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-white">{ronda.posto}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {ronda.inicioEm || "Sem data"}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${ronda.status === "Concluída" ? "bg-emerald-500/10 text-emerald-300" : ronda.status === "Em andamento" ? "bg-blue-500/10 text-blue-300" : "bg-yellow-500/10 text-yellow-300"}`}
                    >
                      {ronda.status}
                    </span>
                  </div>

                  <p className="mt-3 text-xs text-slate-400">
                    Pontos GPS: {ronda.pontos?.length || 0} • Fotos:{" "}
                    {ronda.fotos?.length || 0}
                  </p>
                </div>
              ))}

              {re && minhasRondas.length > 0 && (
                <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950 p-3">
                  <button
                    type="button"
                    disabled={paginaHistorico <= 1}
                    onClick={() =>
                      setPaginaHistorico((paginaAtual) =>
                        Math.max(1, paginaAtual - 1),
                      )
                    }
                    className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Anterior
                  </button>

                  <span className="text-xs font-bold text-slate-400">
                    Página {paginaHistorico} de {totalPaginasHistorico}
                  </span>

                  <button
                    type="button"
                    disabled={paginaHistorico >= totalPaginasHistorico}
                    onClick={() =>
                      setPaginaHistorico((paginaAtual) =>
                        Math.min(totalPaginasHistorico, paginaAtual + 1),
                      )
                    }
                    className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Próxima
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-slate-600">
          Thanos Command • Ronda operacional inteligente
        </p>

        {acessoLiberado && modalOcorrenciaAberto && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 px-4 pb-4 pt-10 sm:items-center">
            <form
              onSubmit={abrirOcorrenciaRapida}
              className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-[2rem] border border-slate-700 bg-slate-900 p-5 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="flex items-center gap-2 text-xl font-black text-white">
                    <AlertTriangle size={22} className="text-red-400" />
                    Ocorrência rápida
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    A central receberá a ocorrência com foto, GPS, data e hora.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={fecharModalOcorrencia}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500/10 text-red-300"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-sm font-bold text-white">
                  {vigilante || "Vigilante não selecionado"}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  RE: {re || "Não informado"} • Posto:{" "}
                  {posto || "Não informado"}
                </p>
              </div>

              <div className="mt-5 space-y-4">
                <select
                  value={tipoOcorrencia}
                  onChange={(e) => setTipoOcorrencia(e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-4 text-base text-white outline-none focus:border-red-500"
                >
                  <option>Suspeita</option>
                  <option>Invasão</option>
                  <option>Furto/Roubo</option>
                  <option>Briga/Conflito</option>
                  <option>Portão/Acesso irregular</option>
                  <option>Dano patrimonial</option>
                  <option>Emergência médica</option>
                  <option>Incêndio</option>
                  <option>Outro</option>
                </select>

                <select
                  value={prioridadeOcorrencia}
                  onChange={(e) => setPrioridadeOcorrencia(e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-4 text-base text-white outline-none focus:border-red-500"
                >
                  <option>Baixa</option>
                  <option>Média</option>
                  <option>Alta</option>
                  <option>Crítica</option>
                </select>

                <div className="rounded-2xl border border-slate-700 bg-slate-950 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="flex items-center gap-2 text-sm font-bold text-white">
                        <Camera size={18} />
                        Foto da ocorrência
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Tire uma foto do local ou anexe evidência.
                      </p>
                    </div>

                    {fotoOcorrenciaPreview && (
                      <button
                        type="button"
                        onClick={() => {
                          setFotoOcorrencia(null);
                          setFotoOcorrenciaPreview("");
                        }}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500/10 text-red-300"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>

                  {fotoOcorrenciaPreview && (
                    <img
                      src={fotoOcorrenciaPreview}
                      alt="Prévia da ocorrência"
                      className="mt-4 h-48 w-full rounded-2xl object-cover"
                    />
                  )}

                  <label className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-slate-600 px-4 py-4 text-sm font-black text-slate-200 transition active:scale-[0.98]">
                    <ImagePlus size={18} />
                    {fotoOcorrenciaPreview
                      ? "Trocar foto"
                      : "Tirar ou anexar foto"}
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) =>
                        selecionarFotoOcorrencia(e.target.files?.[0])
                      }
                    />
                  </label>
                </div>

                <textarea
                  value={descricaoOcorrencia}
                  onChange={(e) => setDescricaoOcorrencia(e.target.value)}
                  placeholder="Descreva o que aconteceu..."
                  rows={5}
                  className="w-full resize-none rounded-2xl border border-slate-700 bg-slate-950 px-4 py-4 text-base text-white outline-none focus:border-red-500"
                />

                <button
                  disabled={loadingOcorrencia}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-4 text-base font-black text-white transition active:scale-[0.98] disabled:opacity-60"
                >
                  {loadingOcorrencia ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Enviando ocorrência...
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={20} />
                      Enviar ocorrência para central
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </section>
    </main>
  );
}
