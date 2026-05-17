"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { signOut } from "firebase/auth";
import {
  Shield,
  LayoutDashboard,
  Users,
  MapPinned,
  Radar,
  AlertTriangle,
  FileText,
  Settings,
  LogOut,
  BriefcaseBusiness,
  Archive,
  Menu,
  X,
} from "lucide-react";

import { auth } from "../lib/firebase";

const links = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Vigilantes", href: "/vigilantes", icon: Users },
  { name: "Postos", href: "/postos", icon: MapPinned },
  { name: "Rondas", href: "/rondas", icon: Radar },
  { name: "Ocorrências", href: "/ocorrencias", icon: AlertTriangle },
  { name: "Arquivo", href: "/arquivo-ocorrencias", icon: Archive },
  { name: "Extras", href: "/servicos-extras", icon: BriefcaseBusiness },
  { name: "Relatórios", href: "/relatorios", icon: FileText },
  { name: "Config.", href: "/configuracoes", icon: Settings },
];

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [menuAberto, setMenuAberto] = useState(false);

  async function sair() {
    await signOut(auth);
    router.push("/login");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setMenuAberto(true)}
        className="fixed left-4 top-4 z-50 flex items-center gap-3 rounded-3xl border border-slate-700 bg-slate-950/95 p-3 text-white shadow-2xl shadow-black/40 backdrop-blur lg:hidden"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-600 shadow-lg shadow-red-600/20">
          <Shield size={20} />
        </div>

        <div className="text-left">
          <p className="text-xs font-black leading-4">THANOS</p>
          <p className="text-xs font-black leading-4">COMMAND</p>
        </div>

        <div className="ml-1 flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-700 bg-slate-900">
          <Menu size={22} />
        </div>
      </button>

      {menuAberto && (
        <div className="fixed inset-0 z-[70] flex lg:hidden">
          <div
            onClick={() => setMenuAberto(false)}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
          />

          <aside className="relative flex h-full w-[86%] max-w-[330px] flex-col border-r border-slate-800 bg-slate-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600 shadow-lg shadow-red-600/20">
                  <Shield className="text-white" />
                </div>

                <div>
                  <h1 className="text-lg font-black tracking-wide text-white">
                    THANOS COMMAND
                  </h1>

                  <p className="text-sm text-slate-400">Central operacional</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMenuAberto(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-white"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
              {links.map((link) => {
                const Icon = link.icon;
                const ativo = pathname === link.href;

                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setMenuAberto(false)}
                    className={`flex items-center gap-3 rounded-2xl px-4 py-4 transition ${
                      ativo
                        ? "bg-red-600 text-white"
                        : "text-slate-300 hover:bg-slate-900 hover:text-white"
                    }`}
                  >
                    <Icon size={20} />

                    <span className="font-bold">{link.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-slate-800 p-4">
              <button
                type="button"
                onClick={sair}
                className="flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-slate-300 transition hover:bg-red-600 hover:text-white"
              >
                <LogOut size={20} />

                <span className="font-bold">Sair do sistema</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      <aside className="hidden w-72 shrink-0 border-r border-slate-800 bg-slate-950 lg:flex lg:flex-col">
        <div className="flex items-center gap-3 border-b border-slate-800 p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600 shadow-lg shadow-red-600/20">
            <Shield className="text-white" />
          </div>

          <div>
            <h1 className="text-lg font-black tracking-wide text-white">
              THANOS COMMAND
            </h1>

            <p className="text-sm text-slate-400">
              Central operacional inteligente
            </p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-2 p-4">
          {links.map((link) => {
            const Icon = link.icon;
            const ativo = pathname === link.href;

            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition ${
                  ativo
                    ? "bg-red-600 text-white"
                    : "text-slate-300 hover:bg-slate-900 hover:text-white"
                }`}
              >
                <Icon size={20} />

                <span className="font-medium">{link.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-800 p-4">
          <button
            type="button"
            onClick={sair}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-slate-300 transition hover:bg-red-600 hover:text-white"
          >
            <LogOut size={20} />

            <span className="font-medium">Sair do sistema</span>
          </button>
        </div>
      </aside>
    </>
  );
}
