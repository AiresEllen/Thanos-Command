"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
} from "lucide-react";

import { auth } from "../lib/firebase";

const links = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Vigilantes",
    href: "/vigilantes",
    icon: Users,
  },
  {
    name: "Postos",
    href: "/postos",
    icon: MapPinned,
  },
  {
    name: "Rondas",
    href: "/rondas",
    icon: Radar,
  },
  {
    name: "Ocorrências",
    href: "/ocorrencias",
    icon: AlertTriangle,
  },
  {
    name: "Relatórios",
    href: "/relatorios",
    icon: FileText,
  },
  {
    name: "Configurações",
    href: "/configuracoes",
    icon: Settings,
  },
];

export function Sidebar() {
  const router = useRouter();

  async function sair() {
    await signOut(auth);
    router.push("/login");
  }

  return (
    <aside className="hidden w-72 border-r border-slate-800 bg-slate-950 lg:flex lg:flex-col">
      <div className="flex items-center gap-3 border-b border-slate-800 p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600 shadow-lg shadow-red-600/20">
          <Shield className="text-white" />
        </div>

        <div>
          <h1 className="text-lg font-black tracking-wide text-white">
            THAΝOS COMMAND
          </h1>

          <p className="text-sm text-slate-400">
            Central operacional inteligente
          </p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-2 p-4">
        {links.map((link) => {
          const Icon = link.icon;

          return (
            <Link
              key={link.name}
              href={link.href}
              className="flex items-center gap-3 rounded-2xl px-4 py-3 text-slate-300 transition hover:bg-slate-900 hover:text-white"
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
  );
}
